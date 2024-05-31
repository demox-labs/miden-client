use wasm_bindgen::*;
use wasm_bindgen::prelude::*;

use miden_client::store::{InputNoteRecord, NoteFilter};
use miden_objects::Digest;

use crate::web_client::WebClient;

#[wasm_bindgen]
impl WebClient {
    pub async fn export_note(
        &mut self,
        note_id: String
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let note_id = Digest::try_from(note_id)
                .map_err(|err| format!("Failed to parse input note id: {}", err))?
                .into();

            let output_note = client
                .get_output_notes(NoteFilter::Unique(note_id))?
                .pop()
                .expect("should have an output note");

            // Convert output note into InputNoteRecord before exporting
            let input_note: InputNoteRecord = output_note
                .try_into()
                .map_err(|_err| format!("Can't export note with ID {}", note_id.to_hex()))?;

            let input_note_bytes = input_note.to_bytes();

            Ok(input_note_bytes)
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}