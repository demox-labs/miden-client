extern crate alloc;

pub mod web_client;
pub use web_client::*;

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::*;
use web_sys::console;