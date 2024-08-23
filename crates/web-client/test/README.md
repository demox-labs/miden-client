# Testing

The .wasm must be run within the context of a webpage. To this end, we've set up a Mocha
test suite which hosts the .wasm on a local server and then executes WebClient commands
within the context of the web page.

## Running tests

1. In crates/web-client run `yarn test` to run all tests
2. For running an individual test by name run `yarn test -g <test-name>`

## Writing tests

1. The test setup in `mocha.global.setup.mjs` should expose the "create_client" function which can be used inside tests.
   - Any further setup of wasm code should be done in this file and similarly expose a function for testing here
2. Tests should generally be running the following boilerplate:

```
import { page } from "./mocha.global.setup.mjs";
import * as wasmModuleType from "../dist/index.js";

describe("test", function () {
  it("do something", async function () {
    // this.timeout(10000) <-- you may need to increase the default timeout of 2s
    await page.goto(LOCAL_SERVER);
    const result = await page.evaluate(async () => {
      await window.create_client();
      const client: wasmModuleType.WebClient = window.client;
      const clientResult = client.<some_command>(arg1);

      return clientResult;
    });
  });
});
```

The `result` can then be asserted against / modified as expected.

- Note: This was as minimal of a boilerplate that we were able to achieve. The hope was to

## Debugging

1. When inside of a `page.evaluate` , console logs are being sent to the servers console rather than your IDE's. You can uncomment the line as seen below in the `mocha.global.setup.mjs`:

```
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
```

This will forward logs from the server to your IDE logs
