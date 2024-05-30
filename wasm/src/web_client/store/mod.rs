use std::collections::BTreeMap;

use async_trait::async_trait;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::*;

use miden_objects::{
    accounts::{Account, AccountId, AccountStub}, crypto::merkle::{InOrderIndex, MmrPeaks}, notes::{NoteId, NoteInclusionProof}, transaction::TransactionId, BlockHeader, Digest, Word
};
use miden_objects::notes::NoteTag;
use miden_objects::accounts::AuthSecretKey;
use miden_client::client::sync::StateSyncUpdate;

use miden_client::{
    errors::{ClientError, StoreError}, store::{
        note_record::{InputNoteRecord, OutputNoteRecord}, AuthInfo, ChainMmrNodeFilter, NoteFilter, Store, TransactionFilter
    }, sync::SyncedNewNotes, transactions::{TransactionRecord, TransactionResult}
}; 

pub mod accounts;

// Initialize IndexedDB
#[wasm_bindgen(module = "/js/db/schema.js")]
extern "C" {
    #[wasm_bindgen(js_name = openDatabase)]
    fn setup_indexed_db() -> js_sys::Promise;
}

pub struct WebStore {}

impl WebStore {
    pub async fn new() -> Result<WebStore, ()> {
        JsFuture::from(setup_indexed_db()).await;
        Ok(WebStore {})
    }
}

impl Store for WebStore {
    fn get_note_tags(&self) -> Result<Vec<NoteTag>, StoreError> {
        unimplemented!()
    }

    fn add_note_tag(&self, tag: NoteTag) -> Result<bool, StoreError> {
        unimplemented!()
    }

    fn remove_note_tag(&self, tag: NoteTag) -> Result<bool, StoreError> {
        unimplemented!()
    }

    fn get_sync_height(&self) -> Result<u32, StoreError> {
      unimplemented!()
    }

    fn apply_state_sync(&self, state_sync_update: StateSyncUpdate) -> Result<(), StoreError> {
      unimplemented!()
    }

    fn get_transactions(
        &self,
        transaction_filter: TransactionFilter,
    ) -> Result<Vec<TransactionRecord>, StoreError> {
      unimplemented!()
    }

    fn apply_transaction(&self, tx_result: TransactionResult) -> Result<(), StoreError> {
      unimplemented!()
    }

    fn get_input_notes(&self, note_filter: NoteFilter) -> Result<Vec<InputNoteRecord>, StoreError> {
      unimplemented!()
    }

    fn get_output_notes(
        &self,
        note_filter: NoteFilter,
    ) -> Result<Vec<OutputNoteRecord>, StoreError> {
      unimplemented!()
    }

    fn insert_input_note(&self, note: &InputNoteRecord) -> Result<(), StoreError> {
      unimplemented!()
    }

    fn insert_block_header(
        &self,
        block_header: BlockHeader,
        chain_mmr_peaks: MmrPeaks,
        has_client_notes: bool,
    ) -> Result<(), StoreError> {
      unimplemented!()
    }

    fn get_block_headers(
        &self,
        block_numbers: &[u32],
    ) -> Result<Vec<(BlockHeader, bool)>, StoreError> {
      unimplemented!()
    }

    fn get_tracked_block_headers(&self) -> Result<Vec<BlockHeader>, StoreError> {
      unimplemented!()
    }

    fn get_chain_mmr_nodes(
        &self,
        filter: ChainMmrNodeFilter,
    ) -> Result<BTreeMap<InOrderIndex, Digest>, StoreError> {
      unimplemented!()
    }

    fn insert_chain_mmr_nodes(&self, nodes: &[(InOrderIndex, Digest)]) -> Result<(), StoreError> {
      unimplemented!()
    }

    fn get_chain_mmr_peaks_by_block_num(&self, block_num: u32) -> Result<MmrPeaks, StoreError> {
      unimplemented!()
    }

    fn insert_account(
        &self,
        account: &Account,
        account_seed: Option<Word>,
        auth_info: &AuthSecretKey,
    ) -> Result<(), StoreError> {
      self.insert_account(account, account_seed, auth_info)
    }

    fn get_account_ids(&self) -> Result<Vec<AccountId>, StoreError> {
      unimplemented!()
    }

    fn get_account_stubs(&self) -> Result<Vec<(AccountStub, Option<Word>)>, StoreError> {
      unimplemented!()
    }

    fn get_account_stub(
        &self,
        account_id: AccountId,
    ) -> Result<(AccountStub, Option<Word>), StoreError> {
      unimplemented!()
    }

    fn get_account(&self, account_id: AccountId) -> Result<(Account, Option<Word>), StoreError> {
      unimplemented!()
    }

    fn get_account_auth(&self, account_id: AccountId) -> Result<AuthSecretKey, StoreError> {
      unimplemented!()
    }

    fn get_account_auth_by_pub_key(&self, pub_key: Word) -> Result<AuthSecretKey, StoreError> {
      unimplemented!()
    }
}