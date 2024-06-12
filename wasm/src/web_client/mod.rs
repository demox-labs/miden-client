use alloc::rc::Rc;
use wasm_bindgen::prelude::*;
use miden_objects::{ utils::Deserializable, crypto::rand::RpoRandomCoin };
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
pub mod tags;
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
    inner: Option<Client<WebRpcClient, RpoRandomCoin, WebStore, StoreAuthenticator<RpoRandomCoin, WebStore>>>,
    tx_authenticator: Option<StoreAuthenticator<RpoRandomCoin, WebStore>>,
}

#[wasm_bindgen]
impl WebClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        WebClient { inner: None, tx_authenticator: None }
    }

    // Getter for the inner client, used internally for operations
    pub(crate) fn get_mut_inner(&mut self) -> Option<&mut Client<WebRpcClient, RpoRandomCoin, WebStore, StoreAuthenticator<RpoRandomCoin, WebStore>>> {
        self.inner.as_mut()
    }

    // Exposed method to JS to create an internal client
    pub async fn create_client(
        &mut self,
        node_url: Option<String>,
    ) -> Result<JsValue, JsValue> {
        web_sys::console::log_1(&JsValue::from_str("create_client called"));
        let rng = get_random_coin();
        let web_store: WebStore = WebStore::new().await.map_err(|_| JsValue::from_str("Failed to initialize WebStore"))?;
        let web_store = Rc::new(web_store);
        let authenticator: StoreAuthenticator<RpoRandomCoin, WebStore> = StoreAuthenticator::new_with_rng(web_store.clone(), rng);
        let web_rpc_client = WebRpcClient::new(&node_url.unwrap_or_else(|| "http://localhost:57291".to_string()));

        // self.tx_authenticator = Some(authenticator);
        self.inner = Some(Client::new(web_rpc_client, rng, web_store, authenticator, false));

        Ok(JsValue::from_str("Client created successfully"))
    }

    // pub async fn set_account_auth_by_pub_key(
    //     &mut self,
    //     pub_key: String
    // ) -> Result<JsValue, JsValue> {
    //     web_sys::console::log_1(&JsValue::from_str("set_account_auth_by_pub_key called"));
    //     if let Some(client) = self.get_mut_inner() {
    //         let pub_key = hex::decode(pub_key).map_err(|_| JsValue::from_str("Failed to decode public key"))?;
    //         let pub_key = miden_objects::Word::read_from_bytes(&pub_key).unwrap();
    //         self.tx_authenticator.as_mut().unwrap().set_auth_secret_key(pub_key).await.map_err(|_| JsValue::from_str("Failed to set auth secret key"))?;
    //         Ok(JsValue::from_str("Auth secret key set successfully"))
    //     } else {
    //         Err(JsValue::from_str("Client not initialized"))
    //     }
    // }
}