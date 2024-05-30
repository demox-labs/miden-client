// Exclude this file when the target is wasm32
#![cfg(not(target_arch = "wasm32"))]
use std::io;

use clap::{Parser, ValueEnum};
use miden_client::{
    client::{
        rpc::NodeRpcClient,
        transactions::{
            transaction_request::{
                PaymentTransactionData, SwapTransactionData, TransactionTemplate,
            },
            TransactionResult,
        },
    },
    store::Store,
};
use miden_objects::{
    accounts::AccountId,
    assets::{Asset, FungibleAsset},
    crypto::rand::FeltRng,
    notes::{NoteExecutionHint, NoteId, NoteTag, NoteType as MidenNoteType},
    Digest, NoteError,
};
use miden_tx::TransactionAuthenticator;

use super::{get_input_note_with_id_prefix, parse_account_id, Client};
use crate::cli::create_dynamic_table;

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum NoteType {
    Public,
    Private,
}

impl From<&NoteType> for MidenNoteType {
    fn from(note_type: &NoteType) -> Self {
        match note_type {
            NoteType::Public => MidenNoteType::Public,
            NoteType::Private => MidenNoteType::OffChain,
        }
    }
}

#[derive(Debug, Parser, Clone)]
/// Mint tokens from a fungible faucet to a wallet.
pub struct MintCmd {
    /// Target account ID or its hex prefix
    #[clap(short = 't', long = "target")]
    target_account_id: String,
    /// Faucet account ID or its hex prefix
    #[clap(short = 'f', long = "faucet")]
    faucet_id: String,
    /// Amount of tokens to mint
    #[clap(short, long)]
    amount: u64,
    #[clap(short, long, value_enum)]
    note_type: NoteType,
    /// Flag to submit the executed transaction without asking for confirmation
    #[clap(short, long, default_value_t = false)]
    force: bool,
}

impl MintCmd {
    pub async fn execute<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        mut client: Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<(), String> {
        let force = self.force;
        let transaction_template = self.into_template(&client, default_account_id)?;
        execute_transaction(&mut client, transaction_template, force).await
    }

    fn into_template<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        client: &Client<N, R, S, A>,
        _default_account_id: Option<String>,
    ) -> Result<TransactionTemplate, String> {
        let faucet_id = parse_account_id(client, self.faucet_id.as_str())?;
        let fungible_asset =
            FungibleAsset::new(faucet_id, self.amount).map_err(|err| err.to_string())?;
        let target_account_id = parse_account_id(client, self.target_account_id.as_str())?;

        Ok(TransactionTemplate::MintFungibleAsset(
            fungible_asset,
            target_account_id,
            (&self.note_type).into(),
        ))
    }
}

#[derive(Debug, Parser, Clone)]
/// Create a pay-to-id transaction.
pub struct SendCmd {
    /// Sender account ID or its hex prefix. If none is provided, the default account's ID is used instead
    #[clap(short = 's', long = "sender")]
    sender_account_id: Option<String>,
    /// Target account ID or its hex prefix
    #[clap(short = 't', long = "target")]
    target_account_id: String,
    /// Faucet account ID or its hex prefix
    #[clap(short = 'f', long = "faucet")]
    faucet_id: String,
    #[clap(short, long, value_enum)]
    note_type: NoteType,
    /// Flag to submit the executed transaction without asking for confirmation
    #[clap(long, default_value_t = false)]
    force: bool,
    /// Set the recall height for the transaction. If the note was not consumed by this height, the sender may consume it back.
    ///
    /// Setting this flag turns the transaction from a PayToId to a PayToIdWithRecall.
    #[clap(short, long)]
    recall_height: Option<u32>,
    /// Amount of tokens to mint
    amount: u64,
}

impl SendCmd {
    pub async fn execute<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        mut client: Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<(), String> {
        let force = self.force;
        let transaction_template = self.into_template(&client, default_account_id)?;
        execute_transaction(&mut client, transaction_template, force).await
    }

    fn into_template<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        client: &Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<TransactionTemplate, String> {
        let faucet_id = parse_account_id(client, self.faucet_id.as_str())?;
        let fungible_asset = FungibleAsset::new(faucet_id, self.amount)
            .map_err(|err| err.to_string())?
            .into();

        // try to use either the provided argument or the default account
        let sender_account_id = self
            .sender_account_id
            .clone()
            .or(default_account_id)
            .ok_or("Neither a sender nor a default account was provided".to_string())?;
        let sender_account_id = parse_account_id(client, &sender_account_id)?;
        let target_account_id = parse_account_id(client, self.target_account_id.as_str())?;

        let payment_transaction =
            PaymentTransactionData::new(fungible_asset, sender_account_id, target_account_id);
        if let Some(recall_height) = self.recall_height {
            Ok(TransactionTemplate::PayToIdWithRecall(
                payment_transaction,
                recall_height,
                (&self.note_type).into(),
            ))
        } else {
            Ok(TransactionTemplate::PayToId(payment_transaction, (&self.note_type).into()))
        }
    }
}

