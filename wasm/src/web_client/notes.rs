use miden_objects::{notes::NoteId, utils::Serializable, Digest};
use miden_tx::utils::Deserializable;
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen::from_value;
use web_sys::console;

use miden_client::store::InputNoteRecord;
use miden_client::store::NoteFilter;

use super::WebClient;

#[derive(Serialize, Deserialize)]
pub enum WebClientNoteFilter {
    All,
    Pending,
    Committed,
    Consumed,
}

#[wasm_bindgen]
impl WebClient {
    pub async fn get_input_notes(
        &mut self, 
        filter: JsValue
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let filter: WebClientNoteFilter = from_value(filter).unwrap();
            let native_filter = match filter {
                WebClientNoteFilter::Pending => NoteFilter::Pending,
                WebClientNoteFilter::Committed => NoteFilter::Committed,
                WebClientNoteFilter::Consumed => NoteFilter::Consumed,
                WebClientNoteFilter::All => NoteFilter::All
            };

            let notes: Vec<InputNoteRecord> = client.get_input_notes(native_filter).await.unwrap();
            let note_ids = notes.iter().map(|note| 
                note.id().to_string()
            ).collect::<Vec<String>>();

            // Convert the Vec<String> to JsValue
            serde_wasm_bindgen::to_value(&note_ids).map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn get_input_note(
        &mut self,
        note_id: String
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let note_id: NoteId = Digest::try_from(note_id)
                .map_err(|err| format!("Failed to parse input note id: {}", err))?
                .into();
            let note: InputNoteRecord = client.get_input_note(note_id).await.unwrap();

            serde_wasm_bindgen::to_value(&note.id().to_string()).map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn get_output_notes(
        &mut self, 
        filter: JsValue
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let filter: WebClientNoteFilter = from_value(filter).unwrap();
            let native_filter = match filter {
                WebClientNoteFilter::Pending => NoteFilter::Pending,
                WebClientNoteFilter::Committed => NoteFilter::Committed,
                WebClientNoteFilter::Consumed => NoteFilter::Consumed,
                WebClientNoteFilter::All => NoteFilter::All
            };

            let notes: Vec<InputNoteRecord> = client.get_output_notes(native_filter).await.unwrap();
            let note_ids = notes.iter().map(|note| 
                note.id().to_string()
            ).collect::<Vec<String>>();

            // Convert the Vec<String> to JsValue
            serde_wasm_bindgen::to_value(&note_ids).map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    pub async fn get_output_note(
        &mut self,
        note_id: String
    ) -> Result<JsValue, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let note_id: NoteId = Digest::try_from(note_id)
                .map_err(|err| format!("Failed to parse output note id: {}", err))?
                .into();
            let note: InputNoteRecord = client.get_output_note(note_id).await.unwrap();

            serde_wasm_bindgen::to_value(&note.id().to_string()).map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}