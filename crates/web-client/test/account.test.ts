import { expect } from "chai";
import { testingPage } from "./mocha.global.setup.mjs";

// GET_ACCOUNT TESTS
// =======================================================================================================

interface GetAccountSuccessResult {
  hashOfCreatedAccount: string;
  hashOfGetAccountResult: string;
  isAccountType: boolean | undefined;
}

export const getAccountOneMatch =
  async (): Promise<GetAccountSuccessResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;
      const newAccount = await client.new_wallet(
        window.AccountStorageMode.private(),
        true
      );
      const result = await client.get_account(newAccount.id());

      return {
        hashOfCreatedAccount: newAccount.hash().to_hex(),
        hashOfGetAccountResult: result.hash().to_hex(),
        isAccountType: result instanceof window.Account,
      };
    });
  };

interface GetAccountFailureResult {
  hashOfGetAccountResult: string | undefined;
}

export const getAccountNoMatch = async (): Promise<GetAccountFailureResult> => {
  return await testingPage.evaluate(async () => {
    const client = window.client;
    const nonExistingAccountId = window.TestUtils.create_mock_account_id();

    const result = await client.get_account(nonExistingAccountId);

    return {
      hashOfGetAccountResult: result ? result.hash().to_hex() : undefined,
    };
  });
};

describe("get_account tests", () => {
  it("retrieves an existing account", async () => {
    const result = await getAccountOneMatch();

    expect(result.hashOfCreatedAccount).to.equal(result.hashOfGetAccountResult);
    expect(result.isAccountType).to.be.true;
  });

  it("returns error attempting to retrieve a non-existing account", async () => {
    const result = await getAccountNoMatch();

    expect(result.hashOfGetAccountResult).to.be.undefined;
  });
});

// GET_ACCOUNTS TESTS
// =======================================================================================================

interface GetAccountsSuccessResult {
  hashesOfCreatedAccounts: string[];
  hashesOfGetAccountsResult: string[];
  resultTypes: boolean[];
}

export const getAccountsManyMatches =
  async (): Promise<GetAccountsSuccessResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;
      const newAccount1 = await client.new_wallet(
        window.AccountStorageMode.private(),
        true
      );
      const newAccount2 = await client.new_wallet(
        window.AccountStorageMode.private(),
        true
      );
      const hashesOfCreatedAccounts = [
        newAccount1.hash().to_hex(),
        newAccount2.hash().to_hex(),
      ];

      const result = await client.get_accounts();

      const hashesOfGetAccountsResult = [];
      const resultTypes = [];

      for (let i = 0; i < result.length; i++) {
        hashesOfGetAccountsResult.push(result[i].hash().to_hex());
        resultTypes.push(result[i] instanceof window.AccountHeader);
      }

      return {
        hashesOfCreatedAccounts: hashesOfCreatedAccounts,
        hashesOfGetAccountsResult: hashesOfGetAccountsResult,
        resultTypes: resultTypes,
      };
    });
  };

export const getAccountsNoMatches =
  async (): Promise<GetAccountsSuccessResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;

      const result = await client.get_accounts();

      const hashesOfGetAccountsResult = [];
      const resultTypes = [];

      for (let i = 0; i < result.length; i++) {
        hashesOfGetAccountsResult.push(result[i].hash().to_hex());
        resultTypes.push(result[i] instanceof window.AccountHeader);
      }

      return {
        hashesOfCreatedAccounts: [],
        hashesOfGetAccountsResult: hashesOfGetAccountsResult,
        resultTypes: resultTypes,
      };
    });
  };

describe("get_accounts tests", () => {
  it("retrieves all existing accounts", async () => {
    const result = await getAccountsManyMatches();

    for (let address of result.hashesOfGetAccountsResult) {
      expect(result.hashesOfCreatedAccounts.includes(address)).to.be.true;
    }
    expect(result.resultTypes).to.deep.equal([true, true]);
  });

  it("returns empty array when no accounts exist", async () => {
    const result = await getAccountsNoMatches();

    expect(result.hashesOfCreatedAccounts.length).to.equal(0);
    expect(result.hashesOfGetAccountsResult.length).to.equal(0);
    expect(result.resultTypes.length).to.equal(0);
  });
});

