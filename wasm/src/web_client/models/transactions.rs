use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
pub struct NewTransactionResult {
    transaction_id: String,
    created_note_ids: Vec<String>,
}

#[wasm_bindgen]
impl NewTransactionResult {
    pub fn new(
        transaction_id: String, 
        created_note_ids: Vec<String>
    ) -> NewTransactionResult {
        NewTransactionResult {
            transaction_id,
            created_note_ids
        }
    }

    #[wasm_bindgen(getter)]
    pub fn transaction_id(&self) -> String {
        self.transaction_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn created_note_ids(&self) -> JsValue {
        JsValue::from_serde(&self.created_note_ids).unwrap()
    }
}

#[wasm_bindgen]
pub struct NewSwapTransactionResult {
    transaction_id: String,
    expected_output_note_ids: Vec<String>,
    expected_partial_note_ids: Vec<String>,
    payback_note_tag: String,
}

#[wasm_bindgen]
impl NewSwapTransactionResult {
    pub fn new(
        transaction_id: String, 
        expected_output_note_ids: Vec<String>,
        expected_partial_note_ids: Vec<String>,
        payback_note_tag: Option<String>,
    ) -> NewSwapTransactionResult {
        NewSwapTransactionResult {
            transaction_id,
            expected_output_note_ids,
            expected_partial_note_ids,
            payback_note_tag: payback_note_tag.unwrap_or_else(|| "".to_string()), // Use default value if None
        }
    }

    pub fn setNoteTag(&mut self, payback_note_tag: String) {
        self.payback_note_tag = payback_note_tag
    }

    #[wasm_bindgen(getter)]
    pub fn transaction_id(&self) -> String {
        self.transaction_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn expected_output_note_ids(&self) -> JsValue {
        JsValue::from_serde(&self.expected_output_note_ids).unwrap()
    }

    #[wasm_bindgen(getter)]
    pub fn expected_partial_note_ids(&self) -> JsValue {
        JsValue::from_serde(&self.expected_partial_note_ids).unwrap()
    }

    #[wasm_bindgen(getter)]
    pub fn payback_note_tag(&self) -> String {
        self.payback_note_tag.clone()
    }
}