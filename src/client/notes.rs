use miden_objects::{
    accounts::AccountId,
    assembly::ProgramAst,
    crypto::rand::FeltRng,
    notes::{NoteId, NoteInclusionProof, NoteScript},
};
use miden_tx::{ScriptTarget, TransactionAuthenticator};
use tracing::info;

use super::{note_screener::NoteRelevance, rpc::NodeRpcClient, Client};
use crate::{
    client::NoteScreener,
    errors::ClientError,
    store::{InputNoteRecord, NoteFilter, OutputNoteRecord, Store},
};

// TYPES
// --------------------------------------------------------------------------------------------
/// Contains information about a note that can be consumed
pub struct ConsumableNote {
    /// The consumable note
    pub note: InputNoteRecord,
    /// Stores which accounts can consume the note and it's relevance
    pub relevances: Vec<(AccountId, NoteRelevance)>,
}

impl<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator> Client<N, R, S, A> {
    // INPUT NOTE DATA RETRIEVAL
    // --------------------------------------------------------------------------------------------

    /// Returns input notes managed by this client.
    #[cfg(not(feature = "wasm"))]
    pub fn get_input_notes(&self, filter: NoteFilter) -> Result<Vec<InputNoteRecord>, ClientError> {
        self.store.get_input_notes(filter).map_err(|err| err.into())
    }

    #[cfg(feature = "wasm")]
    pub async fn get_input_notes(&mut self, filter: NoteFilter<'_>) -> Result<Vec<InputNoteRecord>, ClientError> {
        self.store().get_input_notes(filter).await.map_err(|err| err.into())
    }

    /// Returns input notes that are able to be consumed by the account_id.
    ///
    /// If account_id is None then all consumable input notes are returned.
    #[cfg(not(feature = "wasm"))]
    pub fn get_consumable_notes(
        &self,
        account_id: Option<AccountId>,
    ) -> Result<Vec<ConsumableNote>, ClientError> {
        let commited_notes = self.store.get_input_notes(NoteFilter::Committed)?;

        let note_screener = NoteScreener::new(self.store.clone());

        let mut relevant_notes = Vec::new();
        for input_note in commited_notes {
            let account_relevance =
                note_screener.check_relevance(&input_note.clone().try_into()?)?;

            if account_relevance.is_empty() {
                continue;
            }

            relevant_notes.push(ConsumableNote {
                note: input_note,
                relevances: account_relevance,
            });
        }

        if let Some(account_id) = account_id {
            relevant_notes.retain(|note| note.relevances.iter().any(|(id, _)| *id == account_id));
        }

        Ok(relevant_notes)
    }

    #[cfg(feature = "wasm")]
    pub async fn get_consumable_notes(
        &mut self,
        account_id: Option<AccountId>,
    ) -> Result<Vec<ConsumableNote>, ClientError> {
        let commited_notes = self.store().get_input_notes(NoteFilter::Committed).await?;

        let note_screener = NoteScreener::new(self.store.clone());

        let mut relevant_notes = Vec::new();
        for input_note in commited_notes {
            let account_relevance =
                note_screener.check_relevance(&input_note.clone().try_into()?).await?;

            if account_relevance.is_empty() {
                continue;
            }

            relevant_notes.push(ConsumableNote {
                note: input_note,
                relevances: account_relevance,
            });
        }

        if let Some(account_id) = account_id {
            relevant_notes.retain(|note| note.relevances.iter().any(|(id, _)| *id == account_id));
        }

        Ok(relevant_notes)
    }

    /// Returns the input note with the specified hash.
    #[cfg(not(feature = "wasm"))]
    pub fn get_input_note(&self, note_id: NoteId) -> Result<InputNoteRecord, ClientError> {
        Ok(self
            .store
            .get_input_notes(NoteFilter::Unique(note_id))?
            .pop()
            .expect("The vector always has one element for NoteFilter::Unique"))
    }

    #[cfg(feature = "wasm")]
    pub async fn get_input_note(&mut self, note_id: NoteId) -> Result<InputNoteRecord, ClientError> {
        Ok(self
            .store()
            .get_input_notes(NoteFilter::Unique(note_id)).await?
            .pop()
            .expect("The vector always has one element for NoteFilter::Unique"))
    }

    // OUTPUT NOTE DATA RETRIEVAL
    // --------------------------------------------------------------------------------------------

    /// Returns output notes managed by this client.
    #[cfg(not(feature = "wasm"))]
    pub fn get_output_notes(
        &self,
        filter: NoteFilter,
    ) -> Result<Vec<OutputNoteRecord>, ClientError> {
        self.store.get_output_notes(filter).map_err(|err| err.into())
    }

