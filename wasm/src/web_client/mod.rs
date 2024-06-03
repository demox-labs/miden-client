use alloc::rc::Rc;
use wasm_bindgen::prelude::*;
use miden_objects::crypto::rand::RpoRandomCoin;
use miden_tx::TransactionAuthenticator;
use miden_client::client::{Client, get_random_coin, store_authenticator::StoreAuthenticator};

pub mod account;
pub mod export;
pub mod import;
pub mod new_account;
pub mod new_transactions;
pub mod notes;
pub mod sync;
pub mod transactions;
pub mod store;
pub mod rpc;
pub mod models;

use store::WebStore;
use rpc::WebRpcClient;

// My strategy here is to create a WebClient struct that has methods exposed
// to the browser environment. When these methods are called, they will 
// use the inner client to execute the proper code and store methods. 

#[wasm_bindgen]
pub struct WebClient {
    inner: Option<Client<WebRpcClient, RpoRandomCoin, WebStore, StoreAuthenticator<RpoRandomCoin, WebStore>>>
}

#[wasm_bindgen]
impl WebClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        WebClient { inner: None }
    }

    // Getter for the inner client, used internally for operations
    pub(crate) fn get_mut_inner(&mut self) -> Option<&mut Client<WebRpcClient, RpoRandomCoin, WebStore, StoreAuthenticator<RpoRandomCoin, WebStore>>> {
        self.inner.as_mut()
    }

    // Exposed method to JS to create an internal client
    pub async fn create_client(
        &mut self,
        node_url: Option<String>
    ) -> Result<JsValue, JsValue> {
        web_sys::console::log_1(&JsValue::from_str("create_client called"));
        let rng = get_random_coin();
        let web_store: WebStore = WebStore::new().await.map_err(|_| JsValue::from_str("Failed to initialize WebStore"))?;
        let web_store = Rc::new(web_store);
        let authenticator: StoreAuthenticator<RpoRandomCoin, WebStore> = StoreAuthenticator::new_with_rng(web_store.clone(), rng);
        let web_rpc_client = WebRpcClient::new(&node_url.unwrap_or_else(|| "http://localhost:57291".to_string()));

        self.inner = Some(Client::new(web_rpc_client, rng, web_store, authenticator, false));

        Ok(JsValue::from_str("Client created successfully"))
    }
}