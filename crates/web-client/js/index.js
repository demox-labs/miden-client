import wasm from "../dist/wasm.js";

const {
  Account,
  AccountHeader,
  AccountId,
  AccountStorageMode,
  AdviceMap,
  AuthSecretKey,
  ConsumableNoteRecord,
  Felt,
  FeltArray,
  FungibleAsset,
  InputNoteState,
  Note,
  NoteAssets,
  NoteConsumability,
  NoteExecutionHint,
  NoteExecutionMode,
  NoteFilter,
  NoteFilterTypes,
  NoteId,
  NoteIdAndArgs,
  NoteIdAndArgsArray,
  NoteInputs,
  NoteMetadata,
  NoteRecipient,
  NoteScript,
  NoteTag,
  NoteType,
  OutputNote,
  OutputNotesArray,
  Rpo256,
  TestUtils,
  TransactionFilter,
  TransactionProver,
  TransactionRequest,
  TransactionRequestBuilder,
  TransactionScriptInputPair,
  TransactionScriptInputPairArray,
  Word,
  WebClient: WasmWebClient, // Alias the WASM-exported WebClient
} = wasm;

export {
  Account,
  AccountHeader,
  AccountId,
  AccountStorageMode,
  AdviceMap,
  AuthSecretKey,
  ConsumableNoteRecord,
  Felt,
  FeltArray,
  FungibleAsset,
  InputNoteState,
  Note,
  NoteAssets,
  NoteConsumability,
  NoteExecutionHint,
  NoteExecutionMode,
  NoteFilter,
  NoteFilterTypes,
  NoteId,
  NoteIdAndArgs,
  NoteIdAndArgsArray,
  NoteInputs,
  NoteMetadata,
  NoteRecipient,
  NoteScript,
  NoteTag,
  NoteType,
  OutputNote,
  OutputNotesArray,
  Rpo256,
  TestUtils,
  TransactionFilter,
  TransactionProver,
  TransactionRequest,
  TransactionRequestBuilder,
  TransactionScriptInputPair,
  TransactionScriptInputPairArray,
  Word
};

// Wrapper for WebClient
export class WebClient {
  constructor(...args) {
    this.worker = new Worker(new URL("./workers/web-client-methods-worker.js", import.meta.url), {
      type: "module",
    });

    this.ready = new Promise((resolve) => {
      this.worker.onmessage = (event) => {
        if (event.data.ready) resolve();
      };
    });

    // Ensure worker is fully ready before initializing
    (async () => {
      await this.ready;
      this.worker.postMessage({ action: "init", args });
    })();

    this.wasmWebClient = new WasmWebClient(...args);

    return new Proxy(this, {
      get: (target, prop) => {
        if (typeof prop === "string" && !(prop in target)) {
          return async (...args) => {
            if (["new_wallet", "new_faucet", "new_mint_transaction"].includes(prop)) {
              console.log("INDEX>JS: Proxying method with worker", JSON.stringify(prop));
              return target.callMethodWithWorker(prop, ...args);
            } else {
              return await target.callMethodDirectly(prop, ...args);
            }
          };
        }
        return target[prop];
      },
    });
  }

  async callMethodWithWorker(methodName, ...args) {
    await this.ready;

    console.log("INDEX.JS: Sending to worker", JSON.stringify({ methodName, args }, null, 2));

    return new Promise((resolve, reject) => {
      const requestId = `${methodName}-${Date.now()}`;
      this.worker.onmessage = (event) => {
        if (event.data.requestId === requestId) {
          if (event.data.error) {
            console.error(`INDEX.JS: Error from worker in ${methodName}:`, event.data.error);
            reject(new Error(event.data.error)); // Reject the promise with an error
          } else {
            resolve(event.data.result);
          }
        }
      };
      this.worker.postMessage({ action: "callMethod", methodName, args, requestId });
    });
  }

  async callMethodDirectly(methodName, ...args) {
    if (!this.wasmWebClient) {
      throw new Error("WASM WebClient is not initialized.");
    }

    const method = this.wasmWebClient[methodName];
    if (typeof method !== "function") {
      throw new Error(`Method ${methodName} does not exist on WASM WebClient.`);
    }

    return await method.apply(this.wasmWebClient, args);
  }

