use miden_objects::{
    accounts::AccountId,
    notes::{NoteAssets, NoteId, NoteInclusionProof, NoteMetadata, NoteScript},
    transaction::TransactionId,
    utils::Deserializable,
    Digest
};
use miden_tx::utils::Serializable;
use wasm_bindgen_futures::*;

use miden_client::{
    store::{NoteStatus, NoteRecordDetails, InputNoteRecord, OutputNoteRecord},
    errors::StoreError
};
// use crate::native_code::{errors::StoreError, store::note_record::{InputNoteRecord, NoteStatus, OutputNoteRecord}};

use crate::web_client::store::notes::{InputNoteIdxdbObject, OutputNoteIdxdbObject};
use super::js_bindings::*;

// TYPES
// ================================================================================================

type SerializedInputNoteData = (
    String, 
    Vec<u8>, 
    String, 
    String, 
    Option<String>, 
    String, 
    String,
    Vec<u8>,
    Option<String>
);

type SerializedOutputNoteData = (
    String,
    Vec<u8>,
    String,
    String,
    String,
    Option<String>,
    Option<String>,
    Option<Vec<u8>>,
    Option<String>,
);

// ================================================================================================

pub(crate) async fn update_note_consumer_tx_id(
    note_id: NoteId,
    consumer_tx_id: TransactionId,
) -> Result<(), StoreError> {
    let serialized_note_id = note_id.inner().to_string();
    let serialized_consumer_tx_id = consumer_tx_id.to_string();

    let promise = idxdb_update_note_consumer_tx_id(serialized_note_id, serialized_consumer_tx_id);
    let result = JsFuture::from(promise).await.unwrap();

    Ok(())
}

pub(crate) fn serialize_input_note(
    note: &InputNoteRecord
) -> Result<SerializedInputNoteData, StoreError> {
    let note_id = note.id().inner().to_string();
    let note_assets = note.assets().to_bytes();

    let (inclusion_proof, status) = match note.inclusion_proof() {
        Some(proof) => {
            let block_num = proof.origin().block_num;
            let node_index = proof.origin().node_index.value();
            let sub_hash = proof.sub_hash();
            let note_root = proof.note_root();

            let inclusion_proof = serde_json::to_string(&NoteInclusionProof::new(
                block_num,
                sub_hash,
                note_root,
                node_index,
                proof.note_path().clone(),
            )?)
            .map_err(StoreError::InputSerializationError)?;

            let status = serde_json::to_string(&NoteStatus::Committed)
                .map_err(StoreError::InputSerializationError)?
                .replace('\"', "");
            (Some(inclusion_proof), status)
        },
        None => {
            let status = serde_json::to_string(&NoteStatus::Pending)
                .map_err(StoreError::InputSerializationError)?
                .replace('\"', "");

            (None, status)
        },
    };
    let recipient = note.recipient().to_hex();

    let metadata = if let Some(metadata) = note.metadata() {
        Some(serde_json::to_string(metadata).map_err(StoreError::InputSerializationError)?)
    } else {
        None
    };

    let details =
        serde_json::to_string(&note.details()).map_err(StoreError::InputSerializationError)?;
    let note_script_hash = note.details().script_hash().to_hex();
    let serialized_note_script = note.details().script().to_bytes();

    Ok((
        note_id,
        note_assets,
        recipient,
        status,
        metadata,
        details,
        note_script_hash,
        serialized_note_script,
        inclusion_proof,
    ))
}

pub async fn insert_input_note_tx(
    note: &InputNoteRecord
) -> Result<(), StoreError> {
    let (
        note_id, 
        assets, 
        recipient, 
        status, 
        metadata, 
        details, 
        note_script_hash,
        serialized_note_script,
        inclusion_proof
    ) = serialize_input_note(note)?;

    let promise = idxdb_insert_input_note(
        note_id,
        assets,
        recipient,
        status,
        metadata,
        details,
        note_script_hash,
        serialized_note_script,
        inclusion_proof
    );
    JsFuture::from(promise).await.unwrap();

    Ok(())
}

pub(crate) fn serialize_output_note(
    note: &OutputNoteRecord,
) -> Result<SerializedOutputNoteData, StoreError> {
    let note_id = note.id().inner().to_string();
    let note_assets = note.assets().to_bytes();
    let (inclusion_proof, status) = match note.inclusion_proof() {
        Some(proof) => {
            let block_num = proof.origin().block_num;
            let node_index = proof.origin().node_index.value();
            let sub_hash = proof.sub_hash();
            let note_root = proof.note_root();

            let inclusion_proof = serde_json::to_string(&NoteInclusionProof::new(
                block_num,
                sub_hash,
                note_root,
                node_index,
                proof.note_path().clone(),
            )?)
            .map_err(StoreError::InputSerializationError)?;

            let status = serde_json::to_string(&NoteStatus::Committed)
                .map_err(StoreError::InputSerializationError)?
                .replace('\"', "");

            (Some(inclusion_proof), status)
        },
        None => {
            let status = serde_json::to_string(&NoteStatus::Pending)
                .map_err(StoreError::InputSerializationError)?
                .replace('\"', "");

            (None, status)
        },
    };
    let recipient = note.recipient().to_hex();

    let metadata =
        serde_json::to_string(note.metadata()).map_err(StoreError::InputSerializationError)?;

    let details = if let Some(details) = note.details() {
        Some(serde_json::to_string(&details).map_err(StoreError::InputSerializationError)?)
    } else {
        None
    };
    let note_script_hash = note.details().map(|details| details.script_hash().to_hex());
    let serialized_note_script = note.details().map(|details| details.script().to_bytes());

    Ok((
        note_id,
        note_assets,
        recipient,
        status,
        metadata,
        details,
        note_script_hash,
        serialized_note_script,
        inclusion_proof,
    ))
}

