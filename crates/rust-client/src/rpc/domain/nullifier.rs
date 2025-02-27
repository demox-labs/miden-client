use miden_objects::{crypto::hash::rpo::RpoDigest, note::Nullifier};

use crate::rpc::{errors::RpcConversionError, generated::digest::Digest};

// NULLIFIER UPDATE
// ================================================================================================

/// Represents a note that was consumed in the node at a certain block.
pub struct NullifierUpdate {
    /// The nullifier of the consumed note.
    pub nullifier: Nullifier,
    /// The number of the block in which the note consumption was registered.
    pub block_num: u32,
}

// CONVERSIONS
// ================================================================================================

impl TryFrom<Digest> for Nullifier {
    type Error = RpcConversionError;

    fn try_from(value: Digest) -> Result<Self, Self::Error> {
        let digest: RpoDigest = value.try_into()?;
        Ok(digest.into())
    }
}
