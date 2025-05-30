use miden_client::crypto::{FeltRng, RpoRandomCoin};
use miden_objects::{
    Felt as NativeFelt,
    crypto::dsa::rpo_falcon512::SecretKey as NativeSecretKey,
    utils::{Deserializable, Serializable},
};
use rand::{SeedableRng, rngs::StdRng};
use wasm_bindgen::prelude::*;

use super::felt::Felt;

#[wasm_bindgen]
pub struct SecretKey(NativeSecretKey);

impl SecretKey {
    pub fn with_rng(rng: &mut StdRng) -> Self {
        SecretKey(NativeSecretKey::with_rng(rng))
    }
}

#[wasm_bindgen]
impl SecretKey {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut rng = StdRng::from_os_rng();
        SecretKey(NativeSecretKey::with_rng(&mut rng))
    }

    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        self.0.write_into(&mut bytes);
        bytes
    }

    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<SecretKey, JsValue> {
        NativeSecretKey::read_from_bytes(bytes)
            .map(SecretKey)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

// CONVERSIONS
// ================================================================================================

impl From<NativeSecretKey> for SecretKey {
    fn from(native_secret_key: NativeSecretKey) -> Self {
        SecretKey(native_secret_key)
    }
}

impl From<&NativeSecretKey> for SecretKey {
    fn from(native_secret_key: &NativeSecretKey) -> Self {
        SecretKey(native_secret_key.clone())
    }
}

impl From<SecretKey> for NativeSecretKey {
    fn from(secret_key: SecretKey) -> Self {
        secret_key.0
    }
}

impl From<&SecretKey> for NativeSecretKey {
    fn from(secret_key: &SecretKey) -> Self {
        secret_key.0.clone()
    }
}
