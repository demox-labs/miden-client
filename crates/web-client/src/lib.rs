extern crate alloc;
use alloc::{
    boxed::Box,
    sync::Arc
};

use console_error_panic_hook::set_once;
use core::cell::RefCell;
use miden_client::{
    rpc::WebTonicRpcClient,
    store::{web_store::WebStore, StoreAuthenticator},
    Client,
};
use miden_objects::{crypto::rand::RpoRandomCoin, Felt};
use miden_proving_service_client::RemoteTransactionProver;
use rand::{rngs::StdRng, Rng, SeedableRng};
use wasm_bindgen::prelude::*;
use serde_json;

pub mod account;
pub mod export;
pub mod import;
pub mod models;
pub mod new_account;
pub mod new_transactions;
pub mod notes;
pub mod sync;
pub mod tags;
pub mod transactions;

thread_local!{
    static MEMORY: RefCell<Option<JsValue>> = RefCell::new(None);
}

#[wasm_bindgen]
pub fn init(memory: JsValue) {
    MEMORY.with(|m| *m.borrow_mut() = Some(memory));
    web_sys::console::log_1(&JsValue::from_str("Rust WASM memory initialized with shared memory"));
}

#[wasm_bindgen]
pub struct WebClient {
    store: Option<Arc<WebStore>>,
    remote_prover: Option<Arc<RemoteTransactionProver>>,
    inner: Option<Client<RpoRandomCoin>>,
}

impl Default for WebClient {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl WebClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        set_once();
        WebClient {
            inner: None,
            remote_prover: None,
            store: None,
        }
    }

    pub(crate) fn get_mut_inner(&mut self) -> Option<&mut Client<RpoRandomCoin>> {
        self.inner.as_mut()
    }

    pub async fn create_client(
        &mut self,
        node_url: Option<String>,
        prover_url: Option<String>,
        seed: Option<Vec<u8>>,
    ) -> Result<JsValue, JsValue> {
        let mut rng = match seed {
            Some(seed_bytes) => {
                if seed_bytes.len() == 32 {
                    let mut seed_array = [0u8; 32];
                    seed_array.copy_from_slice(&seed_bytes);
                    StdRng::from_seed(seed_array)
                } else {
                    return Err(JsValue::from_str("Seed must be exactly 32 bytes"));
                }
            },
            None => StdRng::from_entropy(),
        };
        let coin_seed: [u64; 4] = rng.gen();
        let coin_seed_str = serde_json::to_string(&coin_seed).unwrap();

        web_sys::console::log_1(&JsValue::from_str(&coin_seed_str));

        let rng = RpoRandomCoin::new(coin_seed.map(Felt::new));
        let web_store: WebStore = WebStore::new()
            .await
            .map_err(|_| JsValue::from_str("Failed to initialize WebStore"))?;
        let web_store = Arc::new(web_store);
        let authenticator = Arc::new(StoreAuthenticator::new_with_rng(web_store.clone(), rng));
        let web_rpc_client = Box::new(WebTonicRpcClient::new(
            &node_url.unwrap_or_else(|| miden_client::rpc::Endpoint::testnet().to_string()),
        ));

        self.remote_prover = prover_url
            .map(|prover_url| Arc::new(RemoteTransactionProver::new(&prover_url.to_string())));
        self.inner =
            Some(Client::new(web_rpc_client, rng, web_store.clone(), authenticator, false));
        self.store = Some(web_store);

        Ok(JsValue::from_str("Client created successfully"))
    }
}
