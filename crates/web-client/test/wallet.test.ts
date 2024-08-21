import { expect } from "chai";
import { page, LOCAL_SERVER } from "./mocha.global.setup.mjs";
import { createWallet } from "./testUtils.js";

describe("wallet tests", function () {
  it("create a new wallet", async function () {
    this.timeout(10000);
    await page.goto(LOCAL_SERVER);
    const result = await createWallet(page);
    console.log({ result });
    expect(result).to.be.not.null;
  });
});
