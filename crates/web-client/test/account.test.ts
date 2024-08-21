// @ts-nocheck
// Due to the amount of context swapping we do in these tests, we need to disable typescript checking.
// Typescript is being kept to improve development experience especially with the web client type.
import { createWallet } from "./testUtils.js";

describe("account tests", function () {
  it("create a new wallet", async function () {
    this.timeout(10000);
    await page.goto(LOCAL_SERVER);
    const result = await createWallet(page);
  });
});
