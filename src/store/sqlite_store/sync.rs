// Exclude this file when the target is wasm32
#![cfg(not(target_arch = "wasm32"))]
use miden_objects::notes::{NoteInclusionProof, NoteTag};
use rusqlite::{named_params, params};

use super::SqliteStore;
use crate::{
    client::sync::StateSyncUpdate,
    errors::StoreError,
    store::sqlite_store::{accounts::update_account, notes::insert_input_note_tx},
};

impl SqliteStore {
    pub(crate) fn get_note_tags(&self) -> Result<Vec<NoteTag>, StoreError> {
        const QUERY: &str = "SELECT tags FROM state_sync";

        self.db()
            .prepare(QUERY)?
            .query_map([], |row| row.get(0))
            .expect("no binding parameters used in query")
            .map(|result| {
                result.map_err(|err| StoreError::ParsingError(err.to_string())).and_then(
                    |v: String| {
                        serde_json::from_str(&v).map_err(StoreError::JsonDataDeserializationError)
                    },
                )
            })
            .next()
            .expect("state sync tags exist")
    }

    pub(super) fn add_note_tag(&self, tag: NoteTag) -> Result<bool, StoreError> {
        let mut tags = self.get_note_tags()?;
        if tags.contains(&tag) {
            return Ok(false);
        }
        tags.push(tag);
        let tags = serde_json::to_string(&tags).map_err(StoreError::InputSerializationError)?;

        const QUERY: &str = "UPDATE state_sync SET tags = ?";
        self.db().execute(QUERY, params![tags])?;

        Ok(true)
    }

    pub(super) fn remove_note_tag(&self, tag: NoteTag) -> Result<bool, StoreError> {
        let mut tags = self.get_note_tags()?;
        if let Some(index_of_tag) = tags.iter().position(|&tag_candidate| tag_candidate == tag) {
            tags.remove(index_of_tag);

            let tags = serde_json::to_string(&tags).map_err(StoreError::InputSerializationError)?;

            const QUERY: &str = "UPDATE state_sync SET tags = ?";
            self.db().execute(QUERY, params![tags])?;
            return Ok(true);
        }

        Ok(false)
    }

    pub(super) fn get_sync_height(&self) -> Result<u32, StoreError> {
        const QUERY: &str = "SELECT block_num FROM state_sync";

        self.db()
            .prepare(QUERY)?
            .query_map([], |row| row.get(0))
            .expect("no binding parameters used in query")
            .map(|result| Ok(result?).map(|v: i64| v as u32))
            .next()
            .expect("state sync block number exists")
    }

    pub(super) fn apply_state_sync(
        &self,
        state_sync_update: StateSyncUpdate,
    ) -> Result<(), StoreError> {
        let StateSyncUpdate {
            block_header,
            nullifiers,
            synced_new_notes: committed_notes,
            transactions_to_commit: committed_transactions,
            new_mmr_peaks,
            new_authentication_nodes,
            updated_onchain_accounts,
            block_has_relevant_notes,
        } = state_sync_update;

        let mut db = self.db();
        let tx = db.transaction()?;

        // Update state sync block number
        const BLOCK_NUMBER_QUERY: &str = "UPDATE state_sync SET block_num = ?";
        tx.execute(BLOCK_NUMBER_QUERY, params![block_header.block_num()])?;

        // Update spent notes
        for nullifier in nullifiers.iter() {
            const SPENT_INPUT_NOTE_QUERY: &str =
                "UPDATE input_notes SET status = 'Consumed' WHERE json_extract(details, '$.nullifier') = ?";
            let nullifier = nullifier.to_hex();
            tx.execute(SPENT_INPUT_NOTE_QUERY, params![nullifier])?;

            const SPENT_OUTPUT_NOTE_QUERY: &str =
                "UPDATE output_notes SET status = 'Consumed' WHERE json_extract(details, '$.nullifier') = ?";
            tx.execute(SPENT_OUTPUT_NOTE_QUERY, params![nullifier])?;
        }

        Self::insert_block_header_tx(&tx, block_header, new_mmr_peaks, block_has_relevant_notes)?;

        // Insert new authentication nodes (inner nodes of the PartialMmr)
        Self::insert_chain_mmr_nodes_tx(&tx, &new_authentication_nodes)?;

        // Update tracked output notes
        for (note_id, inclusion_proof) in committed_notes.updated_output_notes().iter() {
            let block_num = inclusion_proof.origin().block_num;
            let sub_hash = inclusion_proof.sub_hash();
            let note_root = inclusion_proof.note_root();
            let note_index = inclusion_proof.origin().node_index.value();

            let inclusion_proof = serde_json::to_string(&NoteInclusionProof::new(
                block_num,
                sub_hash,
                note_root,
                note_index,
                inclusion_proof.note_path().clone(),
            )?)
            .map_err(StoreError::InputSerializationError)?;

            // Update output notes
            const COMMITTED_OUTPUT_NOTES_QUERY: &str =
                "UPDATE output_notes SET status = 'Committed', inclusion_proof = json(:inclusion_proof) WHERE note_id = :note_id";

            tx.execute(
                COMMITTED_OUTPUT_NOTES_QUERY,
                named_params! {
                    ":inclusion_proof": inclusion_proof,
                    ":note_id": note_id.inner().to_hex(),
                },
            )?;
        }

        // Update tracked input notes
        for input_note in committed_notes.updated_input_notes().iter() {
            let inclusion_proof = input_note.proof();
            let metadata = input_note.note().metadata();

            let inclusion_proof = serde_json::to_string(inclusion_proof)
                .map_err(StoreError::InputSerializationError)?;
            let metadata =
                serde_json::to_string(metadata).map_err(StoreError::InputSerializationError)?;

            const COMMITTED_INPUT_NOTES_QUERY: &str =
                "UPDATE input_notes SET status = 'Committed', inclusion_proof = json(:inclusion_proof), metadata = json(:metadata) WHERE note_id = :note_id";

            tx.execute(
                COMMITTED_INPUT_NOTES_QUERY,
                named_params! {
                    ":inclusion_proof": inclusion_proof,
                    ":metadata": metadata,
                    ":note_id": input_note.id().inner().to_hex(),
                },
            )?;
        }

        // Commit new public notes
        for note in committed_notes.new_public_notes() {
            insert_input_note_tx(&tx, &note.clone().into())?;
        }

        // Mark transactions as committed
        Self::mark_transactions_as_committed(
            &tx,
            block_header.block_num(),
            &committed_transactions,
        )?;

        // Update onchain accounts on the db that have been updated onchain
        for account in updated_onchain_accounts {
            update_account(&tx, &account)?;
        }

        // Commit the updates
        tx.commit()?;

        Ok(())
    }
}
