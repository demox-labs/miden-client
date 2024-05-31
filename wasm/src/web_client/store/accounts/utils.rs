use wasm_bindgen_futures::*;
use wasm_bindgen::prelude::*;
use web_sys::console;

use miden_objects::{
    accounts::{Account, AccountCode, AccountId, AccountStorage, AccountStub, AuthSecretKey}, 
    assembly::AstSerdeOptions, 
    assets::{Asset, AssetVault}, 
    Felt, Digest, Word
};
use miden_tx::utils::Serializable;
use miden_client::errors::StoreError;

use super::js_bindings::*;
use super::models::*;

pub async fn insert_account_code(
    account_code: &AccountCode
) -> Result<(), ()> {
    let root = account_code.root().to_string();
    let procedures = serde_json::to_string(account_code.procedures()).unwrap();
    let module = account_code.module().to_bytes(AstSerdeOptions { serialize_imports: true });

    let promise = idxdb_insert_account_code(root, procedures, module);
    let js_value = JsFuture::from(promise).await;
    
    Ok(())
}

pub async fn insert_account_storage(
    account_storage: &AccountStorage
) -> Result<(), ()> {
    let root = account_storage.root().to_string();
    let storage = account_storage.to_bytes();

    let promise = idxdb_insert_account_storage(root, storage);
    let js_value = JsFuture::from(promise).await;

    Ok(())
}

pub async fn insert_account_asset_vault(
    asset_vault: &AssetVault
) -> Result<(), ()> {
    let root = serde_json::to_string(&asset_vault.commitment()).unwrap();
    let assets: Vec<Asset> = asset_vault.assets().collect();
    let assets_as_str = serde_json::to_string(&assets).unwrap();

    let promise = idxdb_insert_account_asset_vault(root, assets_as_str);
    let js_value = JsFuture::from(promise).await;
    Ok(())
}

pub async fn insert_account_auth(
    account_id: AccountId,
    auth_info: &AuthSecretKey,
) -> Result<(), ()> {
    let pub_key = match auth_info {
        AuthSecretKey::RpoFalcon512(secret) => Word::from(secret.public_key()),
    }
    .to_bytes();

    let account_id_str = account_id.to_string();
    let auth_info = auth_info.to_bytes();

    let promise = idxdb_insert_account_auth(account_id_str, auth_info, pub_key);
    let js_value = JsFuture::from(promise).await;
    
    Ok(())
}

pub async fn insert_account_record(
    account: &Account,
    account_seed: Option<Word>,
) -> Result<(), ()> {
    let account_id_str = account.id().to_string();
    let code_root = account.code().root().to_string();
    let storage_root = account.storage().root().to_string();
    let vault_root = serde_json::to_string(&account.vault().commitment()).unwrap();
    let committed = account.is_on_chain();
    let nonce = account.nonce().to_string();
    let account_seed = account_seed.map(|seed| seed.to_bytes());

    let promise = idxdb_insert_account_record(
        account_id_str,
        code_root,
        storage_root,
        vault_root,
        nonce,
        committed,
        account_seed,
    );
    let js_value = JsFuture::from(promise).await;
    
    Ok(())
}

pub fn parse_account_record_idxdb_object(
    account_stub_idxdb: AccountRecordIdxdbOjbect
) -> Result<(AccountStub, Option<Word>), StoreError> {
    let native_account_id: AccountId = AccountId::from_hex(&account_stub_idxdb.id)?;
    let native_nonce: u64 = account_stub_idxdb.nonce.parse::<u64>()?;
    let account_seed = account_stub_idxdb.account_seed.map(|seed| Word::read_from_bytes(&seed)).transpose()?;
    
    let account_stub = AccountStub::new(
        native_account_id,
        Felt::new(native_nonce),
        serde_json::from_str(&account_stub_idxdb.vault_root)?,
        Digest::try_from(&account_stub_idxdb.storage_root)?,
        Digest::try_from(&account_stub_idxdb.code_root)?,
    );

    Ok((account_stub, account_seed))
}