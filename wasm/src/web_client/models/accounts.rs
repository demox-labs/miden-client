use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen::to_value;

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct AssetInfo {
  is_fungible: bool,
  amount: String,
  faucet_id: String
}

#[wasm_bindgen]
impl AssetInfo {
    pub fn new(is_fungible: bool, amount: String, faucet_id: String) -> AssetInfo {
        AssetInfo {
            is_fungible,
            amount,
            faucet_id
        }
    }

    #[wasm_bindgen(getter)]
    pub fn is_fungible(&self) -> bool {
        self.is_fungible.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn amount(&self) -> String {
        self.amount.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn faucet_id(&self) -> String {
        self.faucet_id.clone()
    }
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct SerializedAccount {
    id: String,
    nonce: String,
    vault_root: String,
    storage_root: String,
    code_root: String,
    account_type: String,
    is_faucet: bool,
    is_regular_account: bool,
    is_on_chain: bool,
    assets: Vec<AssetInfo>
}

#[wasm_bindgen]
impl SerializedAccount {
    pub fn new(
        id: String,
        nonce: String,
        vault_root: String,
        storage_root: String,
        code_root: String,
        account_type: String,
        is_faucet: bool,
        is_regular_account: bool,
        is_on_chain: bool,
        assets: Vec<AssetInfo>
    ) -> SerializedAccount {
        SerializedAccount {
            id,
            nonce,
            vault_root,
            storage_root,
            code_root,
            account_type,
            is_faucet,
            is_regular_account,
            is_on_chain,
            assets
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> String {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn vault_root(&self) -> String {
        self.vault_root.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn storage_root(&self) -> String {
        self.storage_root.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn code_root(&self) -> String {
        self.code_root.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn account_type(&self) -> String {
        self.account_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_faucet(&self) -> bool {
        self.is_faucet.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_regular_account(&self) -> bool {
        self.is_regular_account.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_on_chain(&self) -> bool {
        self.is_on_chain.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn assets(&self) -> JsValue {
        to_value(&self.assets).unwrap()
    }
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct SerializedAccountStub {
    id: String,
    nonce: String,
    vault_root: String,
    storage_root: String,
    code_root: String,
    account_type: String,
    is_faucet: bool,
    is_regular_account: bool,
    is_on_chain: bool
}

#[wasm_bindgen]
impl SerializedAccountStub {
    pub fn new(
        id: String,
        nonce: String,
        vault_root: String,
        storage_root: String,
        code_root: String,
        account_type: String,
        is_faucet: bool,
        is_regular_account: bool,
        is_on_chain: bool
    ) -> SerializedAccountStub {
        SerializedAccountStub {
            id,
            nonce,
            vault_root,
            storage_root,
            code_root,
            account_type,
            is_faucet,
            is_regular_account,
            is_on_chain
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> String {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn vault_root(&self) -> String {
        self.vault_root.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn storage_root(&self) -> String {
        self.storage_root.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn code_root(&self) -> String {
        self.code_root.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn account_type(&self) -> String {
        self.account_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_faucet(&self) -> bool {
        self.is_faucet.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_regular_account(&self) -> bool {
        self.is_regular_account.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_on_chain(&self) -> bool {
        self.is_on_chain.clone()
    }
}
