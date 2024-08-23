import { Page } from "puppeteer";

declare module "./mocha.global.setup.mjs" {
  export const testingPage: Page;
  export const LOCAL_SERVER: string; // Replace 'string' with the appropriate type if needed
}
