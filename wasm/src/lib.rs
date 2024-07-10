extern crate alloc;

pub mod web_client;

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::*;
use web_sys::console;
use serde_wasm_bindgen::Serializer;
use serde::Serialize;