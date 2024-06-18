# @demox-labs/miden-sdk
The @demox-labs/miden-sdk is a toolkit designed for interacting with the Miden virtual machine. It offers essential tools and functionalities for developers aiming to integrate or utilize Miden VM capabilities in their applications.

## Installation
To install the package via npm, run the following command:

```javascript
npm i @demox-labs/miden-sdk
```

For yarn:
```javascript
yarn add @demox-labs/miden-sdk
```

## Usage

```typescript
import { WebClient } from "@demox-labs/miden-sdk";

const webClient = new WebClient();
await webClient.create_client();

// Use webclient to create accounts, notes, transactions, etc.
// This will create a mutable, off-chain account and store it in IndexedDB
const accountId = await webClient.new_wallet("OffChain", true);
```

## Examples
### The WebClient
The WebClient is your gateway to creating and interacting with anything miden vm related.
Example:
```typescript
// Creates a new WebClient instance which can then be configured after
const webClient = new WebClient();

// Creates the internal client of a previously instantiated WebClient.
// Can provide `node_url` as an optional parameter. Defaults to "http://localhost:57291".
// See https://github.com/0xPolygonMiden/miden-node for setting up and running your own node locally
await webClient.create_client();
```
### Accounts
You can use the WebClient to create and retrieve account information.
```typescript
const webClient = new WebClient();
await webClient.create_client();

/**
 * Creates a new wallet account.
 * 
 * @param storage_type String. Either "OffChain" or "OnChain".
 * @param mutable Boolean. Whether the wallet code is mutable or not
 * 
 * Returns: Wallet Id
 */
const walletId = await webClient.new_wallet("OffChain", true);

/**
 * Creates a new faucet account.
 * 
 * @param storage_type String. Either "OffChain" or "OnChain".
 * @param non_fungible Boolean. Whether the faucet is non_fungible or not. NOTE: Non-fungible faucets are not supported yet
 * @param token_symbol String. Token symbol of the token the faucet creates
 * @param decimals String. Decimal precision of token.
 * @param max_supply String. Maximum token supply
 */ 
const faucetId = await webClient.new_faucet("OffChain", true, "TOK", 6, 1_000_000)

// Returns all accounts. Both wallets and faucets.
const accounts = await webClient.get_accounts()

// Gets a single account by id
const account = await webClient.get_account("0x9258fec00ad6d9bc");
```

### Transactions
You can use the webClient to facilitate transactions between accounts.

Let's mint some tokens for our wallet from our faucet:
```typescript
const webClient = new WebClient();
await webClient.create_client();
const walletId = await webClient.new_wallet("OffChain", true);
const faucetId = await webClient.new_faucet("OffChain", true, "TOK", 6, 1_000_000);

// Syncs web client with node state.
await webClient.sync_state();
// Caches faucet account auth. A workaround to allow for synchronicity in the transaction flow.
await webClient.fetch_and_cache_account_auth_by_pub_key(faucetId);

// Mint 10_000 tokens for the previously created wallet via a Private Note
const newTxnResult = await webClient.new_mint_transaction(walletId, faucetId, "Private", 10_000)

// Sync state again
await webClient.sync_state();
```

## API Reference

```typescript
/**
 * @returns {Promise<any>}
 */
get_accounts(): Promise<any>;

/**
 * @param {string} account_id
 * @returns {Promise<any>}
 */
get_account(account_id: string): Promise<any>;

/**
 * @param {any} pub_key_bytes
 * @returns {any}
 */
get_account_auth_by_pub_key(pub_key_bytes: any): any;

/**
 * @param {string} account_id
 * @returns {Promise<any>}
 */
fetch_and_cache_account_auth_by_pub_key(account_id: string): Promise<any>;

/**
 * @param {string} note_id
 * @returns {Promise<any>}
 */
export_note(note_id: string): Promise<any>;

/**
 * @param {any} account_bytes
 * @returns {Promise<any>}
 */
import_account(account_bytes: any): Promise<any>;

/**
 * @param {string} note_bytes
 * @param {boolean} verify
 * @returns {Promise<any>}
 */
import_note(note_bytes: string, verify: boolean): Promise<any>;

/**
 * @param {string} storage_type
 * @param {boolean} mutable
 * @returns {Promise<any>}
 */
new_wallet(storage_type: string, mutable: boolean): Promise<any>;

/**
 * @param {string} storage_type
 * @param {boolean} non_fungible
 * @param {string} token_symbol
 * @param {string} decimals
 * @param {string} max_supply
 * @returns {Promise<any>}
 */
new_faucet(storage_type: string, non_fungible: boolean, token_symbol: string, decimals: string, max_supply: string): Promise<any>;

/**
 * @param {string} target_account_id
 * @param {string} faucet_id
 * @param {string} note_type
 * @param {string} amount
 * @returns {Promise<NewTransactionResult>}
 */
new_mint_transaction(target_account_id: string, faucet_id: string, note_type: string, amount: string): Promise<NewTransactionResult>;

/**
 * @param {string} sender_account_id
 * @param {string} target_account_id
 * @param {string} faucet_id
 * @param {string} note_type
 * @param {string} amount
 * @param {string | undefined} [recall_height]
 * @returns {Promise<NewTransactionResult>}
 */
new_send_transaction(sender_account_id: string, target_account_id: string, faucet_id: string, note_type: string, amount: string, recall_height?: string): Promise<NewTransactionResult>;

/**
 * @param {string} account_id
 * @param {(string)[]} list_of_notes
 * @returns {Promise<NewTransactionResult>}
 */
new_consume_transaction(account_id: string, list_of_notes: (string)[]): Promise<NewTransactionResult>;

/**
 * @param {string} sender_account_id
 * @param {string} offered_asset_faucet_id
 * @param {string} offered_asset_amount
 * @param {string} requested_asset_faucet_id
 * @param {string} requested_asset_amount
 * @param {string} note_type
 * @returns {Promise<NewSwapTransactionResult>}
 */
new_swap_transaction(sender_account_id: string, offered_asset_faucet_id: string, offered_asset_amount: string, requested_asset_faucet_id: string, requested_asset_amount: string, note_type: string): Promise<NewSwapTransactionResult>;

/**
 * @param {any} filter
 * @returns {Promise<any>}
 */
get_input_notes(filter: any): Promise<any>;

/**
 * @param {string} note_id
 * @returns {Promise<any>}
 */
get_input_note(note_id: string): Promise<any>;

/**
 * @param {any} filter
 * @returns {Promise<any>}
 */
get_output_notes(filter: any): Promise<any>;

/**
 * @param {string} note_id
 * @returns {Promise<any>}
 */
get_output_note(note_id: string): Promise<any>;

/**
 * @returns {Promise<any>}
 */
sync_state(): Promise<any>;

/**
 * @returns {Promise<any>}
 */
get_transactions(): Promise<any>;

/**
 * @param {string} tag
 * @returns {Promise<any>}
 */
add_tag(tag: string): Promise<any>;

/**
 */
constructor();

/**
 * @param {string | undefined} [node_url]
 * @returns {Promise<any>}
 */
create_client(node_url?: string): Promise<any>;
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.