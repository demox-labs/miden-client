use alloc::{collections::BTreeSet, rc::Rc};
use core::fmt;

use miden_objects::{accounts::AccountId, assets::Asset, notes::Note, Word};

use super::transactions::transaction_request::known_script_roots::{P2ID, P2IDR, SWAP};
use crate::{
    errors::{InvalidNoteInputsError, ScreenerError},
    store::Store,
};

#[derive(Debug, Copy, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum NoteRelevance {
    /// The note can be consumed at any time.
    Always,
    /// The note can be consumed after the block with the specified number.
    After(u32),
}

impl fmt::Display for NoteRelevance {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NoteRelevance::Always => write!(f, "Always"),
            NoteRelevance::After(height) => write!(f, "After block {}", height),
        }
    }
}

pub struct NoteScreener<S: Store> {
    store: Rc<S>,
}

impl<S: Store> NoteScreener<S> {
    pub fn new(store: Rc<S>) -> Self {
        Self { store }
    }

    /// Returns a vector of tuples describing the relevance of the provided note to the
    /// accounts monitored by this screener.
    ///
    /// Does a fast check for known scripts (P2ID, P2IDR, SWAP). We're currently
    /// unable to execute notes that are not committed so a slow check for other scripts is currently
    /// not available.
    #[cfg(not(target_arch = "wasm32"))]
    pub fn check_relevance(
        &self,
        note: &Note,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        let account_ids = BTreeSet::from_iter(self.store.get_account_ids()?);

        let script_hash = note.script().hash().to_string();
        let note_relevance = match script_hash.as_str() {
            P2ID => Self::check_p2id_relevance(note, &account_ids)?,
            P2IDR => Self::check_p2idr_relevance(note, &account_ids)?,
            SWAP => self.check_swap_relevance(note, &account_ids)?,
            _ => self.check_script_relevance(note, &account_ids)?,
        };

        Ok(note_relevance)
    }

    #[cfg(target_arch = "wasm32")]
    pub async fn check_relevance(
        &self,
        note: &Note,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        let account_ids = BTreeSet::from_iter(self.store.get_account_ids().await?);

        let script_hash = note.script().hash().to_string();
        let note_relevance = match script_hash.as_str() {
            P2ID => Self::check_p2id_relevance(note, &account_ids)?,
            P2IDR => Self::check_p2idr_relevance(note, &account_ids)?,
            SWAP => self.check_swap_relevance(note, &account_ids).await?,
            _ => self.check_script_relevance(note, &account_ids)?,
        };

        Ok(note_relevance)
    }

    fn check_p2id_relevance(
        note: &Note,
        account_ids: &BTreeSet<AccountId>,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        let mut note_inputs_iter = note.inputs().values().iter();
        let account_id_felt = note_inputs_iter
            .next()
            .ok_or(InvalidNoteInputsError::NumInputsError(note.id(), 1))?;

        if note_inputs_iter.next().is_some() {
            return Err(InvalidNoteInputsError::NumInputsError(note.id(), 1).into());
        }

        let account_id = AccountId::try_from(*account_id_felt)
            .map_err(|err| InvalidNoteInputsError::AccountError(note.id(), err))?;

        if !account_ids.contains(&account_id) {
            return Ok(vec![]);
        }
        Ok(vec![(account_id, NoteRelevance::Always)])
    }

    fn check_p2idr_relevance(
        note: &Note,
        account_ids: &BTreeSet<AccountId>,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        let mut note_inputs_iter = note.inputs().values().iter();
        let account_id_felt = note_inputs_iter
            .next()
            .ok_or(InvalidNoteInputsError::NumInputsError(note.id(), 2))?;
        let recall_height_felt = note_inputs_iter
            .next()
            .ok_or(InvalidNoteInputsError::NumInputsError(note.id(), 2))?;

        if note_inputs_iter.next().is_some() {
            return Err(InvalidNoteInputsError::NumInputsError(note.id(), 2).into());
        }

        let sender = note.metadata().sender();
        let recall_height: u32 = recall_height_felt.as_int().try_into().map_err(|_err| {
            InvalidNoteInputsError::BlockNumberError(note.id(), recall_height_felt.as_int())
        })?;

        let account_id = AccountId::try_from(*account_id_felt)
            .map_err(|err| InvalidNoteInputsError::AccountError(note.id(), err))?;

        Ok(vec![
            (account_id, NoteRelevance::Always),
            (sender, NoteRelevance::After(recall_height)),
        ]
        .into_iter()
        .filter(|(account_id, _relevance)| account_ids.contains(account_id))
        .collect())
    }

