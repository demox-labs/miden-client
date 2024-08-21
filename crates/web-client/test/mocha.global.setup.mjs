import puppeteer from "puppeteer";
import { exec } from "child_process";

import { register } from "ts-node";

register({
  project: "./tsconfig.json",
});

let serverProcess;
let browser;
let page;

const LOCAL_SERVER = "http://localhost:8080";

before(async function () {
  serverProcess = exec("http-server ./dist -p 8080");
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(LOCAL_SERVER);

  // Uncomment below to enable console logging
  // page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  // Function to create the client in the test context and attach to window object
  await page.exposeFunction("create_client", async () => {
    await page.evaluate(async () => {
      const { WebClient } = await import("./index.js");
      // let rpc_url = "http://18.203.155.106:57291";
      let rpc_url = "http://localhost:57291";
      const client = new WebClient();
      await client.create_client(rpc_url);

      window.client = client;
    });
  });
});

after(async function () {
  await browser.close();
  serverProcess.kill();
});

// Exporting page for use in other test files if needed
export { page, LOCAL_SERVER };
