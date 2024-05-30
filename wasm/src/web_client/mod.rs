use wasm_bindgen::prelude::*;
use miden_objects::crypto::rand::RpoRandomCoin;

use miden_client::client::{
    Client,
    get_random_coin
};

pub mod account;
pub mod store;
pub mod rpc;

use store::WebStore;
use rpc::WebRpcClient;


#[wasm_bindgen]
pub struct WebClient {
    inner: Option<Client<WebRpcClient, RpoRandomCoin, WebStore>>
}

#[wasm_bindgen]
impl WebClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        WebClient { inner: None }
    }

    // Getter for the inner client, used internally for operations
    pub(crate) fn get_mut_inner(&mut self) -> Option<&mut Client<WebRpcClient, RpoRandomCoin, WebStore>> {
        self.inner.as_mut()
    }

    // Exposed method to JS to create an internal client
    pub async fn create_client(&mut self) -> Result<JsValue, JsValue> {
        let rng = get_random_coin();
        let web_store: WebStore = WebStore::new().await.map_err(|_| JsValue::from_str("Failed to initialize WebStore"))?;
        let web_rpc_client = WebRpcClient::new("http://localhost:57291");
        let executor_store = WebStore::new().await.map_err(|_| JsValue::from_str("Failed to initialize ExecutorStore"))?;

        self.inner = Some(Client::new(web_rpc_client, rng, web_store, executor_store));

        Ok(JsValue::from_str("Client created successfully"))
    }
}