use super::WebClient;
use crate::web_client::models::accounts::SerializedAccountStub;

use base64::encode;
use miden_objects::{accounts::{AccountData, AccountId}, assets::TokenSymbol, notes::NoteId};
use miden_tx::utils::{Deserializable, Serializable};

use miden_client::client::accounts;
use miden_client::client::rpc::NodeRpcClient;
use miden_client::store::Store;

use serde::{Serialize, Deserialize};
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;
use web_sys::console;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AccountTemplate {
    BasicImmutable {
        storage_mode: String // AccountStorageMode
    },
    BasicMutable {
        storage_mode: String // AccountStorageMode
    },
    FungibleFaucet {
        token_symbol: String,
        decimals: String, // u8
        max_supply: String, // u64
        storage_mode: String
    },
    NonFungibleFaucet {
        storage_mode: String
    },
}

// Account functions to be exposed to the JavaScript environment
// For now, just a simple function that calls an underlying store method
// and inserts a string to the indexedDB store. Also tests out a simple
// RPC call. 
#[wasm_bindgen]
impl WebClient {
    pub async fn get_accounts(
        &mut self
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let account_tuples = client.get_account_stubs().await.unwrap();
            let accounts: Vec<SerializedAccountStub> = account_tuples.into_iter().map(|(account, _)| {
                SerializedAccountStub::new(
                    account.id().to_string(),
                    account.nonce().to_string(),
                    account.vault_root().to_string(),
                    account.storage_root().to_string(),
                    account.code_root().to_string(),
                )
            }).collect();

            let accounts_as_js_value = serde_wasm_bindgen::to_value(&accounts)
                .unwrap_or_else(|_| wasm_bindgen::throw_val(JsValue::from_str("Serialization error")));

            Ok(accounts_as_js_value)
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn get_account(
        &mut self,
        account_id: String
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let native_account_id = AccountId::from_hex(&account_id).unwrap();

            let result = client.get_account(native_account_id).await.unwrap();

            serde_wasm_bindgen::to_value(&result.0.id().to_string())
                .map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}