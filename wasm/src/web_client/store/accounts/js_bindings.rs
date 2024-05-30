use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::*;

// Account IndexedDB Operations
#[wasm_bindgen(module = "/js/db/accounts.js")]
extern "C" {
    // INSERTS
    // ================================================================================================

    #[wasm_bindgen(js_name = insertAccountCode)]
    pub fn idxdb_insert_account_code(
        code_root: String, 
        code: String, 
        module: Vec<u8>
    ) -> JsValue;

    #[wasm_bindgen(js_name = insertAccountStorage)]
    pub fn idxdb_insert_account_storage(
        storage_root: String, 
        storage_slots: Vec<u8>
    ) -> JsValue;

    #[wasm_bindgen(js_name = insertAccountAssetVault)]
    pub fn idxdb_insert_account_asset_vault(
        vault_root: String, 
        assets: String
    ) -> JsValue;

    #[wasm_bindgen(js_name = insertAccountRecord)]
    pub fn idxdb_insert_account_record(
        id: String, 
        code_root: String, 
        storage_root: String, 
        vault_root: String, 
        nonce: String, 
        committed: bool, 
        account_seed: Option<Vec<u8>>
    ) -> JsValue;

    #[wasm_bindgen(js_name = insertAccountAuth)]
    pub fn idxdb_insert_account_auth(
        id: String,
        auth_info: Vec<u8>,
        pub_key: Vec<u8>
    ) -> JsValue;
}