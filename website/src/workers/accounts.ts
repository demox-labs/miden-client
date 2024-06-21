import { WebClient } from "@demox-labs/miden-sdk";

console.log('Worker is setting up...');
const webClient = new WebClient();
await webClient.create_client();
postMessage({ type: "ready" });

addEventListener('message', async (event) => {
  console.log('worker received message', event.data)
  const params = event.data.params
  switch (event.data.type) {
    case "createWallet":
      console.log('creating wallet', params)
      const accountId = await webClient.new_wallet(params.storageType, params.mutable);
      console.log('account created', accountId);
      postMessage({ type: "createWallet", accountId });
      break;

    case "createFaucet":
      console.log('creating faucet', params)
      const faucetId = await webClient.new_faucet(
        params.storageType, 
        params.nonFungible, 
        params.tokenSymbol, 
        params.decimals, 
        params.maxSupply
      );
      console.log('faucet created', faucetId);
      postMessage({ type: "createFaucet", faucetId });
      break;

    case "fetchAccounts":
      const accounts = await webClient.get_accounts();
      console.log('accounts fetched', accounts);
      postMessage({ type: "fetchAccounts", accounts: accounts });
      break;

    case "fetchInputNotes":
      console.log('fetching input notes', params)
      const inputNotes = await webClient.get_input_notes(params.noteFilter);
      console.log('input notes fetched', inputNotes);
      postMessage({ type: "fetchInputNotes", inputNotes: inputNotes });
      break;

    case "fetchOutputNotes":
      console.log('fetching output notes', params)
      const outputNotes = await webClient.get_output_notes(params.noteFilter);
      console.log('output notes fetched', outputNotes);
      postMessage({ type: "fetchOutputNotes", outputNotes: outputNotes });
      break;

    case "fetchTransactions":
      console.log('fetching transactions')
      const transactions = await webClient.get_transactions();
      console.log('transactions fetched', transactions);
      postMessage({ type: "fetchTransactions", transactions: transactions });
      break;

    case "importNote":
      console.log('importing note', params)
      break;
    
    case "exportNote":
      console.log('exporting note', params)
      const noteAsBytes = await webClient.export_note(params.noteId);
      console.log('note exported', noteAsBytes);
      postMessage({ type: "exportNote", noteAsBytes: noteAsBytes });
      break;

    case "importAccount":
      console.log('importing account', params)
      const result = await webClient.import_account(params.accountAsBytes);
      console.log('account imported', result);
      postMessage({ type: "importAccount", result });
      break;

    default:
      console.log('invalid message:', event.data);
      postMessage({});
      break;
  }
})