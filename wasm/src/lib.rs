
use wasm_bindgen::prelude::*;
use gluesql::{prelude::Glue, idb_storage::IdbStorage};

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, World!");
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}


// #[wasm_bindgen]
// pub async fn create_indexed_db() {
//     let storage_name = String::from("gluesql");
//     let storage_name_option = Some(storage_name);
//     // Await the future and then call `.expect()`
//     web_sys::console::log_1(&"Creating IdbStorage Rust".into());
//     let storage_result = IdbStorage::new(storage_name_option).await;
//     let storage = storage_result.expect("Something went wrong!");
//     let mut glue = Glue::new(storage);
//     web_sys::console::log_1(&"Creating Glue Instance".into());
//     let queries = "
//             CREATE TABLE greet (name TEXT);
//             INSERT INTO greet VALUES ('World');
//         ";
//     web_sys::console::log_1(&"Executing Queries".into());
//     match glue.execute(queries).await {
//         Ok(_) => web_sys::console::log_1(&"Queries executed successfully".into()),
//         Err(e) => {
//             let error_message = format!("Execution failed: {:?}", e);
//             web_sys::console::log_1(&error_message.into());
//         },
//     }
//     web_sys::console::log_1(&"Executed Queries".into());
//     // alert("Hello, World!");
// }

#[wasm_bindgen]
pub async fn create_indexed_db() {
    let storage_name = Some(String::from("testdb"));

    web_sys::console::log_1(&"Creating IdbStorage Rust".into());

    let idb_storage_result = IdbStorage::new(storage_name).await.expect("Something went wrong!");

    let mut glue = Glue::new(idb_storage_result);

    web_sys::console::log_1(&"Creating Glue Instance".into());

    let queries = "CREATE TABLE greet (name TEXT);";

    web_sys::console::log_1(&"Executing Queries".into());

    match glue.execute(queries).await {
        Ok(_) => web_sys::console::log_1(&"Queries executed successfully".into()),
        Err(e) => {
            let error_message = format!("Execution failed: {:?}", e);
            web_sys::console::log_1(&error_message.into());
        },
    }
    
    web_sys::console::log_1(&"Executed Queries".into());
}