    /// Checks if a swap note can be consumed by any account whose id is in `account_ids`
    ///
    /// This implementation serves as a placeholder as we're currently not able to create, execute
    /// and send SWAP NOTES. Hence, it's also untested. The main logic should be the same: for each
    /// account check if it has enough of the wanted asset.
    /// This is also very inefficient as we're loading the full accounts. We should instead just
    /// load the account's vaults, or even have a function in the `Store` to do this.
    ///
    /// TODO: test/revisit this in the future
    #[cfg(not(target_arch = "wasm32"))]
    fn check_swap_relevance(
        &self,
        note: &Note,
        account_ids: &BTreeSet<AccountId>,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        let note_inputs = note.inputs().to_vec();
        if note_inputs.len() != 9 {
            return Ok(Vec::new());
        }

        // get the demanded asset from the note's inputs
        let asset: Asset =
            Word::from([note_inputs[4], note_inputs[5], note_inputs[6], note_inputs[7]])
                .try_into()
                .map_err(|err| InvalidNoteInputsError::AssetError(note.id(), err))?;
        let asset_faucet_id = AccountId::try_from(asset.vault_key()[3])
            .map_err(|err| InvalidNoteInputsError::AccountError(note.id(), err))?;

        let mut accounts_with_relevance = Vec::new();

        for account_id in account_ids {
            let (account, _) = self.store.get_account(*account_id)?;

            // Check that the account can cover the demanded asset
            match asset {
                Asset::NonFungible(_non_fungible_asset)
                    if account.vault().has_non_fungible_asset(asset).expect(
                        "Should be able to query has_non_fungible_asset for an Asset::NonFungible",
                    ) =>
                {
                    accounts_with_relevance.push((*account_id, NoteRelevance::Always))
                },
                Asset::Fungible(fungible_asset)
                    if account
                        .vault()
                        .get_balance(asset_faucet_id)
                        .expect("Should be able to query get_balance for an Asset::Fungible")
                        >= fungible_asset.amount() =>
                {
                    accounts_with_relevance.push((*account_id, NoteRelevance::Always))
                },
                _ => {},
            }
        }

        Ok(accounts_with_relevance)
    }

    #[cfg(target_arch = "wasm32")]
    async fn check_swap_relevance(
        &self,
        note: &Note,
        account_ids: &BTreeSet<AccountId>,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        let note_inputs = note.inputs().to_vec();
        if note_inputs.len() != 9 {
            return Ok(Vec::new());
        }

        // get the demanded asset from the note's inputs
        let asset: Asset =
            Word::from([note_inputs[4], note_inputs[5], note_inputs[6], note_inputs[7]])
                .try_into()
                .map_err(|err| InvalidNoteInputsError::AssetError(note.id(), err))?;
        let asset_faucet_id = AccountId::try_from(asset.vault_key()[3])
            .map_err(|err| InvalidNoteInputsError::AccountError(note.id(), err))?;

        let mut accounts_with_relevance = Vec::new();

        for account_id in account_ids {
            let (account, _) = self.store.get_account(*account_id)?;

            // Check that the account can cover the demanded asset
            match asset {
                Asset::NonFungible(_non_fungible_asset)
                    if account.vault().has_non_fungible_asset(asset).expect(
                        "Should be able to query has_non_fungible_asset for an Asset::NonFungible",
                    ) =>
                {
                    accounts_with_relevance.push((*account_id, NoteRelevance::Always))
                },
                Asset::Fungible(fungible_asset)
                    if account
                        .vault()
                        .get_balance(asset_faucet_id)
                        .expect("Should be able to query get_balance for an Asset::Fungible")
                        >= fungible_asset.amount() =>
                {
                    accounts_with_relevance.push((*account_id, NoteRelevance::Always))
                },
                _ => {},
            }
        }

        Ok(accounts_with_relevance)
    }

    fn check_script_relevance(
        &self,
        _note: &Note,
        account_ids: &BTreeSet<AccountId>,
    ) -> Result<Vec<(AccountId, NoteRelevance)>, ScreenerError> {
        // TODO: try to execute the note script against relevant accounts; this will
        // require querying data from the store
        Ok(account_ids
            .iter()
            .map(|account_id| (*account_id, NoteRelevance::Always))
            .collect())
    }
}
