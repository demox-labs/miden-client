import { expect } from "chai";
import {
  createNewFaucet,
  createNewWallet,
  isValidAddress,
  StorageMode,
} from "./webClientTestUtils";

// new_wallet tests
// =======================================================================================================

describe.only("new_wallet tests", () => {
  const testCases = [
    {
      description: "creates a new private, immutable wallet",
      storageMode: StorageMode.PRIVATE,
      mutable: false,
      expected: {
        isPublic: false,
        isUpdatable: false,
      },
    },
    {
      description: "creates a new public, immutable wallet",
      storageMode: StorageMode.PUBLIC,
      mutable: false,
      expected: {
        isPublic: true,
        isUpdatable: false,
      },
    },
    {
      description: "creates a new private, mutable wallet",
      storageMode: StorageMode.PRIVATE,
      mutable: true,
      expected: {
        isPublic: false,
        isUpdatable: true,
      },
    },
    {
      description: "creates a new public, mutable wallet",
      storageMode: StorageMode.PUBLIC,
      mutable: true,
      expected: {
        isPublic: true,
        isUpdatable: true,
      },
    },
  ];

  const ITERATIONS = 10;
  const timingResults: { [key: string]: number[] } = {};

  [testCases[0]].forEach(({ description, storageMode, mutable, expected }) => {
    it(`${description} (${ITERATIONS} iterations)`, async () => {
      timingResults[description] = [];
      
      for (let i = 0; i < ITERATIONS; i++) {
        const startTime = performance.now();
        const result = await createNewWallet({ storageMode, mutable });
        const endTime = performance.now();
        const duration = endTime - startTime;
        timingResults[description].push(duration);

        isValidAddress(result.id);
        expect(result.nonce).to.equal("0");
        isValidAddress(result.vaultCommitment);
        isValidAddress(result.storageCommitment);
        isValidAddress(result.codeCommitment);
        expect(result.isFaucet).to.equal(false);
        expect(result.isRegularAccount).to.equal(true);
        expect(result.isUpdatable).to.equal(expected.isUpdatable);
        expect(result.isPublic).to.equal(expected.isPublic);
        expect(result.isNew).to.equal(true);
      }

      // Calculate and log statistics
      const times = timingResults[description];
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      console.log(`\nTiming results for ${description}:`);
      console.log(`Average: ${avg.toFixed(2)}ms`);
      console.log(`Min: ${min.toFixed(2)}ms`);
      console.log(`Max: ${max.toFixed(2)}ms`);
      console.log(`All timings: ${times.map(t => t.toFixed(2)).join(', ')}`);
    });
  });

  it("Constructs the same account when given the same init seed", async () => {
    const clientSeed = new Uint8Array(32);
    crypto.getRandomValues(clientSeed);

    // Isolate the client instance both times to ensure the outcome is deterministic
    await createNewWallet({
      storageMode: StorageMode.PUBLIC,
      mutable: false,
      clientSeed,
      isolatedClient: true,
    });

    // This should fail, as the wallet is already tracked within the same browser context
    await expect(
      createNewWallet({
        storageMode: StorageMode.PUBLIC,
        mutable: false,
        clientSeed,
        isolatedClient: true,
      })
    ).to.be.rejectedWith(/failed to insert new wallet/);
  });
});

// new_faucet tests
// =======================================================================================================

describe("new_faucet tests", () => {
  const testCases = [
    {
      description: "creates a new private, fungible faucet",
      storageMode: StorageMode.PRIVATE,
      nonFungible: false,
      tokenSymbol: "DAG",
      decimals: 8,
      maxSupply: BigInt(10000000),
      expected: {
        isPublic: false,
        isUpdatable: false,
        isRegularAccount: false,
        isFaucet: true,
      },
    },
    {
      description: "creates a new public, fungible faucet",
      storageMode: StorageMode.PUBLIC,
      nonFungible: false,
      tokenSymbol: "DAG",
      decimals: 8,
      maxSupply: BigInt(10000000),
      expected: {
        isPublic: true,
        isUpdatable: false,
        isRegularAccount: false,
        isFaucet: true,
      },
    },
  ];

  testCases.forEach(
    ({
      description,
      storageMode,
      nonFungible,
      tokenSymbol,
      decimals,
      maxSupply,
      expected,
    }) => {
      it(description, async () => {
        const result = await createNewFaucet(
          storageMode,
          nonFungible,
          tokenSymbol,
          decimals,
          maxSupply
        );

        isValidAddress(result.id);
        expect(result.nonce).to.equal("0");
        isValidAddress(result.vaultCommitment);
        isValidAddress(result.storageCommitment);
        isValidAddress(result.codeCommitment);
        expect(result.isFaucet).to.equal(true);
        expect(result.isRegularAccount).to.equal(false);
        expect(result.isUpdatable).to.equal(false);
        expect(result.isPublic).to.equal(expected.isPublic);
        expect(result.isNew).to.equal(true);
      });
    }
  );

  it("throws an error when attempting to create a non-fungible faucet", async () => {
    await expect(
      createNewFaucet(StorageMode.PUBLIC, true, "DAG", 8, BigInt(10000000))
    ).to.be.rejectedWith("Non-fungible faucets are not supported yet");
  });

  it("throws an error when attempting to create a faucet with an invalid token symbol", async () => {
    await expect(
      createNewFaucet(
        StorageMode.PUBLIC,
        false,
        "INVALID_TOKEN",
        8,
        BigInt(10000000)
      )
    ).to.be.rejectedWith(
      `token symbol of length 13 is not between 1 and 6 characters long`
    );
  });
});
