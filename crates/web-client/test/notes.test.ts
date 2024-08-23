import {
  createNewConsumeTransaction,
  createNewFaucet,
  createNewMintTransaction,
  createNewSendTransaction,
  createNewWallet,
  exportNote,
  fetchCacheAccountAuth,
  getInputNote,
  getInputNotes,
  getOutputNote,
  getOutputNotes,
  syncState,
} from "./webClientTestUtils";

describe("notes tests", () => {
  it("get input notes", async () => {
    console.log("testGetInputNotes started");

    let targetAccountId = await createNewWallet("OffChain", true);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetId);

    let mintTransactionResult = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);

    let consumeTransactionResult = await createNewConsumeTransaction(
      targetAccountId,
      mintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await getInputNotes();

    console.log("testGetInputNotes finished");
  });
  it("get input note", async () => {
    console.log("testGetInputNote started");

    let targetAccountId = await createNewWallet("OffChain", true);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetId);

    let mintTransactionResult = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);

    let consumeTransactionResult = await createNewConsumeTransaction(
      targetAccountId,
      mintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await getInputNote(mintTransactionResult.created_note_ids[0]);

    console.log("testGetInputNote finished");
  });

  it("get note", async () => {
    console.log("testGetNote started");

    let targetAccountId = await createNewWallet("OffChain", false);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 10000));

    const mintResult = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 10000));
    await syncState();

    await getInputNote(mintResult.created_note_ids[0]);

    console.log("testGetNote finished");
  });
  it("get output notes", async () => {
    console.log("testGetOutputNotes started");

    let targetAccountId = await createNewWallet("OffChain", true);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetId);

    let mintTransactionResult = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);

    let consumeTransactionResult = await createNewConsumeTransaction(
      targetAccountId,
      mintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    const result = await getOutputNotes();

    console.log("testGetOutputNotes finished");
    console.log({ result });
  });
  it("get output note", async () => {
    console.log("testGetOutputNote started");

    let targetAccountId = await createNewWallet("OffChain", true);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetId);

    let mintTransactionResult = await createNewMintTransaction(
      targetAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await fetchCacheAccountAuth(targetAccountId);

    let consumeTransactionResult = await createNewConsumeTransaction(
      targetAccountId,
      mintTransactionResult.created_note_ids
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    await getOutputNote(mintTransactionResult.created_note_ids[0]);

    console.log("testGetOutputNote finished");
  });
  it("export note", async () => {
    console.log("testExportNote started");

    let senderAccountId = await createNewWallet("OffChain", true);
    let faucetId = await createNewFaucet(
      "OffChain",
      false,
      "DEN",
      "10",
      "1000000"
    );
    await syncState();
    await new Promise((r) => setTimeout(r, 20000));

    await fetchCacheAccountAuth(faucetId);

    let mintTransactionResult = await createNewMintTransaction(
      senderAccountId,
      faucetId,
      "Private",
      "1000"
    );
    await new Promise((r) => setTimeout(r, 20000));
    await syncState();

    let result = await exportNote(mintTransactionResult.created_note_ids[0]);

    // TODO: Fix this for mocha

    const blob = new Blob([result], {
      type: "application/octet-stream",
    });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = "exportNoteTest.mno"; // Specify the file name

    // Append the anchor to the document
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(url);

    console.log("testExportNote finished");
  });
  it("import input note", async () => {
    console.log("testImportInputNote started");

    let walletAccount = await createNewWallet("OffChain", true);

    // TODO: Fix this for mocha
    // function setupNoteFileInputListener(webClient, targetAccountId) {
    //   document
    //     .getElementById("noteFileInput")
    //     .addEventListener("change", async function (event) {
    //       const file = event.target.files[0];
    //       if (file) {
    //         const reader = new FileReader();
    //         reader.onload = async function (e) {
    //           const arrayBuffer = e.target.result;
    //           const byteArray = new Uint8Array(arrayBuffer);
    //           console.log(byteArray); // Now you can work with the bytes

    //           let result = await importInputNote(webClient, byteArray, false);
    //           console.log(result); // Log the result of the import process

    //           await webClient.fetch_and_cache_account_auth_by_pub_key(
    //             targetAccountId
    //           );

    //           let consumeTransactionResult = await createNewConsumeTransaction(
    //             webClient,
    //             "0x98f63aaa54c58c14",
    //             // targetAccountId,
    //             [result]
    //           );
    //           await new Promise((r) => setTimeout(r, 20000));
    //           await syncState(webClient);

    //           console.log("testImportInputNote finished");
    //         };
    //         reader.readAsArrayBuffer(file);
    //       }
    //     });
    // }
  });
});
