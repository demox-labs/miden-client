#[cfg(not(target_arch = "wasm32"))]
use clap::Parser;

mod cli;
#[cfg(not(target_arch = "wasm32"))]
use cli::Cli;

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(target_arch = "wasm32")]
fn main() {
}
