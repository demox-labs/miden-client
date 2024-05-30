use web_sys::console;
use wasm_bindgen::prelude::*;

use miden_objects::{accounts::{Account, AccountCode, AccountId, AccountStorage}, assembly::AstSerdeOptions, assets::{Asset, AssetVault}, Word};
use miden_tx::utils::Serializable;
use wasm_bindgen_futures::*;

use miden_client::store::AuthSecretKey;

use super::js_bindings::*;

pub fn insert_account_code(
    account_code: &AccountCode
) -> Result<(), ()> {
    let root = account_code.root().to_string();
    let procedures = serde_json::to_string(account_code.procedures()).unwrap();
    let module = account_code.module().to_bytes(AstSerdeOptions { serialize_imports: true });

    idxdb_insert_account_code(root, procedures, module);

    Ok(())
}

pub async fn insert_account_storage(
    account_storage: &AccountStorage
) -> Result<(), ()> {
    let root = account_storage.root().to_string();
    let storage = account_storage.to_bytes();

    idxdb_insert_account_storage(root, storage);

    Ok(())
}

pub async fn insert_account_asset_vault(
    asset_vault: &AssetVault
) -> Result<(), ()> {
    let root = (&asset_vault.commitment()).to_string();
    let assets: Vec<Asset> = asset_vault.assets().collect();
    let assets_as_str = serde_json::to_string(&assets).unwrap();

    idxdb_insert_account_asset_vault(root, assets_as_str);

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

  idxdb_insert_account_auth(account_id_str, auth_info, pub_key);
  
  Ok(())
}

pub async fn insert_account_record(
    account: &Account,
    account_seed: Option<Word>,
) -> Result<(), ()> {
    let account_id_str = AccountId::to_hex(&account.id());
    let code_root = account.code().root().to_string();
    let storage_root = account.storage().root().to_string();
    let vault_root = (&account.vault().commitment()).to_string();
    let committed = account.is_on_chain();
    let nonce = account.nonce().to_string();
    let account_seed = account_seed.map(|seed| seed.to_bytes());

    idxdb_insert_account_record(
        account_id_str,
        code_root,
        storage_root,
        vault_root,
        nonce,
        committed,
        account_seed,
    );

    Ok(())
}