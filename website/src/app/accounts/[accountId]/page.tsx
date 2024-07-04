'use client'
import { AssetInfo, SerializedAccount } from "@demox-labs/miden-sdk";
import { useLayoutEffect, useRef, useState } from "react";

export interface IJSSerializedAccount {
  id: string
  nonce: string
  vault_root: string 
  storage_root: string
  code_root: string
  account_type: string,
  is_faucet: boolean,
  is_regular_account: boolean,
  is_on_chain: boolean,
  assets: IJSAssetInfo[]
}

interface IJSAssetInfo {
  is_fungible: boolean,
  amount: string,
  faucet_id: string
}

export class JSSerializedAccount implements IJSSerializedAccount {
  id: string
  nonce: string
  vault_root: string 
  storage_root: string
  code_root: string
  account_type: string
  is_faucet: boolean
  is_regular_account: boolean
  is_on_chain: boolean
  assets: IJSAssetInfo[]

  constructor(account: SerializedAccount) {
    this.id = account.id
    this.nonce = account.nonce
    this.vault_root = account.vault_root
    this.storage_root = account.storage_root
    this.code_root = account.code_root
    this.account_type = account.account_type
    this.is_faucet = account.is_faucet
    this.is_regular_account = account.is_regular_account
    this.is_on_chain = account.is_on_chain
    this.assets = account.assets.map((asset: AssetInfo) => {
      return {
        is_fungible: asset.is_fungible,
        amount: asset.amount,
        faucet_id: asset.faucet_id
      } as IJSAssetInfo
    })
  }

}

const AccountDetailsPage = ({ params }: { params: { accountId: string } }) => {
  const workerRef = useRef<Worker>()
  const [account, setAccount] = useState<JSSerializedAccount | null>(null);

  const createWorkerAndGetAccount = async () => {
    return new Promise((resolve, reject) => {
      workerRef.current = new Worker(new URL('../../../workers/accounts.ts', import.meta.url), { type : "module" });
  
      workerRef.current.onmessage = function(event) {
        switch (event.data.type) {
          case "ready":
            console.log('Worker is ready. Sending message...');
            workerRef.current?.postMessage({ type: "getAccount", params: { accountId: params.accountId } });
            break;
          case "getAccount":
            console.log('get account worker finished', event.data.account)
            setAccount(event.data.account as JSSerializedAccount);
            break;
          default:
            console.log('invalid message:', event.data);
            break;
        }
      };
  
      workerRef.current.onerror = function(error) {
        reject(error);
      };
    });
  }

  useLayoutEffect(() => {
    createWorkerAndGetAccount()

    return () => {
      workerRef.current?.terminate();
    }
  }, [])

  if (!account) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center">
      <h1 className="text-2xl font-bold mb-8">Account Details for account {params.accountId}</h1>
      <div>
        <p>Nonce: {account.nonce}</p>
        <p>Vault root: {account.vault_root}</p>
        <p>Storage root: {account.storage_root}</p>
        <p>Code root: {account.code_root}</p>
        <p>Account Type: {account.account_type}</p>
        <p>Is Faucet?: {account.is_faucet.toString()}</p>
        <p>Is regaular account?: {account.is_regular_account.toString()}</p>
        <p>Is on chain?: {account.is_on_chain.toString()}</p>
      </div>

      <h1 className="text-2xl font-bold my-8">Assets:</h1>
      <div>
      {account.assets.map((asset, idx) =>
        <div key={asset.faucet_id} className="mb-6">
          <p>Asset {idx}</p>
          <p>Asset faucet Id: {asset.faucet_id}</p>
          <p>Asset amount: {asset.amount}</p>
          <p>Asset is fungible: {asset.is_fungible.toString()}</p>
        </div>)
      }
      </div>
    </div>
  );
};

export default AccountDetailsPage;