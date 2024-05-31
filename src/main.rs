#[cfg(not(feature = "wasm"))]
use clap::Parser;

extern crate alloc;
mod cli;
pub mod client;
pub mod store;
pub mod errors;
#[cfg(not(feature = "wasm"))]
use cli::Cli;

#[cfg(not(feature = "wasm"))]
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

#[cfg(feature = "wasm")]
fn main() {
}
