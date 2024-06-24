use std::fmt::Display;

pub mod accounts;
pub mod blocks;
pub mod digest;
pub mod merkle;
pub mod notes;
pub mod nullifiers;

// UTILITIES
// ================================================================================================

pub fn convert<T, From, To>(from: T) -> Vec<To>
where
    T: IntoIterator<Item = From>,
    From: Into<To>,
{
    from.into_iter().map(|e| e.into()).collect()
}

pub fn try_convert<T, E, From, To>(from: T) -> Result<Vec<To>, E>
where
    T: IntoIterator<Item = From>,
    From: TryInto<To, Error = E>,
{
    from.into_iter().map(|e| e.try_into()).collect()
}

pub fn format_opt<T: Display>(opt: Option<&T>) -> String {
    opt.map(ToString::to_string).unwrap_or("None".to_owned())
}