// GET_ACCOUNT_AUTH TESTS
// =======================================================================================================

interface GetAccountAuthSuccessResult {
  publicKey: any;
  secretKey: any;
  isAuthSecretKeyType: boolean | undefined;
}

export const getAccountAuth =
  async (): Promise<GetAccountAuthSuccessResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;
      const newAccount = await client.new_wallet(
        window.AccountStorageMode.private(),
        true
      );

      const result = await client.get_account_auth(newAccount.id());

      return {
        publicKey: result.get_rpo_falcon_512_public_key_as_word(),
        secretKey: result.get_rpo_falcon_512_secret_key_as_felts(),
        isAuthSecretKeyType: result instanceof window.AuthSecretKey,
      };
    });
  };

interface GetAccountAuthFailureResult {
  publicKey: any;
}

export const getAccountAuthNoMatch =
  async (): Promise<GetAccountAuthFailureResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;
      const nonExistingAccountId = window.TestUtils.create_mock_account_id();

      const result = await client.get_account_auth(nonExistingAccountId);

      return {
        publicKey: result
          ? result.get_rpo_falcon_512_public_key_as_word()
          : undefined,
      };
    });
  };

describe("get_account_auth tests", () => {
  it("retrieves an existing account auth", async () => {
    const result = await getAccountAuth();

    expect(result.publicKey).to.not.be.empty;
    expect(result.secretKey).to.not.be.empty;
    expect(result.isAuthSecretKeyType).to.be.true;
  });

  it("returns error attempting to retrieve a non-existing account auth", async () => {
    const result = await getAccountAuthNoMatch();

    expect(result.publicKey).to.be.undefined;
  });
});

// FETCH_AND_CACHE_ACCOUNT_AUTH_BY_PUB_KEY TESTS
// =======================================================================================================

interface FetchAndCacheAccountAuthByPubKeySuccessResult {
  publicKey: any;
  secretKey: any;
  isAuthSecretKeyType: boolean | undefined;
}

export const fetchAndCacheAccountAuthByPubKey =
  async (): Promise<FetchAndCacheAccountAuthByPubKeySuccessResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;
      const newAccount = await client.new_wallet(
        window.AccountStorageMode.private(),
        true
      );

      const result = await client.fetch_and_cache_account_auth_by_pub_key(
        newAccount.id()
      );

      return {
        publicKey: result.get_rpo_falcon_512_public_key_as_word(),
        secretKey: result.get_rpo_falcon_512_secret_key_as_felts(),
        isAuthSecretKeyType: result instanceof window.AuthSecretKey,
      };
    });
  };

interface FetchAndCacheAccountAuthByPubKeyFailureResult {
  publicKey: any;
}

export const fetchAndCacheAccountAuthByPubKeyNoMatch =
  async (): Promise<FetchAndCacheAccountAuthByPubKeyFailureResult> => {
    return await testingPage.evaluate(async () => {
      const client = window.client;
      const nonExistingAccountId = window.TestUtils.create_mock_account_id();

      const result =
        await client.fetch_and_cache_account_auth_by_pub_key(
          nonExistingAccountId
        );

      return {
        publicKey: result
          ? result.get_rpo_falcon_512_public_key_as_word()
          : undefined,
      };
    });
  };

describe("fetch_and_cache_account_auth_by_pub_key tests", () => {
  it("retrieves an existing account auth and caches it", async () => {
    const result = await fetchAndCacheAccountAuthByPubKey();

    expect(result.publicKey).to.not.be.empty;
    expect(result.secretKey).to.not.be.empty;
    expect(result.isAuthSecretKeyType).to.be.true;
  });

  it("returns error attempting to retrieve/cache a non-existing account auth", async () => {
    const result = await fetchAndCacheAccountAuthByPubKeyNoMatch();

    expect(result.publicKey).to.be.undefined;
  });
});
