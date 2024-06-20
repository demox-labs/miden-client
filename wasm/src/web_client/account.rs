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
use std::panic;
use serde_wasm_bindgen::Serializer;
use console_error_panic_hook;

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
        console_error_panic_hook::set_once();
        if let Some(client) = self.get_mut_inner() {
            let account_tuples = client.get_account_stubs().await.unwrap();
            web_sys::console::log_1(&format!("account_tuples {:?}", account_tuples).into());
            let accounts: Vec<SerializedAccountStub> = account_tuples.into_iter().map(|(account, _)| {
                SerializedAccountStub::new(
                    account.id().to_string(),
                    account.nonce().to_string(),
                    account.vault_root().to_string(),
                    account.storage_root().to_string(),
                    account.code_root().to_string(),
                    format!("{:?}", account.id().account_type()),
                    account.id().is_faucet(),
                    account.id().is_regular_account(),
                    account.id().is_on_chain()
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
        web_sys::console::log_1(&JsValue::from_str("get_account called"));
        if let Some(client) = self.get_mut_inner() {
            let native_account_id = AccountId::from_hex(&account_id).unwrap();

            let result = client.get_account(native_account_id).await.unwrap();

            serde_wasm_bindgen::to_value(&result.0.id().to_string())
                .map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub fn get_account_auth_by_pub_key(
        &mut self,
        pub_key_bytes: JsValue
    ) -> Result<JsValue, JsValue> {
        use miden_objects::Word;
        web_sys::console::log_1(&JsValue::from_str("get_account_auth_by_pub_key called"));
        if let Some(client) = self.get_mut_inner() {
            let pub_key_bytes_result: Vec<u8> = from_value(pub_key_bytes).unwrap();
            let pub_key_as_word = Word::read_from_bytes(pub_key_bytes_result.as_slice()).unwrap();

            let result = client.store().get_account_auth_by_pub_key(pub_key_as_word).unwrap();

            Ok(JsValue::from_str("Okay, it worked"))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn fetch_and_cache_account_auth_by_pub_key(
        &mut self,
        account_id: String
    ) -> Result<JsValue, JsValue> {
        use miden_objects::Word;
        web_sys::console::log_1(&JsValue::from_str("fetch_and_cache_account_auth_by_pub_key called"));
        if let Some(client) = self.get_mut_inner() {

            let result = client.store().fetch_and_cache_account_auth_by_pub_key(account_id).await.unwrap();

            Ok(JsValue::from_str("Okay, it worked"))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}