#[derive(Debug, Parser, Clone)]
/// Create a swap transaction.
pub struct SwapCmd {
    /// Sender account ID or its hex prefix. If none is provided, the default account's ID is used instead
    #[clap(short = 's', long = "source")]
    sender_account_id: Option<String>,
    /// Offered Faucet account ID or its hex prefix
    #[clap(long = "offered-faucet")]
    offered_asset_faucet_id: String,
    /// Offered amount
    #[clap(long = "offered-amount")]
    offered_asset_amount: u64,
    /// Requested Faucet account ID or its hex prefix
    #[clap(long = "requested-faucet")]
    requested_asset_faucet_id: String,
    /// Requested amount
    #[clap(long = "requested-amount")]
    requested_asset_amount: u64,
    #[clap(short, long, value_enum)]
    note_type: NoteType,
    /// Flag to submit the executed transaction without asking for confirmation
    #[clap(long, default_value_t = false)]
    force: bool,
}

impl SwapCmd {
    pub async fn execute<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        mut client: Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<(), String> {
        let force = self.force;
        let transaction_template = self.into_template(&client, default_account_id)?;
        execute_transaction(&mut client, transaction_template, force).await
    }

    fn into_template<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        client: &Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<TransactionTemplate, String> {
        let offered_asset_faucet_id = parse_account_id(client, &self.offered_asset_faucet_id)?;
        let offered_fungible_asset =
            FungibleAsset::new(offered_asset_faucet_id, self.offered_asset_amount)
                .map_err(|err| err.to_string())?
                .into();

        let requested_asset_faucet_id = parse_account_id(client, &self.requested_asset_faucet_id)?;
        let requested_fungible_asset =
            FungibleAsset::new(requested_asset_faucet_id, self.requested_asset_amount)
                .map_err(|err| err.to_string())?
                .into();

        // try to use either the provided argument or the default account
        let sender_account_id = self
            .sender_account_id
            .clone()
            .or(default_account_id)
            .ok_or("Neither a sender nor a default account was provided".to_string())?;
        let sender_account_id = parse_account_id(client, &sender_account_id)?;

        let swap_transaction = SwapTransactionData::new(
            sender_account_id,
            offered_fungible_asset,
            requested_fungible_asset,
        );

        Ok(TransactionTemplate::Swap(swap_transaction, (&self.note_type).into()))
    }
}

#[derive(Debug, Parser, Clone)]
/// Consume with the account corresponding to `account_id` all of the notes from `list_of_notes`.
pub struct ConsumeNotesCmd {
    /// The account ID to be used to consume the note or its hex prefix. If none is provided, the default
    /// account's ID is used instead
    #[clap(short = 'a', long = "account")]
    account_id: Option<String>,
    /// A list of note IDs or the hex prefixes of their corresponding IDs
    list_of_notes: Vec<String>,
    /// Flag to submit the executed transaction without asking for confirmation
    #[clap(short, long, default_value_t = false)]
    force: bool,
}

impl ConsumeNotesCmd {
    pub async fn execute<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        mut client: Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<(), String> {
        let force = self.force;
        let transaction_template = self.into_template(&client, default_account_id)?;
        execute_transaction(&mut client, transaction_template, force).await
    }

    fn into_template<N: NodeRpcClient, R: FeltRng, S: Store, A: TransactionAuthenticator>(
        self,
        client: &Client<N, R, S, A>,
        default_account_id: Option<String>,
    ) -> Result<TransactionTemplate, String> {
        let list_of_notes = self
            .list_of_notes
            .iter()
            .map(|note_id| {
                get_input_note_with_id_prefix(client, note_id)
                    .map(|note_record| note_record.id())
                    .map_err(|err| err.to_string())
            })
            .collect::<Result<Vec<NoteId>, _>>()?;

        let account_id = self
            .account_id
            .clone()
            .or(default_account_id)
            .ok_or("Neither a sender nor a default account was provided".to_string())?;
        let account_id = parse_account_id(client, &account_id)?;

        Ok(TransactionTemplate::ConsumeNotes(account_id, list_of_notes))
    }
}

// EXECUTE TRANSACTION
// ================================================================================================
async fn execute_transaction<
    N: NodeRpcClient,
    R: FeltRng,
    S: Store,
    A: TransactionAuthenticator,