    #[cfg(feature = "wasm")]
    pub async fn get_output_notes(
        &mut self,
        filter: NoteFilter<'_>,
    ) -> Result<Vec<OutputNoteRecord>, ClientError> {
        self.store().get_output_notes(filter).await.map_err(|err| err.into())
    }

    /// Returns the output note with the specified hash.
    #[cfg(not(feature = "wasm"))]
    pub fn get_output_note(&self, note_id: NoteId) -> Result<OutputNoteRecord, ClientError> {
        Ok(self
            .store
            .get_output_notes(NoteFilter::Unique(note_id))?
            .pop()
            .expect("The vector always has one element for NoteFilter::Unique"))
    }

    #[cfg(feature = "wasm")]
    pub async fn get_output_note(&mut self, note_id: NoteId) -> Result<OutputNoteRecord, ClientError> {
        Ok(self
            .store()
            .get_output_notes(NoteFilter::Unique(note_id)).await?
            .pop()
            .expect("The vector always has one element for NoteFilter::Unique"))
    }

    // INPUT NOTE CREATION
    // --------------------------------------------------------------------------------------------

    /// Imports a new input note into the client's store. The `verify` parameter dictates whether or
    /// not the method verifies the existence of the note in the chain.
    ///
    /// If the imported note is verified to be on chain and it doesn't contain an inclusion proof
    /// the method tries to build one.
    /// If the verification fails then a [ClientError::ExistenceVerificationError] is raised.
    pub async fn import_input_note(
        &mut self,
        note: InputNoteRecord,
        verify: bool,
    ) -> Result<(), ClientError> {
        if !verify {
            #[cfg(not(feature = "wasm"))]
            return self.store.insert_input_note(&note).map_err(|err| err.into());

            #[cfg(feature = "wasm")]
            return self.store().insert_input_note(&note).await.map_err(|err| err.into());
        }

        // Verify that note exists in chain
        #[cfg(not(feature = "wasm"))]
        let mut chain_notes = self.rpc_api.get_notes_by_id(&[note.id()]).await?;

        #[cfg(feature = "wasm")]
        let mut chain_notes = self.rpc_api().get_notes_by_id(&[note.id()]).await?;

        if chain_notes.is_empty() {
            return Err(ClientError::ExistenceVerificationError(note.id()));
        }

        let note_details = chain_notes.pop().expect("chain_notes should have at least one element");
        let inclusion_details = note_details.inclusion_details();

        // If the note exists in the chain and the client is synced to a height equal or
        // greater than the note's creation block, get MMR and block header data for the
        // note's block. Additionally create the inclusion proof if none is provided.
        #[cfg(not(feature = "wasm"))]
        let sync_height = self.get_sync_height()?;

        #[cfg(feature = "wasm")]
        let sync_height = self.get_sync_height().await?;
        let inclusion_proof = if sync_height >= inclusion_details.block_num {
            // Add the inclusion proof to the imported note
            info!("Requesting MMR data for past block num {}", inclusion_details.block_num);
            let block_header =
                self.get_and_store_authenticated_block(inclusion_details.block_num).await?;

            let built_inclusion_proof = NoteInclusionProof::new(
                inclusion_details.block_num,
                block_header.sub_hash(),
                block_header.note_root(),
                inclusion_details.note_index.into(),
                inclusion_details.merkle_path.clone(),
            )?;

            // If the imported note already provides an inclusion proof, check that
            // it equals the one we constructed from node data.
            if let Some(proof) = note.inclusion_proof() {
                if proof != &built_inclusion_proof {
                    return Err(ClientError::NoteImportError(
                        "Constructed inclusion proof does not equal the provided one".to_string(),
                    ));
                }
            }

            Some(built_inclusion_proof)
        } else {
            None
        };

        let note = InputNoteRecord::new(
            note.id(),
            note.recipient(),
            note.assets().clone(),
            note.status(),
            note.metadata().copied(),
            inclusion_proof,
            note.details().clone(),
            None,
        );

        #[cfg(not(feature = "wasm"))]
        {
            return self.store.insert_input_note(&note).map_err(|err| err.into());
        }

        #[cfg(feature = "wasm")]
        {
            return self.store().insert_input_note(&note).await.map_err(|err| err.into());
        }
    }

    /// Compiles the provided program into a [NoteScript] and checks (to the extent possible) if
    /// the specified note program could be executed against all accounts with the specified
    /// interfaces.
    pub fn compile_note_script(
        &self,
        note_script_ast: ProgramAst,
        target_account_procs: Vec<ScriptTarget>,
    ) -> Result<NoteScript, ClientError> {
        self.tx_executor
            .compile_note_script(note_script_ast, target_account_procs)
            .map_err(ClientError::TransactionExecutorError)
    }
}
