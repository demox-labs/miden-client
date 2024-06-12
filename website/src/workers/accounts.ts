import init, * as wasm from "wasm";

addEventListener('message', async (event) => {
  console.log('worker received message', event.data)
  await init();
  const webClient = new wasm.WebClient();
  console.log('webClient', webClient)
  await webClient.create_client();
  const basicMutableTemplate = {
    type: "BasicMutable",
    storage_mode: "Local"
  };
  await webClient.new_account(basicMutableTemplate);
  postMessage('done')
})