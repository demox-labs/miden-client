use serde_wasm_bindgen::from_value;
use wasm_bindgen::*;
use wasm_bindgen::prelude::*;

use miden_objects::{
    accounts::AccountData,
    utils::Deserializable
};
use miden_client::store::InputNoteRecord;

use crate::web_client::WebClient;

use web_sys::console;
use base64::decode;

#[wasm_bindgen]
impl WebClient {
    pub async fn import_account(
        &mut self,
        account_bytes: JsValue
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let account_bytes_result: Vec<u8> = from_value(account_bytes).unwrap();
            let account_data = AccountData::read_from_bytes(&account_bytes_result).map_err(|err| err.to_string())?;
            let account_id = account_data.account.id().to_string();

            match client.import_account(account_data).await {
                Ok(_) => {
                    let message = format!("Imported account with ID: {}", account_id);
                    Ok(JsValue::from_str(&message))
                },
                Err(err) => {
                    let error_message = format!("Failed to import account: {:?}", err);
                    Err(JsValue::from_str(&error_message))
                }
            }
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn import_note(
        &mut self,
        note_bytes: JsValue,
        verify: bool
    ) -> Result<JsValue, JsValue> {
        web_sys::console::log_1(&JsValue::from_str("import_note called"));
        if let Some(client) = self.get_mut_inner() {
            let note_bytes_result: Vec<u8> = from_value(note_bytes).unwrap();
            // let note_bytes_result = decode(note_bytes).unwrap();
            web_sys::console::log_1(&JsValue::from_str("import_note 2"));
            let input_note_record =
                InputNoteRecord::read_from_bytes(&note_bytes_result).map_err(|err| err.to_string())?;
                web_sys::console::log_1(&JsValue::from_str("import_note 3"));
            let note_id = input_note_record.id();
            web_sys::console::log_1(&JsValue::from_str("import_note 4"));

            match client.import_input_note(input_note_record, verify).await {
                Ok(_) => {
                    Ok(JsValue::from_str(note_id.to_string().as_str()))
                },
                Err(err) => {
                    let error_message = format!("Failed to import note: {:?}", err);
                    Err(JsValue::from_str(&error_message))
                
                }
            }
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}