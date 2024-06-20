import { WebClient } from "@demox-labs/miden-sdk";

console.log('Worker is setting up...');
const webClient = new WebClient();
await webClient.create_client();
postMessage({ type: "ready" });

addEventListener('message', async (event) => {
  console.log('worker received message', event.data)
  const params = event.data.params
  switch (event.data.type) {
    case "createAccount":
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

    default:
      console.log('invalid message:', event.data);
      postMessage({});
      break;
  }
})