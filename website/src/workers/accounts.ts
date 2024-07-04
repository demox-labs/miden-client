import { JSSerializedAccount } from "@/app/accounts/[accountId]/page";
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

    case "getAccount":
      console.log('getting account', params)
      const account = await webClient.get_account(params.accountId);
      console.log('account fetched', account);
      postMessage({ type: "getAccount", account: new JSSerializedAccount(account) });
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

    case "mintTransaction":
      console.log('doing a mint transaction', params)
      await webClient.sync_state();
      await webClient.fetch_and_cache_account_auth_by_pub_key(params.faucetId);
      const mintResult = await webClient.new_mint_transaction(params.walletId, params.faucetId, params.noteType, params.amount);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await webClient.sync_state();
      postMessage({ 
        type: "mintTransaction", 
        mintResult: { transactionId: mintResult.transaction_id, createdNoteIds: mintResult.created_note_ids }
      });
      break;

    case "sendTransaction":
      console.log('doing a send transaction', params)
      await webClient.sync_state();
      await webClient.fetch_and_cache_account_auth_by_pub_key(params.senderAccountId);
      const sendResult = await webClient.new_send_transaction(
        params.senderAccountId,
        params.targetAccountId,
        params.faucetId,
        params.noteType,
        params.amount,
        params.recallHeight
      );
      await new Promise(resolve => setTimeout(resolve, 2000));
      await webClient.sync_state();
      postMessage({ type: "sendTransaction", sendResult: { transactionId: sendResult.transaction_id, createdNoteIds: sendResult.created_note_ids } });
      break;
  
    case "swapTransaction":
      console.log('doing a swap transaction', params)
      await webClient.sync_state();
      await webClient.fetch_and_cache_account_auth_by_pub_key(params.walletA);
      const swapResult = await webClient.new_swap_transaction(
        params.walletA,
        params.faucetA,
        params.amountOfA,
        params.faucetB,
        params.amountOfB,
        params.noteType
      );
      await new Promise(resolve => setTimeout(resolve, 2000));
      await webClient.sync_state();

      await webClient.add_tag(swapResult.payback_note_tag)
      await new Promise(resolve => setTimeout(resolve, 10000));
      await webClient.sync_state();

      postMessage({ type: "swapTransaction", swapResult: { 
        transactionId: swapResult.transaction_id, 
        expectedOutputNoteIds: swapResult.expected_output_note_ids,
        expectedPartialNoteIds: swapResult.expected_partial_note_ids,
        paybackNoteTag: swapResult.payback_note_tag 
      } });
      break;

    case "consumeTransaction":
      console.log('doing a consume transaction', params)
      await new Promise(resolve => setTimeout(resolve, 2000));
      await webClient.sync_state();
      await webClient.fetch_and_cache_account_auth_by_pub_key(params.targetAccountId);
      const consumeResult = await webClient.new_consume_transaction(params.targetAccountId, params.noteIds);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await webClient.sync_state();
      postMessage({ 
        type: "consumeTransaction", 
        consumeResult: { transactionId: consumeResult.transaction_id, createdNoteIds: consumeResult.created_note_ids },
        consumeType: params.consumeType
      });
      break;

    default:
      console.log('invalid message:', event.data);
      postMessage({ type: 'invalid' });
      break;
  }
})