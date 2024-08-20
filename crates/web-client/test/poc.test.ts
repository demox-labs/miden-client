import { ChildProcess, exec } from "child_process";
import puppeteer, { Browser, Page } from "puppeteer";
import { expect } from "chai";
import * as wasmModuleType from "../dist/index.js";

describe("WASM Integration Test", function () {
  let browser: Browser;
  let page: Page;
  let serverProcess: ChildProcess;

  before(async function () {
    serverProcess = exec("http-server ./dist -p 8080");

    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });

  after(async function () {
    await browser.close();
    serverProcess.kill();
  });

  it("create a new wallet", async function () {
    this.timeout(10000);
    await page.goto("http://localhost:8080");
    const result = await page.evaluate(async () => {
      // @ts-ignore: This is within the context of the web page not the editor
      const wasmModule = await import("./index.js");

      // let rpc_url = "http://18.203.155.106:57291";
      let rpc_url = "http://localhost:57291";
      const client: wasmModuleType.WebClient = new wasmModule.WebClient();
      await client.create_client(rpc_url);

      // Call a function from your WASM module

      const newWallet = client.new_wallet("OffChain", true);

      return newWallet;
    });
    console.log({ result });
    expect(result).to.be.not.null;
  });
});

const createClient = async () => {};
