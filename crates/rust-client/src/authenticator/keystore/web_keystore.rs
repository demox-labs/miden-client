use alloc::string::ToString;
use alloc::boxed::Box;

use miden_objects::{
    account::AuthSecretKey,
    utils::{Deserializable, Serializable},
    Digest, Word,
};
use crate::store::web_store::account::utils::insert_account_auth;
use crate::store::web_store::account::utils::get_account_auth_by_pub_key;
use winter_maybe_async::*;

use super::{KeyStore, KeyStoreError};

/// A web-based keystore that stores keys in [browser's local storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).
#[derive(Clone)]
pub struct WebKeyStore;

#[maybe_async_trait]
impl KeyStore for WebKeyStore {
    #[maybe_async]
    fn add_key(&self, key: &AuthSecretKey) -> Result<(), KeyStoreError> {
        let pub_key = match &key {
            AuthSecretKey::RpoFalcon512(k) => Digest::from(Word::from(k.public_key())).to_hex(),
        };
        let secret_key_hex = hex::encode(key.to_bytes());

        maybe_await!(insert_account_auth(pub_key, secret_key_hex));

        Ok(())
    }

    fn get_key(&self, pub_key: Word) -> Result<Option<AuthSecretKey>, KeyStoreError> {
        let pub_key_str = Digest::from(pub_key).to_hex();
        let secret_key_hex = get_account_auth_by_pub_key(pub_key_str).map_err(|_| {
            KeyStoreError::StorageError("Failed to get item from local storage".to_string())
        })?;

        match secret_key_hex {
            Some(secret_key_hex) => {
                let secret_key_bytes = hex::decode(secret_key_hex).map_err(|err| {
                    KeyStoreError::DecodingError(format!("error decoding secret key hex: {err:?}"))
                })?;

                let secret_key = AuthSecretKey::read_from_bytes(secret_key_bytes.as_slice())
                    .map_err(|err| {
                        KeyStoreError::DecodingError(format!("error reading secret key: {err:?}"))
                    })?;

                Ok(Some(secret_key))
            },
            None => Ok(None),
        }
    }
}
