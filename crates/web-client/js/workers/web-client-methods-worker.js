import wasm from "../../dist/wasm.js";

console.log("WORKER: Listening for messages");

const WorkerAction = Object.freeze({
    INIT: "init",
    CALL_METHOD: "callMethod",
});

const MethodName = Object.freeze({
    CREATE_CLIENT: "create_client",
    NEW_WALLET: "new_wallet",
    NEW_FAUCET: "new_faucet",
    NEW_TRANSACTION: "new_transaction",
    NEW_MINT_TRANSACTION: "new_mint_transaction",
    NEW_CONSUME_TRANSACTION: "new_consume_transaction",
    NEW_SEND_TRANSACTION: "new_send_transaction",
    SYNC_STATE: "sync_state",
})

let wasmWebClient = null;
let ready = false;
let messageQueue = []; // Queue to hold incoming messages
let processing = false; // Flag to indicate if the worker is processing a message

async function processMessage(event) {
    console.log("WORKER: Received message", JSON.stringify(event.data, null, 2));
  const { action, args, methodName, requestId } = event.data;

  try {
    if (action === WorkerAction.INIT) {
      console.log("WORKER: Received init message");
      wasmWebClient = new wasm.WebClient(...args);
      await wasmWebClient.create_client();
      console.log("WORKER: WASM WebClient initialized");
      ready = true;
      self.postMessage({ ready: true });
    } else if (action === WorkerAction.CALL_METHOD) {
      console.log(`WORKER: Received callMethod message for '${methodName}'`);
      if (!ready) throw new Error("Worker is not ready. Call 'init' first.");
      if (!wasmWebClient) throw new Error("WebClient not initialized in worker.");

      let result;
      switch (methodName) {
        case MethodName.NEW_WALLET:
          console.log("WORKER: Calling new_wallet");
          const [walletStorageModeStr, mutable] = args;
          console.log("WORKER: storageModeStr", JSON.stringify(walletStorageModeStr));
            console.log("WORKER: mutable", JSON.stringify(mutable));

          // Convert storage mode string to WASM AccountStorageMode object
          const walletStorageMode = wasm.AccountStorageMode.from_str(walletStorageModeStr);

          // Call the WASM WebClient's `new_wallet` method
          const wallet = await wasmWebClient.new_wallet(walletStorageMode, mutable);
          console.log("WORKER: new_wallet returned", wallet);

          // Serialize the result for the main thread
          const serializedWallet = await wallet.serialize();
          result = serializedWallet.buffer; // Send the ArrayBuffer
          break;
        
        case MethodName.NEW_FAUCET:
            try { 
                console.log("WORKER: Calling new_faucet");
                const [faucetStorageModeStr, nonFungible, tokenSymbol, decimals, maxSupplyStr] = args;
                // Convert storage mode string to WASM AccountStorageMode object
                const faucetStorageMode = wasm.AccountStorageMode.from_str(faucetStorageModeStr);
                const maxSupply = BigInt(maxSupplyStr);
                const faucet = await wasmWebClient.new_faucet(faucetStorageMode, nonFungible, tokenSymbol, decimals, maxSupply);
                    console.log("WORKER: new_faucet returned", faucet);
                    // Serialize the result for the main thread
                    const serializedFaucet = await faucet.serialize();
                    result = serializedFaucet.buffer; // Send the ArrayBuffer
                break;
            } catch (error) {
                console.error("WORKER: Error in new_faucet:", error);
                self.postMessage({ requestId, error: error });
                return;
            }

        case MethodName.NEW_TRANSACTION:
            try {
                console.log("WORKER: Calling new_transaction");
                const [accountIdStr, serializedTransactionRequest] = args;
                console.log("WORKER: accountIdStr", JSON.stringify(accountIdStr));
                console.log("WORKER: serializedTransactionRequest", JSON.stringify(serializedTransactionRequest));
                const accountId = wasm.AccountId.from_hex(accountIdStr);
                const transactionRequest = wasm.TransactionRequest.deserialize(new Uint8Array(serializedTransactionRequest));
                await wasmWebClient.fetch_and_cache_account_auth_by_pub_key(accountId);
                const transactionResult = await wasmWebClient.new_transaction(accountId, transactionRequest);
                console.log("WORKER: new_transaction returned", JSON.stringify(transactionResult, null, 2));
                console.log("WORKER: transactionResult.executed_transaction().id().to_hex()", JSON.stringify(transactionResult.executed_transaction().id().to_hex()));
                result = {
                    transactionId: transactionResult.executed_transaction().id().to_hex()
                }
                break;
            } catch (error) {
                console.error("WORKER: Error in new_transaction:", error);
                self.postMessage({ requestId, error: error });
                return;
            }
        
        case MethodName.NEW_MINT_TRANSACTION:
            try {
                console.log("WORKER: Calling new_mint_transaction");
                const [targetAccountIdStr, faucetIdStr, noteTypeStr, amountStr] = args;
                console.log("WORKER: targetAccountIdStr", JSON.stringify(targetAccountIdStr));
                console.log("WORKER: faucetIdStr", JSON.stringify(faucetIdStr));
                console.log("WORKER: noteTypeStr", JSON.stringify(noteTypeStr));
                console.log("WORKER: amountStr", JSON.stringify(amountStr));
                const targetAccountId = wasm.AccountId.from_hex(targetAccountIdStr);
                const faucetId = wasm.AccountId.from_hex(faucetIdStr);
                const noteType = wasm.NoteType.from_str(noteTypeStr);
                const amount = BigInt(amountStr);
                await wasmWebClient.fetch_and_cache_account_auth_by_pub_key(faucetId);
                const transactionResult = await wasmWebClient.new_mint_transaction(targetAccountId, faucetId, noteType, amount);
                console.log("WORKER: new_mint_transaction returned", JSON.stringify(transactionResult, null, 2));
                console.log("WORKER: transactionResult.executed_transaction().id().to_hex()", JSON.stringify(transactionResult.executed_transaction().id().to_hex()));
                console.log("WORKER: transactionResult.created_notes().num_notes()", JSON.stringify(transactionResult.created_notes().num_notes()));
                console.log("WORKER: transactionResult.account_delta().nonce()", JSON.stringify(transactionResult.account_delta().nonce()?.to_string()));
                console.log("WORKER: transactionResult.created_notes().notes()[0].id().to_string()", JSON.stringify(transactionResult.created_notes().notes()[0].id().to_string()));
                // Serialize the result for the main thread
                result = {
                    transactionId: transactionResult
                        .executed_transaction().id().to_hex(),
                    numOutputNotesCreated: transactionResult
                        .created_notes()
                        .num_notes(),
                    nonce: transactionResult
                        .account_delta().nonce()?.to_string(),
                    createdNoteId: transactionResult
                        .created_notes()
                        .notes()[0]
                        .id()
                        .to_string(),
                };
                break;
            } catch (error) {
                console.error("WORKER: Error in new_mint_transaction:", error);
                self.postMessage({ requestId, error: error });
                return;
            }
        
        case MethodName.NEW_CONSUME_TRANSACTION:
            try {
                console.log("WORKER: Calling consume_transaction");
                const [targetAccountIdStr, noteId] = args;
                console.log("WORKER: targetAccountIdStr", JSON.stringify(targetAccountIdStr));
                console.log("WORKER: noteId", JSON.stringify(noteId));
                const targetAccountId = wasm.AccountId.from_hex(targetAccountIdStr);
                await wasmWebClient.fetch_and_cache_account_auth_by_pub_key(targetAccountId);
                const transactionResult = await wasmWebClient.new_consume_transaction(targetAccountId, noteId);
                console.log("WORKER: consume_transaction returned", JSON.stringify(transactionResult, null, 2));
                console.log("WORKER: transactionResult.executed_transaction().id().to_hex()", JSON.stringify(transactionResult.executed_transaction().id().to_hex()));
                console.log("WORKER: transactionResult.consumedNotes().num_notes()", JSON.stringify(transactionResult.consumed_notes().num_notes()));
                console.log("WORKER: transactionResult.account_delta().nonce()", JSON.stringify(transactionResult.account_delta().nonce()?.to_string()));
                // Serialize the result for the main thread
                result = {
                    transactionId: transactionResult.executed_transaction().id().to_hex(),
                    numConsumedNotes: transactionResult.consumed_notes().num_notes(),
                    nonce: transactionResult.account_delta().nonce()?.to_string(),
                };
                break;
            } catch (error) {
                console.error("WORKER: Error in consume_transaction:", JSON.stringify(error, null, 2));
                self.postMessage({ requestId, error: error });
                return;
            }

        case MethodName.NEW_SEND_TRANSACTION:
            try {
                console.log("WORKER: Calling new_send_transaction");
                const [senderAccountIdStr, receiverAccountIdStr, faucetIdStr, noteTypeStr, amountStr, recallHeight] = args;
                console.log("WORKER: senderAccountIdStr", JSON.stringify(senderAccountIdStr));
                console.log("WORKER: receiverAccountIdStr", JSON.stringify(receiverAccountIdStr));
                console.log("WORKER: faucetIdStr", JSON.stringify(faucetIdStr));
                console.log("WORKER: noteTypeStr", JSON.stringify(noteTypeStr));
                console.log("WORKER: amountStr", JSON.stringify(amountStr));
                console.log("WORKER: recallHeight", JSON.stringify(recallHeight));
                const senderAccountId = wasm.AccountId.from_hex(senderAccountIdStr);
                const receiverAccountId = wasm.AccountId.from_hex(receiverAccountIdStr);
                const faucetId = wasm.AccountId.from_hex(faucetIdStr);
                const noteType = wasm.NoteType.from_str(noteTypeStr);
                const amount = BigInt(amountStr);
                await wasmWebClient.fetch_and_cache_account_auth_by_pub_key(senderAccountId);
                const transactionResult = await wasmWebClient.new_send_transaction(senderAccountId, receiverAccountId, faucetId, noteType, amount, recallHeight);
                console.log("WORKER: new_send_transaction returned", JSON.stringify(transactionResult, null, 2));
                console.log("WORKER: transactionResult.executed_transaction().id().to_hex()", JSON.stringify(transactionResult.executed_transaction().id().to_hex()));
                let send_created_notes = transactionResult.created_notes().notes();
                let send_created_note_ids = send_created_notes.map((note) =>
                    note.id().to_string()
                );
                console.log("WORKER: send_created_note_ids", JSON.stringify(send_created_note_ids));
                result = {
                    transactionId: transactionResult.executed_transaction().id().to_hex(),
                    noteIds: send_created_note_ids
                }
                break;
            } catch (error) {
                console.error("WORKER: Error in new_send_transaction:", error);
                self.postMessage({ requestId, error: error });
                return;
            }
        
        case MethodName.SYNC_STATE:
            try {
                console.log("WORKER: Calling sync_state");
                await wasmWebClient.sync_state();
                console.log("WORKER: sync_state completed");
                result = null;
                break;
            } catch (error) {
                console.error("WORKER: Error in sync_state:", error);
                self.postMessage({ requestId, error: error });
                return;
            }
            break;

        default:
          throw new Error(`Unsupported method: ${methodName}`);
      }

      self.postMessage({ requestId, result });
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error(`WORKER: Error occurred - ${error.message}`);
    self.postMessage({ requestId, error: error.message });
  }
}

// Function to process the message queue
async function processQueue() {
  if (processing || messageQueue.length === 0) return;

  processing = true;
  const event = messageQueue.shift();

  try {
    await processMessage(event);
  } finally {
    processing = false;
    // Continue processing the next message in the queue
    processQueue();
  }
}

// Enqueue incoming messages
self.onmessage = (event) => {
  messageQueue.push(event);
  processQueue();
};

// Send a "ready to listen" message immediately after the script loads
self.postMessage({ ready: true });
