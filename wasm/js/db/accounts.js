import { 
  accountCodes, 
  accountStorages, 
  accountVaults, 
  accountAuths, 
  accounts 
} from './schema.js';

import { 
  wrapAsyncFunction
} from './helper.js';


// INSERT FUNCTIONS

export function insertAccountCode(
  codeRoot, 
  code, 
  module
) {
  try {
      // Create a Blob from the ArrayBuffer
      const moduleBlob = new Blob([new Uint8Array(module)]);

      // Prepare the data object to insert
      const data = {
          root: codeRoot, // Using codeRoot as the key
          procedures: code,
          module: moduleBlob, // Blob created from ArrayBuffer
      };

      // Perform the insert using Dexie
      const syncAdd = wrapAsyncFunction(accountCodes.add);
      syncAdd(data);
  } catch (error) {
      console.error(`Error inserting code with root: ${codeRoot}:`, error);
      throw error; // Rethrow the error to handle it further up the call chain if needed
  }
}

export function insertAccountStorage(
  storageRoot, 
  storageSlots
) {
  try {
      const storageSlotsBlob = new Blob([new Uint8Array(storageSlots)]);

      // Prepare the data object to insert
      const data = {
          root: storageRoot, // Using storageRoot as the key
          slots: storageSlotsBlob, // Blob created from ArrayBuffer
      };

      // Perform the insert using Dexie
      const syncAdd = wrapAsyncFunction(accountStorages.add);
      syncAdd(data);
  } catch (error) {
      console.error(`Error inserting storage with root: ${storageRoot}:`, error);
      throw error; // Rethrow the error to handle it further up the call chain if needed
  }
}

export function insertAccountAssetVault(
  vaultRoot, 
  assets
) {
  try {
      // Prepare the data object to insert
      const data = {
          root: vaultRoot, // Using vaultRoot as the key
          assets: assets,
      };

      // Perform the insert using Dexie
      const syncAdd = wrapAsyncFunction(accountVaults.add);
      syncAdd(data);
  } catch (error) {
      console.error(`Error inserting vault with root: ${vaultRoot}:`, error);
      throw error; // Rethrow the error to handle it further up the call chain if needed
  }
}

export function insertAccountRecord(
  accountId,
  code_root,
  storage_root,
  vault_root,
  nonce,
  committed,
  account_seed
) {
  try {
      let accountSeedBlob = null;
      console.log(account_seed);
      if (account_seed) {
          console.log(account_seed)
          accountSeedBlob = new Blob([new Uint8Array(account_seed)]);
      }
      

      // Prepare the data object to insert
      const data = {
          id: accountId, // Using accountId as the key
          codeRoot: code_root,
          storageRoot: storage_root,
          vaultRoot: vault_root,
          nonce: nonce,
          committed: committed,
          accountSeed: accountSeedBlob,
      };

      // Perform the insert using Dexie
      const syncAdd = wrapAsyncFunction(accounts.add);
      syncAdd(data);
  } catch (error) {
      console.error(`Error inserting account: ${accountId}:`, error);
      throw error; // Rethrow the error to handle it further up the call chain if needed
  }
}

export function insertAccountAuth(
  accountId, 
  authInfo,
  pubKey
) {
  try {
      let authInfoBlob = new Blob([new Uint8Array(authInfo)]);
      let pubKeyArray = new Uint8Array(pubKey);
      let pubKeyBase64 = uint8ArrayToBase64(pubKeyArray);

      // Prepare the data object to insert
      const data = {
          accountId: accountId, // Using accountId as the key
          authInfo: authInfoBlob,
          pubKey: pubKeyBase64
      };

      // Perform the insert using Dexie
      const syncAdd = wrapAsyncFunction(accountAuths.add);
      syncAdd(data);
  } catch (error) {
      console.error(`Error inserting auth for account: ${accountId}:`, error);
      throw error; // Rethrow the error to handle it further up the call chain if needed
  }
}

function uint8ArrayToBase64(bytes) {
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return btoa(binary);
}