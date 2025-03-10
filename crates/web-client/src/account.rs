use miden_client::store::AccountRecord;
use miden_objects::account::Account as NativeAccount;
use wasm_bindgen::prelude::*;

use crate::{
    models::{account::Account, account_header::AccountHeader, account_id::AccountId, auth_secret_key::AuthSecretKey},
    WebClient,
};

#[wasm_bindgen]
impl WebClient {
    #[wasm_bindgen(js_name = "getAccounts")]
    pub async fn get_accounts(&mut self) -> Result<Vec<AccountHeader>, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let result = client
                .get_account_headers()
                .await
                .map_err(|err| JsValue::from_str(&format!("Failed to get accounts: {err}")))?;

            Ok(result.into_iter().map(|(header, _)| header.into()).collect())
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    #[wasm_bindgen(js_name = "getAccount")]
    pub async fn get_account(
        &mut self,
        account_id: &AccountId,
    ) -> Result<Option<Account>, JsValue> {
        if let Some(client) = self.get_mut_inner() {
            let result = client
                .get_account(account_id.into())
                .await
                .map_err(|err| JsValue::from_str(&format!("Failed to get account: {err}")))?;
            let account: Option<NativeAccount> = result.map(AccountRecord::into);

            Ok(account.map(miden_client::account::Account::into))
        } else {
            Err(JsValue::from_str("Client not initialized"))
        }
    }

    // #[wasm_bindgen(js_name = "getAccountAuth")]
    // pub async fn get_account_auth(
    //     &mut self,
    //     account_id: &AccountId,
    // ) -> Result<Option<AuthSecretKey>, JsValue> {
    //     if let Some(client) = self.get_mut_inner() {
    //         let native_auth_secret_key = client
    //             .get_account_auth(account_id.into())
    //             .await
    //             .map_err(|err| JsValue::from_str(&format!("Failed to get account auth: {err}")))?;

    //         Ok(native_auth_secret_key.map(miden_client::auth::AuthSecretKey::into))
    //     } else {
    //         Err(JsValue::from_str("Client not initialized"))
    //     }
    // }

    #[wasm_bindgen(js_name = "fetchAndCacheAccountAuthByAccountId")]
    pub async fn fetch_and_cache_account_auth_by_account_id(
        &mut self,
        account_id: &AccountId,
    ) -> Result<Option<String>, JsValue> {
        let account_pub_key = {
            let client = self
                .get_mut_inner()
                .ok_or_else(|| JsValue::from_str("Client not initialized"))?;

            let account_record = client
                .get_account(account_id.into())
                .await
                .map_err(|err| JsValue::from_str(&format!("Failed to get account: {}", err)))?;

            let account: NativeAccount = match account_record {
                Some(record) => AccountRecord::into(record),
                None => return Ok(None),
            };

            let account_storage = account.storage();
            let pub_key_index = if account.is_faucet() { 1 } else { 0 };

            // Retrieve the public key from storage.
            account_storage
                .get_item(pub_key_index)
                .map_err(|err| JsValue::from_str(&format!("Failed to get item: {}", err)))?
        }; // The mutable borrow of `self` ends here.

        // Now borrow `self.store` immutably.
        let store = self
            .store
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Store not initialized"))?;

        // Fetch and cache the account auth using the public key.
        let native_auth_secret_key = store
            .fetch_and_cache_account_auth_by_pub_key(account_pub_key.to_hex())
            .await
            .map_err(|err| {
                JsValue::from_str(&format!(
                    "Failed to fetch and cache account auth: {}",
                    err
                ))
            })?;

        Ok(native_auth_secret_key)
    }
}
