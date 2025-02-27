use std::{
    env,
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
};

use miden_lib::note::scripts::{p2id, p2idr, swap};
use miden_rpc_proto::write_proto;
use miette::IntoDiagnostic;
use prost::Message;

const STD_PROTO_OUT_DIR: &str = "src/rpc/generated/std";
const NO_STD_PROTO_OUT_DIR: &str = "src/rpc/generated/nostd";

/// Defines whether the build script should generate files in `/src`.
/// The docs.rs build pipeline has a read-only filesystem, so we have to avoid writing to `src`,
/// otherwise the docs will fail to build there. Note that writing to `OUT_DIR` is fine.
const CODEGEN: bool = option_env!("CODEGEN").is_some();

fn main() -> miette::Result<()> {
    println!("cargo::rerun-if-env-changed=CODEGEN");
    if !CODEGEN {
        return Ok(());
    }

    let out_dir = env::var("OUT_DIR").expect("OUT_DIR should be set");
    let dest_path = PathBuf::from(out_dir);

    write_proto(&dest_path).map_err(miette::Report::msg)?;
    compile_tonic_client_proto(&dest_path)?;
    replace_no_std_types();
    generate_known_script_roots().into_diagnostic()
}
// NODE RPC CLIENT PROTO CODEGEN
// ===============================================================================================

/// Compiles the protobuf files into a file descriptor used to generate Rust types.
fn compile_tonic_client_proto(proto_dir: &Path) -> miette::Result<()> {
    // Compute the compiler's target file path.
    let out = env::var("OUT_DIR").into_diagnostic()?;
    let file_descriptor_path = PathBuf::from(out).join("file_descriptor_set.bin");

    // Compile the proto file
    let protos = &[proto_dir.join("rpc.proto")];
    let includes = &[proto_dir];
    let file_descriptors = protox::compile(protos, includes)?;
    fs::write(&file_descriptor_path, file_descriptors.encode_to_vec()).into_diagnostic()?;

    let mut prost_config = prost_build::Config::new();
    prost_config.skip_debug(["AccountId", "Digest"]);

    let mut web_tonic_prost_config = prost_build::Config::new();
    web_tonic_prost_config.skip_debug(["AccountId", "Digest"]);

    // Generate the header of the user facing server from its proto file
    tonic_build::configure()
        .build_transport(false)
        .build_server(false)
        .file_descriptor_set_path(&file_descriptor_path)
        .skip_protoc_run()
        .out_dir(NO_STD_PROTO_OUT_DIR)
        .compile_protos_with_config(web_tonic_prost_config, protos, includes)
        .into_diagnostic()?;

    tonic_build::configure()
        .build_server(false)
        .file_descriptor_set_path(&file_descriptor_path)
        .skip_protoc_run()
        .out_dir(STD_PROTO_OUT_DIR)
        .compile_protos_with_config(prost_config, protos, includes)
        .into_diagnostic()?;

    Ok(())
}

/// This function replaces all "std::result" with "core::result" in the generated "rpc.rs" file
/// for the web tonic client. This is needed as `tonic_build` doesn't generate `no_std` compatible
/// files and we want to build wasm without `std`.
fn replace_no_std_types() {
    let path = NO_STD_PROTO_OUT_DIR.to_string() + "/rpc.rs";
    let file_str = fs::read_to_string(&path).unwrap();
    let new_file_str = file_str
        .replace("std::result", "core::result")
        .replace("std::marker", "core::marker");

    let mut f = std::fs::OpenOptions::new().write(true).open(path).unwrap();
    f.write_all(new_file_str.as_bytes()).unwrap();
}

// KNOWN SCRIPT ROOTS
// ===============================================================================================

fn generate_known_script_roots() -> std::io::Result<()> {
    // Get the output directory from the environment variables
    let out_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("src/note/script_roots.rs");
    let mut f = File::create(&dest_path)?;
    // Write the top-level doc comment
    writeln!(f, "//! Well-known note script roots.")?;
    writeln!(f, "//! This file was generated by build.rs.\n")?;

    writeln!(f, "/// Script root of the P2ID note script.")?;
    writeln!(f, "pub const P2ID: &str = \"{}\";\n", p2id().hash())?;

    writeln!(f, "/// Script root of the P2IDR note script.")?;
    writeln!(f, "pub const P2IDR: &str = \"{}\";\n", p2idr().hash())?;

    writeln!(f, "/// Script root of the SWAP note script.")?;
    writeln!(f, "pub const SWAP: &str = \"{}\";", swap().hash())?;

    Ok(())
}
