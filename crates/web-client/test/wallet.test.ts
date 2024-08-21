// @ts-nocheck
// Due to the amount of context swapping we do in these tests, we need to disable typescript checking.
// Typescript is being kept to improve development experience especially with the web client type.

import { ChildProcess, exec } from "child_process";
import puppeteer, { Browser, Page } from "puppeteer";
import { expect } from "chai";
import * as wasmModuleType from "../dist/index.js";

describe("WASM Integration Test", function () {
  let browser: Browser;
  let page: Page;
  let serverProcess: ChildProcess;

  let client: wasmModuleType.WebClient;

  before(async function () {
    serverProcess = exec("http-server ./dist -p 8080");
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto("http://localhost:8080");

    // Uncomment below to enable console logging
    // page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    await page.exposeFunction("create_client", async () => {
      await page.evaluate(async () => {
        const { WebClient } = await import("./index.js");
        // let rpc_url = "http://18.203.155.106:57291";
        let rpc_url = "http://localhost:57291";
        const client: wasmModuleType.WebClient = new WebClient();
        await client.create_client(rpc_url);

        window.client = client;
      });
    });
  });

  after(async function () {
    await browser.close();
    serverProcess.kill();
  });

  it("create a new wallet", async function () {
    this.timeout(10000);
    await page.goto("http://localhost:8080");
    const result = await page.evaluate(async () => {
      await window.create_client();
      const client = window.client;
      const newWallet = client.new_wallet("OffChain", true);

      return newWallet;
    });
    expect(result).to.be.not.null;
  });
});
