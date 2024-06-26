use miden_objects::{
    accounts::Account, 
    crypto::merkle::{
        InOrderIndex, MmrPeaks
    }, 
    notes::NoteInclusionProof, 
    transaction::TransactionId, 
    BlockHeader, Digest
};
use wasm_bindgen_futures::*;
use serde_wasm_bindgen::from_value;

use crate::native_code::{errors::StoreError, sync::SyncedNewNotes};

use super::{chain_data::utils::serialize_chain_mmr_node, notes::utils::insert_input_note_tx, transactions::utils::update_account, WebStore};

mod js_bindings;
use js_bindings::*;

mod models;
use models::*;

impl WebStore {
    pub(crate) async fn get_note_tags(
        &self
    ) -> Result<Vec<u64>, StoreError>{
        let promsie = idxdb_get_note_tags();
        let js_value = JsFuture::from(promsie).await.unwrap();
        let tags_idxdb: NoteTagsIdxdbObject = from_value(js_value).unwrap();

        let tags: Vec<u64> = serde_json::from_str(&tags_idxdb.tags).unwrap();

        return Ok(tags);
    }

    pub(super) async fn get_sync_height(
        &self
    ) -> Result<u32, StoreError> {
        let promise = idxdb_get_sync_height();
        let js_value = JsFuture::from(promise).await.unwrap();
        let block_num_idxdb: SyncHeightIdxdbObject = from_value(js_value).unwrap();

        let block_num_as_u32: u32 = block_num_idxdb.block_num.parse::<u32>().unwrap();
        return Ok(block_num_as_u32);
    }

    pub(super) async fn add_note_tag(
        &mut self,
        tag: u64
    ) -> Result<bool, StoreError> {
        let mut tags = self.get_note_tags().await.unwrap();
        if tags.contains(&tag) {
            return Ok(false);
        }
        tags.push(tag);
        let tags = serde_json::to_string(&tags).map_err(StoreError::InputSerializationError)?;

        let promise = idxdb_add_note_tag(tags);
        JsFuture::from(promise).await.unwrap();
        return Ok(true);
    }

    pub(super) async fn apply_state_sync(
        &mut self,
        block_header: BlockHeader,
        nullifiers: Vec<Digest>,
        committed_notes: SyncedNewNotes,
        committed_transactions: &[TransactionId],
        new_mmr_peaks: MmrPeaks,
        new_authentication_nodes: &[(InOrderIndex, Digest)],
        updated_onchain_accounts: &[Account],
    ) -> Result<(), StoreError> {
        // Serialize data for updating state sync and block header
        let block_num_as_str = block_header.block_num().to_string();
        
        // Serialize data for updating spent notes
        let nullifiers_as_str = nullifiers.iter().map(|nullifier| nullifier.to_hex()).collect();
        
        // Serialize data for updating block header
        let block_header_as_str = serde_json::to_string(&block_header).map_err(StoreError::InputSerializationError)?;
        let new_mmr_peaks_as_str = serde_json::to_string(&new_mmr_peaks.peaks().to_vec()).map_err(StoreError::InputSerializationError)?;
        let block_has_relevant_notes = !committed_notes.is_empty();

        // Serialize data for updating chain MMR nodes
        let mut serialized_node_ids = Vec::new();
        let mut serialized_nodes = Vec::new();
        for (id, node) in new_authentication_nodes.iter() {
            let (serialized_id, serialized_node) = serialize_chain_mmr_node(*id, *node)?;
            serialized_node_ids.push(serialized_id);
            serialized_nodes.push(serialized_node);
        };

        // Serialize data for updating committed notes
        let note_ids_as_str: Vec<String> = committed_notes.new_inclusion_proofs().iter().map(|(note_id, _)| note_id.inner().to_hex()).collect();
        let inclusion_proofs_as_str: Vec<String> = committed_notes.new_inclusion_proofs().iter().map(|(_, inclusion_proof)| { 
            let block_num = inclusion_proof.origin().block_num;
            let sub_hash = inclusion_proof.sub_hash();
            let note_root = inclusion_proof.note_root();
            let note_index = inclusion_proof.origin().node_index.value();

            // Create a NoteInclusionProof and serialize it to JSON, handle errors with `?`
            let proof = NoteInclusionProof::new(
                block_num,
                sub_hash,
                note_root,
                note_index,
                inclusion_proof.note_path().clone(),
            ).unwrap();
            
            serde_json::to_string(&proof).unwrap()
        }).collect();

        // TODO: LOP INTO idxdb_apply_state_sync call
        // Commit new public notes
        for note in committed_notes.new_public_notes() {
            insert_input_note_tx(&note.clone().into()).await.unwrap();
        }

        // Serialize data for updating committed transactions
        let transactions_to_commit_as_str: Vec<String> = committed_transactions.iter().map(|tx_id| tx_id.to_string()).collect();

        // TODO: LOP INTO idxdb_apply_state_sync call
        // Update onchain accounts on the db that have been updated onchain
        for account in updated_onchain_accounts {
            update_account(account.clone()).await.unwrap();
        }

        let promise = idxdb_apply_state_sync(
            block_num_as_str,
            nullifiers_as_str,
            block_header_as_str,
            new_mmr_peaks_as_str,
            block_has_relevant_notes,
            serialized_node_ids,
            serialized_nodes,
            note_ids_as_str,
            inclusion_proofs_as_str,
            transactions_to_commit_as_str,
        );
        JsFuture::from(promise).await.unwrap();

        Ok(())
    }
}