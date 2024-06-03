use miden_objects::{
    accounts::AccountId, 
    assets::FungibleAsset, 
    crypto::rand::FeltRng, 
    notes::{
        NoteId, NoteType as MidenNoteType
    }
};

use super::WebClient;
use crate::web_client::models::transactions::NewTransactionResult;

use miden_client::{
    client::Client,
    client::transactions::TransactionRecord,
    store::TransactionFilter
};
// use crate::native_code::{
//     errors::NoteIdPrefixFetchError, 
//     rpc::NodeRpcClient, 
//     store::{
//         note_record::InputNoteRecord, 
//         NoteFilter, 
//         Store, 
//         TransactionFilter
//     }, 
//     transactions::transaction_request::{
//         PaymentTransactionData, TransactionTemplate
//     }, Client
// };

use serde::{Serialize, Deserialize};
use serde_wasm_bindgen::from_value;

use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
impl WebClient {
    pub async fn get_transactions(
        &mut self
    ) -> Result<JsValue, JsValue> {
        web_sys::console::log_1(&JsValue::from_str("get_transactions called"));
        if let Some(client) = self.get_mut_inner() {

            let transactions: Vec<TransactionRecord> = client
                .get_transactions(TransactionFilter::All)
                .await
                .map_err(|e| JsValue::from_str(&format!("Error fetching transactions: {:?}", e)))?;

            let transactionIds: Vec<String> = transactions.iter().map(|transaction| {
                transaction.id.to_string()
            }).collect();

            serde_wasm_bindgen::to_value(&transactionIds).map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }
}