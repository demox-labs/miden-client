import { WebClient } from "@demox-labs/miden-sdk";

console.log('Worker is setting up...');
const webClient = new WebClient();
await webClient.create_client();
postMessage({ type: "ready" });

addEventListener('message', async (event) => {
  console.log('worker received message', event.data)
  switch (event.data.type) {

    case "createAccount":
      const params = event.data.params
      console.log('creating account', params)
      const accountId = await webClient.new_wallet(params.storageType, params.mutable);
      console.log('account created', accountId);
      postMessage({ type: "createAccount", accountId });
      break;

    case "fetchAccounts":
      const accounts = await webClient.get_accounts();
      console.log('accounts fetched', accounts);
      postMessage({ type: "fetchAccounts", accounts: accounts });
      break;

    default:
      console.log('invalid message:', event.data);
      postMessage({});
      break;
  }
})