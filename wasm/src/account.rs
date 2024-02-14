use rand::{rngs::ThreadRng, Rng};
use wasm_bindgen::prelude::*; // Use wasm_bindgen for WASM compatibility

// #[wasm_bindgen]
// pub enum AccountTemplate {
//     BasicWallet {
//         mutable_code: bool,
//         storage_mode: AccountStorageMode,
//     },
//     FungibleFaucet {
//         token_symbol: TokenSymbol,
//         decimals: u8,
//         max_supply: u64,
//         storage_mode: AccountStorageMode,
//     },
// }

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub enum AccountStorageMode {
    Local,
    OnChain,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct MidenAccount;

#[wasm_bindgen]
impl MidenAccount {
    // ACCOUNT CREATION
    // --------------------------------------------------------------------------------------------

    /// Creates a new [Account] based on an [AccountTemplate] and saves it in the store
    pub fn new_account() -> Result<String, JsValue> { // See if we can replace generic error with ClientError
        let mut rng = rand::thread_rng();

        let account_result = Self::new_basic_wallet(false, &mut rng, AccountStorageMode::Local);

        account_result.map_err(|e| e) // If `e` is already a `JsValue`
              .map(|account_string| account_string)
    }

    /// Creates a new regular account and saves it in the store along with its seed and auth data
    fn new_basic_wallet(
        mutable_code: bool,
        rng: &mut ThreadRng,
        account_storage_mode: AccountStorageMode,
    ) -> Result<String, JsValue> {
        if let AccountStorageMode::OnChain = account_storage_mode {
            return Err(JsValue::from_str("Recording the account on chain is not supported yet"));
        }
    
        Ok("Result".to_string())
    }
}