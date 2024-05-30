extern crate alloc;

pub mod client;
pub mod config;
pub mod errors;
pub mod store;

#[cfg(not(feature = "wasm32"))]
use clap::Parser;

mod cli;
#[cfg(not(feature = "wasm32"))]
use cli::Cli;

#[cfg(not(feature = "wasm32"))]
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    // read command-line args
    let cli = Cli::parse();

    // execute cli action
    if let Err(error) = cli.execute().await {
        println!("{}", error);
    }
}

#[cfg(feature = "wasm32")]
fn main() {
}
