use async_trait::async_trait;
use core::fmt;
use tonic::Response;
use tonic_web_wasm_client::Client;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::*;

use miden_objects::{
    accounts::{Account, AccountId},
    notes::{Note, NoteId, NoteMetadata, NoteTag, NoteType},
    transaction::ProvenTransaction,
    utils::Deserializable,
    BlockHeader, Digest, Felt,
};
use miden_objects::crypto::merkle::MmrProof;
use miden_tx::utils::Serializable;

use miden_client::{
    errors::{ConversionError, NodeRpcClientError},
    rpc::{
        CommittedNote, NodeRpcClient, NodeRpcClientEndpoint, NoteDetails, NoteInclusionDetails,
        StateSyncInfo
    },
};

pub struct WebRpcClient {
    endpoint: String
}

impl WebRpcClient {
    pub fn new(endpoint: &str) -> Self {
        Self {
            endpoint: endpoint.to_string()
        }
    }
}

#[async_trait(?Send)]
impl NodeRpcClient for WebRpcClient {
    async fn submit_proven_transaction(
        &mut self,
        proven_transaction: ProvenTransaction,
    ) -> Result<(), NodeRpcClientError> {
      unimplemented!()
    }

    async fn get_block_header_by_number(
        &mut self,
        block_num: Option<u32>,
        include_mmr_proof: bool,
    ) -> Result<(BlockHeader, Option<MmrProof>), NodeRpcClientError> {
      unimplemented!()
    }

    async fn get_notes_by_id(
        &mut self,
        note_ids: &[NoteId],
    ) -> Result<Vec<NoteDetails>, NodeRpcClientError> {
      unimplemented!()
    }

    /// Sends a sync state request to the Miden node, validates and converts the response
    /// into a [StateSyncInfo] struct.
    async fn sync_state(
        &mut self,
        block_num: u32,
        account_ids: &[AccountId],
        note_tags: &[NoteTag],
        nullifiers_tags: &[u16],
    ) -> Result<StateSyncInfo, NodeRpcClientError> {
      unimplemented!()
    }
    
    /// Sends a [GetAccountDetailsRequest] to the Miden node, and extracts an [Account] from the
    /// `GetAccountDetailsResponse` response.
    ///
    /// # Errors
    ///
    /// This function will return an error if:
    ///
    /// - The provided account is not on-chain: this is due to the fact that for offchain accounts
    /// the client is responsible
    /// - There was an error sending the request to the node
    /// - The answer had a `None` for its account, or the account had a `None` at the `details` field.
    /// - There is an error during [Account] deserialization
    async fn get_account_update(
        &mut self,
        account_id: AccountId
    ) -> Result<Account, NodeRpcClientError> {
      unimplemented!()
    }
}

// STATE SYNC INFO CONVERSION
// ================================================================================================

// impl TryFrom<SyncStateResponse> for StateSyncInfo {
//     type Error = NodeRpcClientError;

//     fn try_from(value: SyncStateResponse) -> Result<Self, Self::Error> {
//       unimplemented!()
//     }
// }