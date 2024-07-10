use wasm_bindgen::*;
use wasm_bindgen::prelude::*;

use miden_client::store::{InputNoteRecord, NoteFilter};
use miden_objects::{
    utils::Serializable,
    Digest
};

use crate::web_client::WebClient;

use web_sys::console;

#[wasm_bindgen]
impl WebClient {
    pub async fn export_note(
        &mut self,
        note_id: String
    ) -> Result<JsValue, JsValue> {
        web_sys::console::log_1(&JsValue::from_str("export_note called"));
        if let Some(client) = self.get_mut_inner() {
            let note_id = Digest::try_from(note_id)
                .map_err(|err| format!("Failed to parse input note id: {}", err))?
                .into();
            web_sys::console::log_1(&JsValue::from_str("export_note 1"));

            let output_note = client
                .get_output_notes(NoteFilter::Unique(note_id)).await.unwrap()
                .pop().unwrap();
            web_sys::console::log_1(&JsValue::from_str("export_note 2"));

            // Convert output note into InputNoteRecord before exporting
            let input_note: InputNoteRecord = output_note
                .try_into()
                .map_err(|_err| format!("Can't export note with ID {}", note_id.to_hex()))?;
            web_sys::console::log_1(&JsValue::from_str("export_note 3"));

            let input_note_bytes = input_note.to_bytes();
            web_sys::console::log_1(&JsValue::from_str("export_note 4"));

            let serialized_input_note_bytes = serde_wasm_bindgen::to_value(&input_note_bytes)
                .unwrap_or_else(|_| wasm_bindgen::throw_val(JsValue::from_str("Serialization error")));
            web_sys::console::log_1(&JsValue::from_str("export_note 5"));

            Ok(serialized_input_note_bytes)
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}