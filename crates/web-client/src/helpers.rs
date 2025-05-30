use miden_client::{
    Client,
    account::{Account, AccountBuilder, AccountType},
    crypto::{FeltRng, RpoRandomCoin, SecretKey},
};
use miden_lib::account::{auth::RpoFalcon512, wallets::BasicWallet};
use miden_objects::Felt;
use rand::{Rng, SeedableRng, rngs::StdRng};
use wasm_bindgen::prelude::*;

use crate::{js_error_with_context, log, models::account_storage_mode::AccountStorageMode, now};

// HELPERS
// ================================================================================================
// These methods should not be exposed to the wasm interface

/// Serves as a way to manage the logic of seed generation and retrieval of the anchor block
/// for creating a wallet account
///
/// We currently use the genesis block as the anchor block to ensure deterministic outcomes
///
/// # Errors:
/// - If rust client calls fail
/// - If the seed is passed in and is not exactly 32 bytes
pub(crate) async fn generate_wallet(
    client: &mut Client,
    storage_mode: &AccountStorageMode,
    mutable: bool,
    seed: Option<Vec<u8>>,
) -> Result<(Account, [Felt; 4], SecretKey), JsValue> {
    let start = unsafe { now() };

    let rng_start = unsafe { now() };
    let mut rng: &mut Box<dyn FeltRng> = match seed {
        Some(seed_bytes) => {
            // Attempt to convert the seed slice into a 32-byte array.
            let seed_array: [u8; 32] = seed_bytes
                .try_into()
                .map_err(|_| JsValue::from_str("Seed must be exactly 32 bytes"))?;
            let mut std_rng = StdRng::from_seed(seed_array);
            let coin_seed: [u64; 4] = std_rng.random();
            &mut (Box::new(RpoRandomCoin::new(coin_seed.map(Felt::new))) as Box<dyn FeltRng>)
        },
        None => client.rng().inner_mut(),
    };
    let rng_end = unsafe { now() };
    let rng_time = rng_end - rng_start;
    unsafe { log(&format!("RNG setup in {:.2}ms", rng_time)) };

    let key_pair_start = unsafe { now() };
    let key_pair = SecretKey::with_rng(&mut rng);
    let key_pair_end = unsafe { now() };
    let key_pair_time = key_pair_end - key_pair_start;
    unsafe { log(&format!("Generated key pair in {:.2}ms", key_pair_time)) };

    let mut init_seed = [0u8; 32];
    rng.fill_bytes(&mut init_seed);

    let account_type = if mutable {
        AccountType::RegularAccountUpdatableCode
    } else {
        AccountType::RegularAccountImmutableCode
    };

    let anchor_block = client
        .ensure_genesis_in_place()
        .await
        .map_err(|err| js_error_with_context(err, "failed to ensure genesis block is in place"))?;
    let anchor_block_end = unsafe { now() };
    let anchor_block_time = anchor_block_end - key_pair_end;
    unsafe { log(&format!("Retrieved anchor block in {:.2}ms", anchor_block_time)) };

    let (new_account, account_seed) = AccountBuilder::new(init_seed)
        .anchor(
            (&anchor_block)
                .try_into()
                .map_err(|err| js_error_with_context(err, "failed to convert anchor block"))?,
        )
        .account_type(account_type)
        .storage_mode(storage_mode.into())
        .with_component(RpoFalcon512::new(key_pair.public_key()))
        .with_component(BasicWallet)
        .build()
        .map_err(|err| js_error_with_context(err, "failed to create new wallet"))?;

    let build_end = unsafe { now() };
    let build_time = build_end - anchor_block_end;
    let total_time = build_end - start;
    unsafe { log(&format!("Built account in {:.2}ms", build_time)) };
    unsafe { log(&format!("Total wallet generation time: {:.2}ms", total_time)) };

    Ok((new_account, account_seed, key_pair))
}
