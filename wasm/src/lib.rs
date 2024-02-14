mod account;

use wasm_bindgen::prelude::*;
use serde_json::json;
use crate::account::MidenAccount;

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, World!");
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn create_new_account() -> String {

    // Attempt to create a new account
    match MidenAccount::new_account() {
        Ok(account_string) => {
            // Serialize your successful result to a JSON string or a suitable format
            // This is a placeholder; adapt according to your actual return type structure
            serde_json::to_string(&json!({"success": true, "account": account_string})).unwrap_or_else(|_| "Serialization error".to_string())
        },
        Err(e) => {
            // Serialize the error to a string; you might want to provide more details
            serde_json::to_string(&json!({"success": false, "error": format!("{:?}", e)}))
                        .unwrap_or_else(|_| "Serialization error".to_string())
        },
    }
}