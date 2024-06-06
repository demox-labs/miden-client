use std::{fs::File, io::Write, path::PathBuf};

use miden_client::{
    client::{rpc::NodeRpcClient, Client},
    store::{InputNoteRecord, Store},
};
use miden_objects::crypto::rand::FeltRng;
use miden_tx::{utils::Serializable, TransactionAuthenticator};
use tracing::info;

use super::Parser;
use crate::cli::get_output_note_with_id_prefix;

#[derive(Debug, Parser, Clone)]
#[clap(about = "Export client output notes")]
pub struct ExportCmd {
    /// ID (or a valid prefix) of the output note to export
    #[clap()]
    id: String,

    /// Desired filename for the binary file. Defaults to the note ID if not provided
    #[clap(short, long)]
    filename: Option<PathBuf>,
}

impl ExportCmd {
    pub fn execute<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        &self,
        client: Client<N, R, S, A>,
    ) -> Result<(), String> {
        export_note(&client, self.id.as_str(), self.filename.clone())?;
        Ok(())
    }
}

// EXPORT NOTE
// ================================================================================================
pub fn export_note<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
    client: &Client<N, R, S, A>,
    note_id: &str,
    filename: Option<PathBuf>,
) -> Result<File, String> {
    let note_id = get_output_note_with_id_prefix(client, note_id)
        .map_err(|err| err.to_string())?
        .id();

    let output_note = client
        .get_output_notes(miden_client::store::NoteFilter::Unique(note_id))?
        .pop()
        .expect("should have an output note");

    // Convert output note into InputNoteRecord before exporting
    let input_note: InputNoteRecord = output_note
        .try_into()
        .map_err(|_err| format!("Can't export note with ID {}", note_id.to_hex()))?;

    let file_path = if let Some(filename) = filename {
        filename
    } else {
        let current_dir = std::env::current_dir().map_err(|err| err.to_string())?;
        current_dir.join(format!("{}.mno", note_id.inner()))
    };

    info!("Writing file to {}", file_path.to_string_lossy());
    let mut file = File::create(file_path).map_err(|err| err.to_string())?;
    file.write_all(&input_note.to_bytes()).map_err(|err| err.to_string())?;

    println!("Succesfully exported note {}", note_id);
    Ok(file)
}