pub async fn insert_output_note_tx(
    note: &OutputNoteRecord
) -> Result<(), StoreError> {
    let (
        note_id, 
        assets, 
        recipient,
        status, 
        metadata, 
        details,
        note_script_hash,
        serialized_note_script, 
        inclusion_proof
    ) = serialize_output_note(note)?;

    let result = JsFuture::from(idxdb_insert_output_note(
        note_id,
        assets,
        recipient,
        status,
        metadata,
        details,
        note_script_hash,
        serialized_note_script,
        inclusion_proof
    )).await; 
    match result {
        Ok(_) => Ok(()),
        Err(_) => Err(StoreError::QueryError("Failed to insert output note".to_string())),
    }
}

pub fn parse_input_note_idxdb_object(
    note_idxdb: InputNoteIdxdbObject
) -> Result<InputNoteRecord, StoreError> {
    // Merge the info that comes from the input notes table and the notes script table
    let note_script = NoteScript::read_from_bytes(&note_idxdb.serialized_note_script)?;
    let note_details: NoteRecordDetails =
        serde_json::from_str(&note_idxdb.details).map_err(StoreError::JsonDataDeserializationError)?;
    let note_details = NoteRecordDetails::new(
        note_details.nullifier().to_string(),
        note_script,
        note_details.inputs().clone(),
        note_details.serial_num(),
    );

    let note_metadata: Option<NoteMetadata> = if let Some(metadata_as_json_str) = note_idxdb.metadata {
        Some(
            serde_json::from_str(&metadata_as_json_str)
                .map_err(StoreError::JsonDataDeserializationError)?,
        )
    } else {
        None
    };

    let note_assets = NoteAssets::read_from_bytes(&note_idxdb.assets)?;

    let inclusion_proof = match note_idxdb.inclusion_proof {
        Some(note_inclusion_proof) => {
            let note_inclusion_proof: NoteInclusionProof =
                serde_json::from_str(&note_inclusion_proof)
                    .map_err(StoreError::JsonDataDeserializationError)?;

            Some(note_inclusion_proof)
        },
        _ => None,
    };

    let recipient = Digest::try_from(note_idxdb.recipient)?;
    let id = NoteId::new(recipient, note_assets.commitment());
    let status: NoteStatus = serde_json::from_str(&format!("\"{0}\"", note_idxdb.status))
        .map_err(StoreError::JsonDataDeserializationError)?;
    let consumer_account_id: Option<AccountId> = match note_idxdb.consumer_account_id {
        Some(account_id) => Some(AccountId::from_hex(&account_id)?),
        None => None,
    };

    Ok(InputNoteRecord::new(
        id,
        recipient,
        note_assets,
        status,
        note_metadata,
        inclusion_proof,
        note_details,
        consumer_account_id
    ))
}

pub fn parse_output_note_idxdb_object(
    note_idxdb: OutputNoteIdxdbObject
) -> Result<OutputNoteRecord, StoreError> {
    let note_details: Option<NoteRecordDetails> = if let Some(details_as_json_str) = note_idxdb.details {
        // Merge the info that comes from the input notes table and the notes script table
        let serialized_note_script = note_idxdb.serialized_note_script
            .expect("Has note details so it should have the serialized script");
        let note_script = NoteScript::read_from_bytes(&serialized_note_script)?;
        let note_details: NoteRecordDetails = serde_json::from_str(&details_as_json_str)
            .map_err(StoreError::JsonDataDeserializationError)?;
        let note_details = NoteRecordDetails::new(
            note_details.nullifier().to_string(),
            note_script,
            note_details.inputs().clone(),
            note_details.serial_num(),
        );

        Some(note_details)
    } else {
        None
    };

    let note_metadata: NoteMetadata =
        serde_json::from_str(&note_idxdb.metadata).map_err(StoreError::JsonDataDeserializationError)?;

    let note_assets = NoteAssets::read_from_bytes(&note_idxdb.assets)?;

    let inclusion_proof = match note_idxdb.inclusion_proof {
        Some(note_inclusion_proof) => {
            let note_inclusion_proof: NoteInclusionProof =
                serde_json::from_str(&note_inclusion_proof)
                    .map_err(StoreError::JsonDataDeserializationError)?;

            Some(note_inclusion_proof)
        },
        _ => None,
    };

    let recipient = Digest::try_from(note_idxdb.recipient)?;
    let id = NoteId::new(recipient, note_assets.commitment());
    let status: NoteStatus = serde_json::from_str(&format!("\"{0}\"", note_idxdb.status))
        .map_err(StoreError::JsonDataDeserializationError)?;

    let consumer_account_id: Option<AccountId> = match note_idxdb.consumer_account_id {
        Some(account_id) => Some(AccountId::try_from(account_id.parse::<u64>().unwrap())?),
        None => None,
    };

    Ok(OutputNoteRecord::new(
        id,
        recipient,
        note_assets,
        status,
        note_metadata,
        inclusion_proof,
        note_details,
        consumer_account_id,
    ))
}