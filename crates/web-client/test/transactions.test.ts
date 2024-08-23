import { expect } from "chai";
import {
  addTag,
  createNewConsumeTransaction,
  createNewFaucet,
  createNewMintTransaction,
  createNewSendTransaction,
  createNewSwapTransaction,
  createNewWallet,
  fetchCacheAccountAuth,
  getTransactions,
  isValidAddress,
  syncState,
} from "./webClientTestUtils.js";

describe("transactions tests", () => {
  it("new mint transaction", async () => {
    console.log("starting new mint transaction test");
    const targetAccountId = await createNewWallet("OffChain", false);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DMX",
      "10",
      "1000000"
    );
    await fetchCacheAccountAuth(faucetId);
    const result = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    console.log({ result });
  });
  it("new consume transaction", async () => {
    const targetAccountId = await createNewWallet("OffChain", false);
    const faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DMX",
      "10",
      "1000000"
    );

    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetId);
    const mintResult = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);

    const consumeResult = await createNewConsumeTransaction(
      targetAccountId,
      mintResult.created_note_ids
    );

    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    console.log({ consumeResult });
  });

  it("new send transaction", async () => {
    const senderAccountId = await createNewWallet("OffChain", false);
    const targetAccountId = await createNewWallet("OffChain", false);
    const faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DMX",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 10000));

    await fetchCacheAccountAuth(faucetId);

    const mintResult = await createNewMintTransaction(
      senderAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    await fetchCacheAccountAuth(senderAccountId);

    await createNewConsumeTransaction(
      senderAccountId,
      mintResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);
    const sendResult = await createNewSendTransaction(
      senderAccountId,
      targetAccountId,
      faucetId,
      "Private",
      "500",
      mintResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);

    const consumeResult = await createNewConsumeTransaction(
      targetAccountId,
      sendResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    console.log({ consumeResult });
  });
  it("new send transaction with recall height", async () => {
    console.log("testNewSendTransactionWithRecallHeight started");

    let senderAccountId = await createNewWallet("OffChain", true);
    let targetAccountId = await createNewWallet("OffChain", true);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 10000));

    await fetchCacheAccountAuth(faucetId);

    let mintTransactionResult = await createNewMintTransaction(
      senderAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    await fetchCacheAccountAuth(senderAccountId);

    let consumeTransactionResult = await createNewConsumeTransaction(
      senderAccountId,
      mintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    let sendTransactionResult = await createNewSendTransaction(
      senderAccountId,
      targetAccountId,
      faucetId,
      "Private",
      "500",
      "0"
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    let consumeSendTransactionResult = await createNewConsumeTransaction(
      senderAccountId,
      sendTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    console.log("testNewSendTransactionWithRecallHeight finished");
  });
  it("test new swap transaction", async () => {
    console.log("testNewSwapTransaction started");
    let walletAAccountId = await createNewWallet("OffChain", true);
    let walletBAccountId = await createNewWallet("OffChain", true);
    let offeredAssetFaucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    let requestedAssetFaucetId = await createNewFaucet(
      "OffChain",
      false,
      "GAR",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(offeredAssetFaucetId);

    let walletAMintTransactionResult = await createNewMintTransaction(
      walletAAccountId,
      offeredAssetFaucetId,
      "Public",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(requestedAssetFaucetId);

    let walletBMintTransactionResult = await createNewMintTransaction(
      walletBAccountId,
      requestedAssetFaucetId,
      "Public",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(walletAAccountId);

    let walletAConsumeTransactionResult = await createNewConsumeTransaction(
      walletAAccountId,
      walletAMintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(walletBAccountId);

    let walletBConsumeTransactionResult = await createNewConsumeTransaction(
      walletBAccountId,
      walletBMintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    let swapTransactionResult = await createNewSwapTransaction(
      walletAAccountId,
      offeredAssetFaucetId,
      "100",
      requestedAssetFaucetId,
      "900",
      "Public"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await addTag(swapTransactionResult.payback_note_tag);
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    let walletBConsumeSwapTransactionResult = await createNewConsumeTransaction(
      walletBAccountId,
      swapTransactionResult.expected_output_note_ids // TODO CHANGE ME
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    let walletAConsumeSwapTransactionResult = await createNewConsumeTransaction(
      walletAAccountId,
      swapTransactionResult.expected_partial_note_ids // TODO CHANGE ME
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    console.log("testNewSwapTransaction finished");
  });
  it("test get transactions", async () => {
    console.log("testGetTransactions started");

    let walletAccount = await createNewWallet("OffChain", true);
    let faucetAccount = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetAccount);

    let mintTransactionResult = await createNewMintTransaction(
      walletAccount,
      faucetAccount,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(walletAccount);

    let consumeTransactionResult = await createNewConsumeTransaction(
      walletAccount,
      mintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    const transactions = await getTransactions();

    console.log("testGetTransactions finished");
    console.log({ transactions });
  });
});