>(
    client: &mut Client<N, R, S, A>,
    transaction_template: TransactionTemplate,
    force: bool,
) -> Result<(), String> {
    let transaction_request = client.build_transaction_request(transaction_template.clone())?;

    println!("Executing transaction...");
    let transaction_execution_result = client.new_transaction(transaction_request)?;

    // Show delta and ask for confirmation
    print_transaction_details(&transaction_execution_result);
    if !force {
        println!("Continue with proving and submission? Changes will be irreversible once the proof is finalized on the rollup (Y/N)");
        let mut proceed_str: String = String::new();
        io::stdin().read_line(&mut proceed_str).expect("Should read line");

        if proceed_str.trim().to_lowercase() != "y" {
            println!("Transaction was cancelled.");
            return Ok(());
        }
    }

    println!("Proving transaction and then submitting it to node...");

    let transaction_id = transaction_execution_result.executed_transaction().id();
    let output_notes = transaction_execution_result
        .created_notes()
        .iter()
        .map(|note| note.id())
        .collect::<Vec<_>>();
    client.submit_transaction(transaction_execution_result).await?;

    if let TransactionTemplate::Swap(swap_data, note_type) = transaction_template {
        let payback_note_tag: u32 = build_swap_tag(
            note_type,
            swap_data.offered_asset().faucet_id(),
            swap_data.requested_asset().faucet_id(),
        )
        .map_err(|err| err.to_string())?
        .into();
        println!(
            "To receive updates about the payback Swap Note run `miden tags add {}`",
            payback_note_tag
        );
    }

    println!("Succesfully created transaction.");
    println!("Transaction ID: {}", transaction_id);
    println!("Output notes:");
    output_notes.iter().for_each(|note_id| println!("\t- {}", note_id));

    Ok(())
}

fn print_transaction_details(transaction_result: &TransactionResult) {
    println!(
        "The transaction will have the following effects on the account with ID {}",
        transaction_result.executed_transaction().account_id()
    );

    let account_delta = transaction_result.account_delta();
    let mut table = create_dynamic_table(&["Storage Slot", "Effect"]);

    for cleared_item_slot in account_delta.storage().cleared_items.iter() {
        table.add_row(vec![cleared_item_slot.to_string(), "Cleared".to_string()]);
    }

    for (updated_item_slot, new_value) in account_delta.storage().updated_items.iter() {
        let value_digest: Digest = new_value.into();
        table.add_row(vec![
            updated_item_slot.to_string(),
            format!("Updated ({})", value_digest.to_hex()),
        ]);
    }

    println!("Storage changes:");
    println!("{table}");

    let mut table = create_dynamic_table(&["Asset Type", "Faucet ID", "Amount"]);

    for asset in account_delta.vault().added_assets.iter() {
        let (asset_type, faucet_id, amount) = match asset {
            Asset::Fungible(fungible_asset) => {
                ("Fungible Asset", fungible_asset.faucet_id(), fungible_asset.amount())
            },
            Asset::NonFungible(non_fungible_asset) => {
                ("Non Fungible Asset", non_fungible_asset.faucet_id(), 1)
            },
        };
        table.add_row(vec![asset_type, &faucet_id.to_hex(), &format!("+{}", amount)]);
    }

    for asset in account_delta.vault().removed_assets.iter() {
        let (asset_type, faucet_id, amount) = match asset {
            Asset::Fungible(fungible_asset) => {
                ("Fungible Asset", fungible_asset.faucet_id(), fungible_asset.amount())
            },
            Asset::NonFungible(non_fungible_asset) => {
                ("Non Fungible Asset", non_fungible_asset.faucet_id(), 1)
            },
        };
        table.add_row(vec![asset_type, &faucet_id.to_hex(), &format!("-{}", amount)]);
    }

    println!("Vault changes:");
    println!("{table}");

    if let Some(new_nonce) = account_delta.nonce() {
        println!("New nonce: {new_nonce}.")
    } else {
        println!("No nonce changes.")
    }
}

// HELPERS
// ================================================================================================

/// Returns a note tag for a swap note with the specified parameters.
///
/// Use case ID for the returned tag is set to 0.
///
/// Tag payload is constructed by taking asset tags (8 bits of faucet ID) and concatenating them
/// together as offered_asset_tag + requested_asset tag.
///
/// Network execution hint for the returned tag is set to `Local`.
///
/// Based on miden-base's implementation (<https://github.com/0xPolygonMiden/miden-base/blob/9e4de88031b55bcc3524cb0ccfb269821d97fb29/miden-lib/src/notes/mod.rs#L153>)
///
/// TODO: we should make the function in base public and once that gets released use that one and
/// delete this implementation.
fn build_swap_tag(
    note_type: MidenNoteType,
    offered_asset_faucet_id: AccountId,
    requested_asset_faucet_id: AccountId,
) -> Result<NoteTag, NoteError> {
    const SWAP_USE_CASE_ID: u16 = 0;

    // get bits 4..12 from faucet IDs of both assets, these bits will form the tag payload; the
    // reason we skip the 4 most significant bits is that these encode metadata of underlying
    // faucets and are likely to be the same for many different faucets.

    let offered_asset_id: u64 = offered_asset_faucet_id.into();
    let offered_asset_tag = (offered_asset_id >> 52) as u8;

    let requested_asset_id: u64 = requested_asset_faucet_id.into();
    let requested_asset_tag = (requested_asset_id >> 52) as u8;

    let payload = ((offered_asset_tag as u16) << 8) | (requested_asset_tag as u16);

    let execution = NoteExecutionHint::Local;
    match note_type {
        MidenNoteType::Public => NoteTag::for_public_use_case(SWAP_USE_CASE_ID, payload, execution),
        _ => NoteTag::for_local_use_case(SWAP_USE_CASE_ID, payload),
    }
}