  async new_wallet(storageMode, mutable) {
    try {
      const serializedStorageMode = storageMode.as_str();
      const serializedAccountBytes = await this.callMethodWithWorker("new_wallet", serializedStorageMode, mutable);
      return wasm.Account.deserialize(new Uint8Array(serializedAccountBytes));
    } catch (error) {
      console.error("INDEX.JS: Error in new_wallet:", error);
      throw error;
    }
  }

  async new_faucet(storageMode, nonFungible, tokenSymbol, decimals, maxSupply) {
    try {
      const serializedStorageMode = storageMode.as_str();
      const serializedMaxSupply = maxSupply.toString();
      const serializedAccountBytes = await this.callMethodWithWorker(
        "new_faucet",
        serializedStorageMode,
        nonFungible,
        tokenSymbol,
        decimals,
        serializedMaxSupply
      );
  
      console.log("INDEX.JS: Received response from worker:", serializedAccountBytes);
  
      return wasm.Account.deserialize(new Uint8Array(serializedAccountBytes));
    } catch (error) {
      console.error("INDEX.JS: Error in new_faucet:", error);
      throw error;
    }
  }

  async new_transaction(accountId, transactionRequest) {
    const serializedAccountId = accountId.to_string();
    console.log("INDEX.JS: attempting to serialize transaction request");
    const serializedTransactionRequest = transactionRequest.serialize();
    try {
      const result = await this.callMethodWithWorker(
        "new_transaction",
        serializedAccountId,
        serializedTransactionRequest
      );
      console.log("INDEX.JS: Received response from worker:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("INDEX.JS: Error in new_transaction:", error);
      throw error;
    }
  }

  async new_mint_transaction(targetAccountId, faucetId, noteType, amount) {
    const serializedTargetAccountId = targetAccountId.to_string();
    const serializedFaucetId = faucetId.to_string();
    const serializedNoteType = noteType.as_str();
    const serializedAmount = amount.toString();
    // console log but JSON stringify each argument
    console.log("INDEX.JS: Calling new_mint_transaction with", JSON.stringify(serializedTargetAccountId), JSON.stringify(serializedFaucetId), JSON.stringify(serializedNoteType), JSON.stringify(serializedAmount));
    try {
      const result = await this.callMethodWithWorker(
        "new_mint_transaction",
        serializedTargetAccountId,
        serializedFaucetId,
        serializedNoteType,
        serializedAmount
      );
      console.log("INDEX.JS: Received response from worker:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("INDEX.JS: Error in new_mint_transaction:", error);
      throw error; // Ensure the test catches and asserts
    }
  }

  async new_consume_transaction(targetAccountId, noteId) {
    const serializedTargetAccountId = targetAccountId.to_string();
    try {
      const result = await this.callMethodWithWorker(
        "new_consume_transaction",
        serializedTargetAccountId,
        noteId
      );
      console.log("INDEX.JS: Received response from worker:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("INDEX.JS: Error in consume_transaction:", JSON.stringify(error));
      throw error;
    }
  }

  async new_send_transaction(senderAccountId, receiverAccountId, faucetId, noteType, amount, recallHeight = null) {
    const serializedSenderAccountId = senderAccountId.to_string();
    const serializedReceiverAccountId = receiverAccountId.to_string();
    const serializedFaucetId = faucetId.to_string();
    const serializedNoteType = noteType.as_str();
    const serializedAmount = amount.toString();
    try {
      const result = await this.callMethodWithWorker(
        "new_send_transaction",
        serializedSenderAccountId,
        serializedReceiverAccountId,
        serializedFaucetId,
        serializedNoteType,
        serializedAmount,
        recallHeight
      );
      console.log("INDEX.JS: Received response from worker:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("INDEX.JS: Error in send_transaction:", error);
      throw error;
    }
  }

  async sync_state() {
    try {
      await this.callMethodWithWorker("sync_state");
    } catch (error) {
      console.error("INDEX.JS: Error in sync_state:", error);
      throw error
    }
  }

  terminate() {
    this.worker.terminate();
  }
}
