import init, { WebClient } from 'wasm'

const webClient = new WebClient();
await webClient.create_client();

export async function testNewRegularAccount() {
  await init();
  const basicMutableTemplate = {
      type: "BasicMutable"
  };
  try {
      let result = await webClient.new_account(basicMutableTemplate);
      return result;
  } catch (error) {
      console.error('Failed to call create account:', error);
  }
}