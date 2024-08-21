/**
 * @typedef {import("../dist/index").WebClient} WebClient
 */

/**
 *
 * @param {*} page
 * @returns {Promise<string>} The new wallet identifier as a string.
 */
export const createWallet = async (page) => {
  return await page.evaluate(async () => {
    await window.create_client();

    /** @type {WebClient} */
    const client = window.client;
    const newWallet = client.new_wallet("OffChain", true);

    return newWallet;
  });
};
