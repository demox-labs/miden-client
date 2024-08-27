// Due to the amount of context swapping we do in these tests, we need to disable typescript checking.
// Typescript is being kept to improve development experience especially with the web client type.
import { expect } from "chai";
import {
  createNewWallet,
  getAccount,
  getAccounts,
} from "./webClientTestUtils.js";

describe("account tests", () => {
  it("get accounts", async () => {
    const accountId = await createNewWallet("OffChain", true);
    const accounts = await getAccounts();
    expect(accounts.find((acc) => acc.id === accountId)).to.be.not.null;
  });

  it("get account", async () => {
    const accountId = await createNewWallet("OffChain", true);
    const account = await getAccount(accountId);
    expect(account).to.be.equal(accountId);
  });
});
