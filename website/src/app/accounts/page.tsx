'use client'

import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement, useLayoutEffect, useRef } from 'react';

import { useState } from 'react'
import Loader from '@/components/ui/loader';

export interface Account {
  id: number
  nonce: string
  vault_root: string 
  storage_root: string
  code_root: string
  account_type: string,
  is_faucet: boolean,
  is_regular_account: boolean,
  is_on_chain: boolean,  
}

function AccountsTable({ accounts, isLoading }: { accounts: Account[], isLoading: boolean }) {

  return (
    <div className="flex flex-col items-center">
      <div>
        <p className="text-2xl font-bold">Wallets</p>
      </div>
      <table className="w-full table-auto border-collapse text-left">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b-2 border-gray-300">Id</th>
            <th className="px-4 py-2 border-b-2 border-gray-300">Nonce</th>
          </tr>
        </thead>
        <tbody>
          {isLoading 
            ? <tr><td colSpan={2} className="px-4 py-4 border-b border-gray-200 text-center"><div className="flex justify-center items-center"><Loader /></div></td></tr>
            : accounts.map((account) => (
              <tr key={account.id}>
                <td className="px-4 py-2 border-b border-gray-200">{account.id}</td>
                <td className="px-4 py-2 border-b border-gray-200">{account.nonce}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export default function Accounts() {
  const workerRef = useRef<Worker>()
  const [accountStorageType, setAccountStorageType] = useState('OffChain')
  const [accountMutable, setAccountMutable] = useState(true)
  const [createAccountLoading, setCreateAccountLoading] = useState(false)
  const [fetchAccountsLoading, setFetchAccountsLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  
  function createWorkerAndSendMessage(message: object) {
    return new Promise((resolve, reject) => {
      workerRef.current = new Worker(new URL('../../workers/accounts.ts', import.meta.url), { type : "module" });
  
      workerRef.current.onmessage = function(event) {
        switch (event.data.type) {
          case "ready":
            console.log('Worker is ready. Sending message...');
            workerRef.current?.postMessage(message);
            break;
          case "createAccount":
            console.log('create account worker finished')
            workerRef.current?.postMessage({ type: "fetchAccounts" })
            setCreateAccountLoading(false)
            break;
          case "fetchAccounts":
            console.log('fetch accounts worker finished', event.data.accounts)
            setFetchAccountsLoading(false)
            setAccounts(event.data.accounts)
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
    createWorkerAndSendMessage({ type: "fetchAccounts" })

    return () => {
      workerRef.current?.terminate();
    }
  }, [])

  const fetchAccounts = () => {
    setFetchAccountsLoading(true)

    workerRef.current?.postMessage("fetchAccounts")
  }

  async function createAccount() {
    try {
      setCreateAccountLoading(true)
      workerRef.current?.postMessage({ type: "createAccount", params: { storageType: accountStorageType, mutable: accountMutable } })
    } catch (error) {
      console.error('Failed to call create account:', error);
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="flex flex-row items-center pb-4">
        <div className="flex flex-col">
          <div className="flex items-center pb-2">
            <label className="text-sm mr-2 w-28">Storage Type:</label>
            <select value={accountStorageType} onChange={(event) => setAccountStorageType(event.target.value)} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 mr-4 cursor-pointer">
              <option value="OffChain">OffChain</option>
              <option value="OnChain">OnChain</option>
            </select>
          </div>

          <div className="flex items-center pb-2">
            <label className="text-sm mr-2 w-28">Account Mutable:</label>
            <select value={String(accountMutable)} onChange={(event) => setAccountMutable(event.target.value == 'true')} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 mr-4 cursor-pointer">
              <option value={'true'}>True</option>
              <option value={'false'}>False</option>
            </select>
          </div>
        </div>
        
        <button disabled={createAccountLoading} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => createAccount()}>{ createAccountLoading ? <Loader variant='scaleUp' />  : 'Create account'}</button>
      </div>
      <AccountsTable accounts={accounts.filter((account) => account.is_regular_account)} isLoading={fetchAccountsLoading} />
    </div>
  )
}

Accounts.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardLayout contentClassName="flex items-center justify-center">
      {page}
    </DashboardLayout>
  )
}