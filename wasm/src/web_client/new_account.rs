use wasm_bindgen::*;
use wasm_bindgen::prelude::*;
use super::WebClient;

use miden_objects::{
    accounts::AccountStorageType,
    assets::TokenSymbol,
};
use miden_client::client::accounts::{AccountTemplate, AccountStorageMode};

#[wasm_bindgen]
impl WebClient {
    pub async fn new_wallet(
        &mut self,
        storage_mode: String,
        mutable: bool
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let client_template = AccountTemplate::BasicWallet {
                mutable_code: mutable,
                storage_mode: match storage_mode.as_str() {
                    "OffChain" => AccountStorageMode::Local,
                    "OnChain" => AccountStorageMode::OnChain,
                    _ => return Err(JsValue::from_str("Invalid storage mode"))
                },
            };

            match client.new_account(client_template).await {
                Ok((account, _)) => {
                    // Create a struct or tuple to hold both values
                    // Convert directly to JsValue
                    serde_wasm_bindgen::to_value(&account.id().to_string())
                        .map_err(|e| JsValue::from_str(&e.to_string()))
                },
                Err(err) => {
                    let error_message = format!("Failed to create new account: {:?}", err);
                    Err(JsValue::from_str(&error_message))
                }
            }
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn new_faucet(
        &mut self,
        storage_type: String,
        non_fungible: bool,
        token_symbol: String,
        decimals: String,
        max_supply: String
    ) -> Result<JsValue, JsValue> {
        if non_fungible {
            return Err(JsValue::from_str("Non-fungible faucets are not supported yet"));
        }

        if let Some(client) = self.get_mut_inner() {
            let client_template = AccountTemplate::FungibleFaucet {
                token_symbol: TokenSymbol::new(&token_symbol)
                    .map_err(|e| JsValue::from_str(&e.to_string()))?,
                decimals: decimals.parse::<u8>()
                    .map_err(|e| JsValue::from_str(&e.to_string()))?,
                max_supply: max_supply.parse::<u64>()
                    .map_err(|e| JsValue::from_str(&e.to_string()))?,
                storage_mode: match storage_type.as_str() { // Note: Fixed typo in variable name
                    "OffChain" => AccountStorageType::OffChain,
                    "OnChain" => AccountStorageType::OnChain,
                    _ => return Err(JsValue::from_str("Invalid storage mode")),
                },
            };

            match client.new_account(client_template).await {
                Ok((account, _)) => {
                    // Create a struct or tuple to hold both values
                    // Convert directly to JsValue
                    serde_wasm_bindgen::to_value(&account.id().to_string())
                        .map_err(|e| JsValue::from_str(&e.to_string()))
                },
                Err(err) => {
                    let error_message = format!("Failed to create new account: {:?}", err);
                    Err(JsValue::from_str(&error_message))
                }
            }
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}