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
    NEW_MINT_TRANSACTION: "new_mint_transaction",
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
            } catch (error) {
                console.error("WORKER: Error in new_faucet:", error);
                self.postMessage({ requestId, error: error });
                return;
            }
            break;
        
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
                console.log("WORKER: new_mint_transaction returned", transactionResult);
                // Serialize the result for the main thread
                const result = {
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
            } catch (error) {
                console.error("WORKER: Error in new_mint_transaction:", error);
                self.postMessage({ requestId, error: error });
            }

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
