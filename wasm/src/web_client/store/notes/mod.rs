use miden_objects::notes::{NoteAssets, NoteId, NoteInclusionProof, NoteInputs, NoteMetadata, NoteScript, Nullifier};
use miden_objects::Digest;
use miden_tx::utils::Deserializable;
use serde_wasm_bindgen::from_value;
use wasm_bindgen_futures::*;

use super::WebStore;
use miden_client::{
    errors::StoreError,
    store::{InputNoteRecord, NoteFilter, OutputNoteRecord}
};
// use crate::native_code::errors::StoreError;
// use crate::native_code::store::note_record::{
//     InputNoteRecord, 
//     NoteRecordDetails, 
//     NoteStatus, 
//     OutputNoteRecord
// };
// use crate::native_code::store::NoteFilter;
use crate::web_client::notes::WebClientNoteFilter;

mod js_bindings;
use js_bindings::*;

mod models;
use models::*;

pub(crate) mod utils;
use utils::*;

use web_sys::console;
use wasm_bindgen::*;

impl WebStore {
    pub(crate) async fn get_input_notes(
        &self,
        filter: NoteFilter<'_>
    ) -> Result<Vec<InputNoteRecord>, StoreError> {
        let promise = match filter {
            NoteFilter::All | NoteFilter::Consumed | NoteFilter::Committed | NoteFilter::Pending => {
                let filter_as_str = match filter {
                    NoteFilter::All => "All",
                    NoteFilter::Consumed => "Consumed",
                    NoteFilter::Committed => "Committed",
                    NoteFilter::Pending => "Pending",
                    _ => unreachable!(), // Safety net, should never be reached
                };
    
                // Assuming `js_fetch_notes` is your JavaScript function that handles simple string filters
                idxdb_get_input_notes(filter_as_str.to_string())
            },
            NoteFilter::List(ids) => {
                let note_ids_as_str: Vec<String> = ids.into_iter().map(|id| id.inner().to_string()).collect();
                idxdb_get_input_notes_from_ids(note_ids_as_str)
            },
            NoteFilter::Unique(id) => {
                let note_id_as_str = id.inner().to_string();
                let note_ids = vec![note_id_as_str];
                idxdb_get_input_notes_from_ids(note_ids)
            }
        };

        let js_value = JsFuture::from(promise).await.unwrap();
        let input_notes_idxdb: Vec<InputNoteIdxdbObject> = from_value(js_value).unwrap();

        let native_input_notes: Result<Vec<InputNoteRecord>, StoreError> = input_notes_idxdb
            .into_iter()
            .map(parse_input_note_idxdb_object) // Simplified closure
            .collect::<Result<Vec<_>, _>>(); // Collect results into a single Result

        match native_input_notes {
            Ok(ref notes) => match filter {
                NoteFilter::Unique(note_id) if notes.is_empty() => {
                    return Err(StoreError::NoteNotFound(note_id));
                },
                NoteFilter::List(note_ids) if note_ids.len() != notes.len() => {
                    let missing_note_id = note_ids
                        .iter()
                        .find(|&&note_id| !notes.iter().any(|note_record| note_record.id() == note_id))
                        .expect("should find one note id that wasn't retrieved by the db");
                    return Err(StoreError::NoteNotFound(*missing_note_id));
                },
                _ => {},
            },
            Err(e) => return Err(e),
        }

        native_input_notes
    }

    pub(crate) async fn get_output_notes(
        &self, 
        filter: NoteFilter<'_>
    ) -> Result<Vec<OutputNoteRecord>, StoreError> {
        web_sys::console::log_1(&JsValue::from_str("get_output_notes called"));
        let promise = match filter {
            NoteFilter::All | NoteFilter::Consumed | NoteFilter::Committed | NoteFilter::Pending => {
                let filter_as_str = match filter {
                    NoteFilter::All => "All",
                    NoteFilter::Consumed => "Consumed",
                    NoteFilter::Committed => "Committed",
                    NoteFilter::Pending => "Pending",
                    _ => unreachable!(), // Safety net, should never be reached
                };
    
                // Assuming `js_fetch_notes` is your JavaScript function that handles simple string filters
                web_sys::console::log_1(&JsValue::from_str("get_output_notes 2"));
                idxdb_get_output_notes(filter_as_str.to_string())
            },
            NoteFilter::List(ids) => {
                let note_ids_as_str: Vec<String> = ids.into_iter().map(|id| id.inner().to_string()).collect();
                idxdb_get_output_notes_from_ids(note_ids_as_str)
            },
            NoteFilter::Unique(id) => {
                let note_id_as_str = id.inner().to_string();
                let note_ids = vec![note_id_as_str];
                idxdb_get_output_notes_from_ids(note_ids)
            }
        };

        web_sys::console::log_1(&JsValue::from_str("get_output_notes 3"));
        let js_value = JsFuture::from(promise).await.unwrap();
        web_sys::console::log_1(&JsValue::from_str("get_output_notes 4"));
        let output_notes_idxdb: Vec<OutputNoteIdxdbObject> = from_value(js_value).unwrap();
        web_sys::console::log_1(&JsValue::from_str("get_output_notes 5"));

        let native_output_notes: Result<Vec<OutputNoteRecord>, StoreError> = output_notes_idxdb
            .into_iter()
            .map(parse_output_note_idxdb_object) // Simplified closure
            .collect::<Result<Vec<_>, _>>(); // Collect results into a single Result
        web_sys::console::log_1(&JsValue::from_str("get_output_notes 6"));

        match native_output_notes {
            Ok(ref notes) => match filter {
                NoteFilter::Unique(note_id) if notes.is_empty() => {
                    return Err(StoreError::NoteNotFound(note_id));
                },
                NoteFilter::List(note_ids) if note_ids.len() != notes.len() => {
                    let missing_note_id = note_ids
                        .iter()
                        .find(|&&note_id| !notes.iter().any(|note_record| note_record.id() == note_id))
                        .expect("should find one note id that wasn't retrieved by the db");
                    return Err(StoreError::NoteNotFound(*missing_note_id));
                },
                _ => {},
            },
            Err(e) => return Err(e),
        }
        web_sys::console::log_1(&JsValue::from_str("get_output_notes 7"));

        native_output_notes
    }

    pub(crate) async fn insert_input_note(
        &self,
        note: &InputNoteRecord
    ) -> Result<(), StoreError> {
        insert_input_note_tx(note).await
    }

    pub(crate) async fn get_unspent_input_note_nullifiers(
        &self
    ) -> Result<Vec<Nullifier>, StoreError>{
        let promise = idxdb_get_unspent_input_note_nullifiers();
        let js_value = JsFuture::from(promise).await.unwrap();
        let nullifiers_as_str: Vec<String> = from_value(js_value).unwrap();

        let nullifiers = nullifiers_as_str.into_iter().map(|s| {
            Digest::try_from(s).map(Nullifier::from).map_err(StoreError::HexParseError)
        }).collect::<Result<Vec<Nullifier>, _>>();

        return nullifiers;
    }
}
