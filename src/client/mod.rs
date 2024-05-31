use alloc::rc::Rc;

use miden_objects::{
    crypto::rand::{FeltRng, RpoRandomCoin},
    Felt,
};
use miden_tx::{TransactionAuthenticator, TransactionExecutor};
#[cfg(not(feature = "wasm"))]
use rand::Rng;
#[cfg(feature = "wasm")]
use rand::{rngs::StdRng, Rng, SeedableRng};
use tracing::info;

use crate::{
    errors::IdPrefixFetchError,
    store::{data_store::ClientDataStore, InputNoteRecord, NoteFilter as ClientNoteFilter, Store}
};

pub mod rpc;
use rpc::NodeRpcClient;

pub mod accounts;
#[cfg(any(test, feature = "wasm"))]
pub mod chain_data;
pub mod note_screener;
pub mod notes;
pub mod store_authenticator;
pub mod sync;
pub mod transactions;
pub use note_screener::NoteRelevance;
pub(crate) use note_screener::NoteScreener;
pub use notes::ConsumableNote;

// MIDEN CLIENT
// ================================================================================================

/// A light client for connecting to the Miden rollup network.
///
/// Miden client is responsible for managing a set of accounts. Specifically, the client:
/// - Keeps track of the current and historical states of a set of accounts and related objects
///   such as notes and transactions.
/// - Connects to one or more Miden nodes to periodically sync with the current state of the
///   network.
/// - Executes, proves, and submits transactions to the network as directed by the user.
pub struct Client<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator> {
    /// The client's store, which provides a way to write and read entities to provide persistence.
    store: Rc<S>,
    /// An instance of [FeltRng] which provides randomness tools for generating new keys,
    /// serial numbers, etc.
    rng: R,
    /// An instance of [NodeRpcClient] which provides a way for the client to connect to the
    /// Miden node.
    rpc_api: N,
    tx_executor: TransactionExecutor<ClientDataStore<S>, A>,
}

impl<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator> Client<N, R, S, A> {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------

    /// Returns a new instance of [Client].
    ///
    /// ## Arguments
    ///
    /// - `api`: An instance of [NodeRpcClient] which provides a way for the client to connect
    ///   to the Miden node.
    /// - `store`: An instance of [Store], which provides a way to write and read entities to
    ///   provide persistence.
    /// - `executor_store`: An instance of [Store] that provides a way for [TransactionExecutor] to
    ///   retrieve relevant inputs at the moment of transaction execution. It should be the same
    ///   store as the one for `store`, but it doesn't have to be the **same instance**.
    /// - `authenticator`: Defines the transaction authenticator that will be used by the
    ///   transaction executor whenever a signature is requested from within the VM.
    /// - `in_debug_mode`: Instantiates the transaction executor (and in turn, its compiler)
    ///   in debug mode, which will enable debug logs for scripts compiled with this mode for
    ///   easier MASM debugging.
    ///
    /// # Errors
    ///
    /// Returns an error if the client could not be instantiated.
    pub fn new(api: N, rng: R, store: Rc<S>, authenticator: A, in_debug_mode: bool) -> Self {
        if in_debug_mode {
            info!("Creating the Client in debug mode.");
        }

        let data_store = ClientDataStore::new(store.clone());
        let authenticator = Some(Rc::new(authenticator));
        let tx_executor = TransactionExecutor::new(data_store, authenticator);

        Self { store, rng, rpc_api: api, tx_executor }
    }

    #[cfg(any(test, feature = "test_utils", feature = "wasm"))]
    pub fn rpc_api(&mut self) -> &mut N {
        &mut self.rpc_api
    }

    #[cfg(any(test, feature = "test_utils", feature = "wasm"))]
    pub fn store(&mut self) -> &S {
        &self.store
    }

    #[cfg(any(test, feature = "test_utils", feature = "wasm"))]
    pub fn rng(&mut self) -> &mut R {
        &mut self.rng
    }
}

// HELPERS
// --------------------------------------------------------------------------------------------

/// Gets [RpoRandomCoin] from the client
#[cfg(not(feature = "wasm"))]
pub fn get_random_coin() -> RpoRandomCoin {
    // TODO: Initialize coin status once along with the client and persist status for retrieval
    let mut rng = rand::thread_rng();
    let coin_seed: [u64; 4] = rng.gen();

    RpoRandomCoin::new(coin_seed.map(Felt::new))
}

/// Gets [RpoRandomCoin] from the client. Uses StdRng for wasm32 target
#[cfg(feature = "wasm")]
pub fn get_random_coin() -> RpoRandomCoin {
    // TODO: Initialize coin status once along with the client and persist status for retrieval
    let mut rng = StdRng::from_entropy();
    let coin_seed: [u64; 4] = rng.gen();

    RpoRandomCoin::new(coin_seed.map(Felt::new))
}

#[cfg(feature = "wasm")]
pub async fn get_input_note_with_id_prefix<
    N: NodeRpcClient,
    R: FeltRng,
    S: Store,
    A: TransactionAuthenticator,
>(
    client: &mut Client<N, R, S, A>,
    note_id_prefix: &str,
) -> Result<InputNoteRecord, IdPrefixFetchError> {
    let mut input_note_records = client
        .get_input_notes(ClientNoteFilter::All).await
        .map_err(|err| {
            tracing::error!("Error when fetching all notes from the store: {err}");
            IdPrefixFetchError::NoMatch(format!("note ID prefix {note_id_prefix}").to_string())
        })?
        .into_iter()
        .filter(|note_record| note_record.id().to_hex().starts_with(note_id_prefix))
        .collect::<Vec<_>>();

    if input_note_records.is_empty() {
        return Err(IdPrefixFetchError::NoMatch(
            format!("note ID prefix {note_id_prefix}").to_string(),
        ));
    }
    if input_note_records.len() > 1 {
        let input_note_record_ids = input_note_records
            .iter()
            .map(|input_note_record| input_note_record.id())
            .collect::<Vec<_>>();
        tracing::error!(
            "Multiple notes found for the prefix {}: {:?}",
            note_id_prefix,
            input_note_record_ids
        );
        return Err(IdPrefixFetchError::MultipleMatches(
            format!("note ID prefix {note_id_prefix}").to_string(),
        ));
    }

    Ok(input_note_records
        .pop()
        .expect("input_note_records should always have one element"))
}