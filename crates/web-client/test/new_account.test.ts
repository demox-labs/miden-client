import { expect } from "chai";
import { testingPage } from "./mocha.global.setup.mjs";
import { isValidAddress } from "./webClientTestUtils";

enum StorageMode {
  PRIVATE = "private",
  PUBLIC = "public",
}

interface NewAccountTestResult {
  id: string;
  nonce: string;
  vault_commitment: string;
  storage_commitment: string;
  code_commitment: string;
  is_faucet: boolean;
  is_regular_account: boolean;
  is_updatable: boolean;
  is_public: boolean;
  is_new: boolean;
}

// new_wallet tests
// =======================================================================================================

export const createNewWallet = async (
  storageMode: StorageMode,
  mutable: boolean,
  clientSeed?: Uint8Array,
  isolatedClient?: boolean
): Promise<NewAccountTestResult> => {
  // Serialize initSeed for Puppeteer
  const serializedClientSeed = clientSeed ? Array.from(clientSeed) : null;

  return await testingPage.evaluate(
    async (_storageMode, _mutable, _serializedClientSeed, _isolatedClient) => {
      if (_isolatedClient) {
        // Reconstruct Uint8Array inside the browser context
        const _clientSeed = _serializedClientSeed
          ? new Uint8Array(_serializedClientSeed)
          : undefined;

        await window.helpers.refreshClient(_clientSeed);
      }

      let client = window.client;
      const accountStorageMode = window.AccountStorageMode.from_str(_storageMode);
      console.log("TEST: accountStorageMode object", JSON.stringify(accountStorageMode));

      const newWallet = await client.new_wallet(accountStorageMode, _mutable);
      console.log("TEST: about to call new_wallet");
      console.log("TEST: accountStorageMode", JSON.stringify(_storageMode));
      console.log("TEST: _mutable", JSON.stringify(_mutable));
      // const newWallet = await client.new_wallet(_storageMode, _mutable);
      console.log("TEST: new_wallet finished");
      // const walletArray = new Uint8Array(newWalletBuffer); // Wrap buffer into Uint8Array
      // console.log("Serialized wallet:", walletArray);
      // const newWallet = window.Account.deserialize(walletArray); // Deserialize into an Account object
      console.log("Deserialized wallet:", JSON.stringify(newWallet, null, 2));
      console.log("Deserialized wallet ID:", newWallet.id().to_string());
      console.log("Deserialized wallet nonce:", newWallet.nonce().to_string());
      console.log("Deserialized wallet vault commitment:", newWallet.vault().commitment().to_hex());
      console.log("Deserialized wallet storage commitment:", newWallet.storage().commitment().to_hex());
      console.log("Deserialized wallet code commitment:", newWallet.code().commitment().to_hex());
      console.log("Deserialized wallet is faucet:", newWallet.is_faucet());
      console.log("Deserialized wallet is regular account:", newWallet.is_regular_account());
      console.log("Deserialized wallet is updatable:", newWallet.is_updatable());
      console.log("Deserialized wallet is public:", newWallet.is_public());
      console.log("Deserialized wallet is new:", newWallet.is_new());

      return {
        id: newWallet.id().to_string(),
        nonce: newWallet.nonce().to_string(),
        vault_commitment: newWallet.vault().commitment().to_hex(),
        storage_commitment: newWallet.storage().commitment().to_hex(),
        code_commitment: newWallet.code().commitment().to_hex(),
        is_faucet: newWallet.is_faucet(),
        is_regular_account: newWallet.is_regular_account(),
        is_updatable: newWallet.is_updatable(),
        is_public: newWallet.is_public(),
        is_new: newWallet.is_new(),
      };
    },
    storageMode,
    mutable,
    serializedClientSeed,
    isolatedClient
  );
};

