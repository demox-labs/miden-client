use super::WebClient;

use base64::encode;
use miden_objects::{accounts::{AccountData, AccountId}, assets::TokenSymbol, notes::NoteId};
use miden_tx::utils::{Deserializable, Serializable};

use miden_client::client::accounts;
use miden_client::rpc::NodeRpcClient;
use miden_client::store::Store;
use miden_client::store::AuthInfo;

use serde::{Serialize, Deserialize};
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;
use web_sys::console;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AccountTemplate {
    BasicImmutable,
    BasicMutable,
    FungibleFaucet {
        token_symbol: String,
        decimals: String, // u8
        max_supply: String // u64
    },
    NonFungibleFaucet,
}

// Account functions to be exposed to the JavaScript environment
// For now, just a simple function that calls an underlying store method
// and inserts a string to the indexedDB store. Also tests out a simple
// RPC call. 
#[wasm_bindgen]
impl WebClient {
    pub fn new_account(
        &mut self,
        template: JsValue
    ) -> Result<JsValue, JsValue> {
        if let Some(ref mut client) = self.get_mut_inner() {
            let account_template_result: Result<AccountTemplate, _> = from_value(template);
            match account_template_result {
                Ok(account_template) => {
                    let client_template = match account_template {
                        AccountTemplate::BasicImmutable => accounts::AccountTemplate::BasicWallet {
                            mutable_code: false,
                            storage_mode: accounts::AccountStorageMode::Local,
                        },
                        AccountTemplate::BasicMutable => accounts::AccountTemplate::BasicWallet {
                            mutable_code: true,
                            storage_mode: accounts::AccountStorageMode::Local,
                        },
                        AccountTemplate::FungibleFaucet {
                            token_symbol,
                            decimals,
                            max_supply,
                        } => accounts::AccountTemplate::FungibleFaucet {
                            token_symbol: TokenSymbol::new(&token_symbol).unwrap(),
                            decimals: decimals.parse::<u8>().unwrap(),
                            max_supply: max_supply.parse::<u64>().unwrap(),
                            storage_mode: accounts::AccountStorageMode::Local,
                        },
                        AccountTemplate::NonFungibleFaucet => todo!(),
                    };

                    match client.new_account(client_template) {
                        Ok((account, _)) => {
                            // Create a struct or tuple to hold both values
                            // Convert directly to JsValue
                            serde_wasm_bindgen::to_value(&account.id().to_string()).map_err(|e| JsValue::from_str(&e.to_string()))
                        },
                        Err(err) => {
                            let error_message = format!("Failed to create new account: {:?}", err);
                            Err(JsValue::from_str(&error_message))
                        }
                    }
                },
                Err(e) => {
                    let error_message = format!("Failed to parse AccountTemplate: {:?}", e);
                    Err(JsValue::from_str(&error_message))
                }
            }
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}