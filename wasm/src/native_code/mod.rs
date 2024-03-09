pub mod accounts;

pub mod store;
use store::Store;

pub mod rpc;
use rpc::NodeRpcClient;

// Hoping that eventually we can use the generic store type defined in client/mod.rs.
// For now, wanted to play around with creating a client with a WebStore implementation
// (instead of a SQLite implementation) and getting an underlying store method to execute
// in the browser.

// TODO: Remove pub from store field
// TODO: Add back generic type for NodeRpcClient and get example working in browser
// TODO: Add back generic type for DataStore and get example working in browser
pub struct Client<N: NodeRpcClient, S: Store> {
    pub store: S,
    pub rpc_api: N
}

impl<N: NodeRpcClient, S: Store> Client<N, S> {
    pub fn new(api: N, store: S) -> Self {
        Self { rpc_api: api, store }
    }
}