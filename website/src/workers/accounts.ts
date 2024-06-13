import { WebClient } from "@demox-labs/miden-sdk";

addEventListener('message', async (event) => {
  console.log('worker received message', event.data)
  const webClient = new WebClient();
  await webClient.create_client();
  console.log()
  switch (event.data) {
    case "createAccount":
      const accountId = await webClient.new_wallet("OffChain", true);
      console.log('account created', accountId);
      postMessage({ type: "createAccount", accountId });
      break;
    // case "fetchAccounts":
    //   const accounts = await webClient.get_accounts();
    //   console.log('accounts fetched', accounts);
    //   postMessage({ type: "fetchAccounts", accounts: accounts });
    //   break;
    default:
      console.log('invalid message:', event.data);
      postMessage('');
      break;
  }
  // await init();
  // console.log('webClient', webClient)
  // await webClient.create_client();
  // const basicMutableTemplate = {
  //   type: "BasicMutable",
  //   storage_mode: "Local"
  // };
  // await webClient.new_wallet("OffChain", true);
  // postMessage('done')
})