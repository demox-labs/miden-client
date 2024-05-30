use miden_lib::transaction::TransactionKernel;
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen::from_value;
use wasm_bindgen_futures::*;
use web_sys::console;
use wasm_bindgen::prelude::*;

use miden_objects::{
    accounts::{Account, AccountCode, AccountId, AccountStorage, AccountStub}, assembly::ModuleAst, assets::{Asset, AssetVault}, Digest, Felt, Word
};
use miden_objects::accounts::AuthSecretKey;

use miden_objects::utils::Deserializable;

use miden_client::{errors::StoreError, store::{AuthInfo, NoteFilter, Store}}; 

use super::WebStore;

mod js_bindings;
use js_bindings::*;

mod models;
use models::*;

pub(crate) mod utils;
use utils::*;

impl WebStore {
    pub(crate) fn insert_account(
        &mut self,
        account: &Account,
        account_seed: Option<Word>,
        auth_secret_key: &AuthSecretKey,
    ) -> Result<(), StoreError> {
        insert_account_code(account.code()).unwrap();
        insert_account_storage(account.storage()).unwrap();
        insert_account_asset_vault(account.vault()).unwrap();
        insert_account_record(account, account_seed).unwrap();
        insert_account_auth(account.id(), auth_secret_key).unwrap();

        Ok(())
    }
}