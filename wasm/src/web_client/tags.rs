use super::WebClient;

use miden_objects::notes::NoteTag;

use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
impl WebClient {
    pub async fn add_tag(
        &mut self,
        tag: String,
    ) -> Result<JsValue, JsValue> {
        web_sys::console::log_1(&JsValue::from_str("add_tag called"));
        if let Some(client) = self.get_mut_inner() {
            let note_tag_as_u32 = tag.parse::<u32>().unwrap();
            let note_tag: NoteTag = note_tag_as_u32.into();
            client.add_note_tag(note_tag).await.unwrap();

            Ok(JsValue::from_str("Okay, it worked"))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}