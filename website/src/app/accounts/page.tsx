'use client'

// import { testNewRegularAccount } from '../../helpers/account-helpers';
import { useWasm } from '@/context/wasm-context';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { useState } from 'react'
import Loader from '@/components/ui/loader';
import * as w from 'wasm';
import { useStateCallback } from '@/lib/hooks/use-state-callback';
import { createBasicAccount } from '@/lib/polygon-worker/accounts';

interface Account {
  id: number
  nonce: string
  code_root: string
  storage_root: string
  vault_root: string 
}

function AccountsTable({ wasm, accounts, isLoading }: { wasm: typeof w, accounts: Account[], isLoading: boolean}) {
  return (
    <div className="flex flex-col items-center">
      <div>
        <p className="text-2xl font-bold">Accounts</p>
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
      {/* <button onClick={() => fetchAccounts(wasm)} className="bg-gray-700 text-white py-2 px-4 rounded-md">Fetch accounts</button> */}
    </div>
  )
}

export default function Accounts() {
  const workerRef = useRef<Worker>()
  const [createAccountLoading, setCreateAccountLoading] = useState(false)
  const [fetchAccountsLoading, setFetchAccountsLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const wasm = useWasm();
  useEffect(() => {
    if (wasm) {
      fetchAccounts(wasm);
      workerRef.current = new Worker(new URL('../../workers/accounts.ts', import.meta.url), { type : "module" });
      workerRef.current.onmessage = async (event) => {
        console.log('create account worker finished')
        await fetchAccounts(wasm)
        setCreateAccountLoading(false)
      }
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error.message)
      }
      return () => {
        workerRef.current?.terminate();
      }
    }
  }, [wasm])

  const fetchAccounts = async (wasm: typeof w) => {
    setFetchAccountsLoading(true)

    const webClient = new wasm.WebClient();
    await webClient.create_client();
    const accounts = await webClient.get_accounts();
    console.log('Found accounts: ', accounts);
    setAccounts(accounts as Account[])

    setFetchAccountsLoading(false)
  }

  async function createAccount(wasm: typeof w) {
    try {
      setCreateAccountLoading(true)
      workerRef.current?.postMessage("createAccount")
      await fetchAccounts(wasm)
      // await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.error('Failed to call create account:', error);
    }
  }

  return !wasm ? <div className="flex min-h-screen flex-col items-center">Loading...</div> : (
    <div className="flex min-h-screen flex-col items-center">
      <div className="flex flex-row items-start pb-4">
        {/* { isLoading
          ? <Loader variant='scaleUp' className="bg-gray-700 text-white py-2 px-4 rounded-md" /> 
          : <button className="bg-gray-700 text-white py-2 px-4 rounded-md" onClick={() => testNewRegularAccount()}>Create account</button>
        } */}
        <button disabled={createAccountLoading} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => createAccount(wasm)}>{ createAccountLoading ? <Loader variant='scaleUp' />  : 'Create account'}</button>
      </div>
      <AccountsTable wasm={wasm} accounts={accounts} isLoading={fetchAccountsLoading} />
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