describe.only("new_wallet tests", () => {
  const testCases = [
    {
      description: "creates a new private, immutable wallet",
      storageMode: StorageMode.PRIVATE,
      mutable: false,
      expected: {
        is_public: false,
        is_updatable: false,
      },
    },
    {
      description: "creates a new public, immutable wallet",
      storageMode: StorageMode.PUBLIC,
      mutable: false,
      expected: {
        is_public: true,
        is_updatable: false,
      },
    },
    {
      description: "creates a new private, mutable wallet",
      storageMode: StorageMode.PRIVATE,
      mutable: true,
      expected: {
        is_public: false,
        is_updatable: true,
      },
    },
    {
      description: "creates a new public, mutable wallet",
      storageMode: StorageMode.PUBLIC,
      mutable: true,
      expected: {
        is_public: true,
        is_updatable: true,
      },
    },
  ];

  testCases.forEach(({ description, storageMode, mutable, expected }) => {
    it(description, async () => {
      const result = await createNewWallet(storageMode, mutable);

      isValidAddress(result.id);
      expect(result.nonce).to.equal("0");
      isValidAddress(result.vault_commitment);
      isValidAddress(result.storage_commitment);
      isValidAddress(result.code_commitment);
      expect(result.is_faucet).to.equal(false);
      expect(result.is_regular_account).to.equal(true);
      expect(result.is_updatable).to.equal(expected.is_updatable);
      expect(result.is_public).to.equal(expected.is_public);
      expect(result.is_new).to.equal(true);
    });
  });

  it("Constructs the same account when given the same init seed", async () => {
    const clientSeed = new Uint8Array(32);
    crypto.getRandomValues(clientSeed);

    // Isolate the client instance both times to ensure the outcome is deterministic
    await createNewWallet(StorageMode.PUBLIC, false, clientSeed, true);

    // This should fail, as the wallet is already tracked within the same browser context
    await expect(
      createNewWallet(StorageMode.PUBLIC, false, clientSeed, true)
    ).to.be.rejectedWith(/Failed to insert new wallet: AccountAlreadyTracked/);
  });
});

// new_faucet tests
// =======================================================================================================

export const createNewFaucet = async (
  storageMode: StorageMode,
  nonFungible: boolean,
  tokenSymbol: string,
  decimals: number,
  maxSupply: bigint
): Promise<NewAccountTestResult> => {
  return await testingPage.evaluate(
    async (_storageMode, _nonFungible, _tokenSymbol, _decimals, _maxSupply) => {
      const client = window.client;
      const accountStorageMode = window.AccountStorageMode.from_str(_storageMode);
      const newFaucet = await client.new_faucet(
        accountStorageMode,
        _nonFungible,
        _tokenSymbol,
        _decimals,
        _maxSupply
      );
      return {
        id: newFaucet.id().to_string(),
        nonce: newFaucet.nonce().to_string(),
        vault_commitment: newFaucet.vault().commitment().to_hex(),
        storage_commitment: newFaucet.storage().commitment().to_hex(),
        code_commitment: newFaucet.code().commitment().to_hex(),
        is_faucet: newFaucet.is_faucet(),
        is_regular_account: newFaucet.is_regular_account(),
        is_updatable: newFaucet.is_updatable(),
        is_public: newFaucet.is_public(),
        is_new: newFaucet.is_new(),
      };
    },
    storageMode,
    nonFungible,
    tokenSymbol,
    decimals,
    maxSupply
  );
};

describe("new_faucet tests", () => {
  const testCases = [
    {
      description: "creates a new private, fungible faucet",
      storageMode: StorageMode.PRIVATE,
      non_fungible: false,
      token_symbol: "DAG",
      decimals: 8,
      max_supply: BigInt(10000000),
      expected: {
        is_public: false,
        is_updatable: false,
        is_regular_account: false,
        is_faucet: true,
      },
    },
    {
      description: "creates a new public, fungible faucet",
      storageMode: StorageMode.PUBLIC,
      non_fungible: false,
      token_symbol: "DAG",
      decimals: 8,
      max_supply: BigInt(10000000),
      expected: {
        is_public: true,
        is_updatable: false,
        is_regular_account: false,
        is_faucet: true,
      },
    },
  ];

  testCases.forEach(
    ({
      description,
      storageMode,
      non_fungible,
      token_symbol,
      decimals,
      max_supply,
      expected,
    }) => {
      it(description, async () => {
        const result = await createNewFaucet(
          storageMode,
          non_fungible,
          token_symbol,
          decimals,
          max_supply
        );

        isValidAddress(result.id);
        expect(result.nonce).to.equal("0");
        isValidAddress(result.vault_commitment);
        isValidAddress(result.storage_commitment);
        isValidAddress(result.code_commitment);
        expect(result.is_faucet).to.equal(true);
        expect(result.is_regular_account).to.equal(false);
        expect(result.is_updatable).to.equal(false);
        expect(result.is_public).to.equal(expected.is_public);
        expect(result.is_new).to.equal(true);
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
