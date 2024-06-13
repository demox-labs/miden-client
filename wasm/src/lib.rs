extern crate alloc;

pub mod web_client;

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::*;
use web_sys::console;
use serde_wasm_bindgen::Serializer;
use serde::Serialize;

#[derive(Serialize)]
struct MyStruct {
    large_number: u64,
}

#[wasm_bindgen]
pub fn serialize_test() -> JsValue {
  let my_struct = MyStruct {
      large_number: 10426515476281968952,
  };

  // Create a new serializer with the option set
  let mut serializer = Serializer::new().serialize_large_number_types_as_bigints(true);

  // Serialize the struct
  my_struct.serialize(&serializer).unwrap()
}

#[wasm_bindgen]
extern "C" {
  fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
  unsafe { alert("Hello world from WASM!") };
}

#[wasm_bindgen]
pub fn greet2() {
  unsafe { console::log_1(&"Hello from WASM!".into()) };
}