'use client'

// import { testNewRegularAccount } from '../../helpers/account-helpers';
// import { useWasm } from '@/context/wasm-context';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { useState } from 'react'
import Loader from '@/components/ui/loader';
import * as wasm from '@demox-labs/miden-sdk';

interface Account {
  id: number
  nonce: string
  code_root: string
  storage_root: string
  vault_root: string 
}

function AccountsTable({ accounts, isLoading }: { accounts: Account[], isLoading: boolean}) {
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
  // const wasm = useWasm();
  useLayoutEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/accounts.ts', import.meta.url), { type : "module" });
    workerRef.current.onmessage = async (event) => {
      switch (event.data.type) {
        case "createAccount":
          console.log('create account worker finished')
          // workerRef.current?.postMessage("fetchAccounts")
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
    }
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error.message)
    }

    // fetchAccounts();
    return () => {
      workerRef.current?.terminate();
    }
  }, [])

  // const fetchAccounts = () => {
  //   setFetchAccountsLoading(true)

  //   // const webClient = new wasm.WebClient()
  //   // console.log('webClient', webClient)
  //   // await webClient.create_client();
  //   // const accounts = await webClient.get_accounts();
  //   workerRef.current?.postMessage("fetchAccounts")
  // }

  async function createAccount() {
    try {
      setCreateAccountLoading(true)
      workerRef.current?.postMessage("createAccount")
      // await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.error('Failed to call create account:', error);
    }
  }
// !wasm ? <div className="flex min-h-screen flex-col items-center">Loading...</div> : 
  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="flex flex-row items-start pb-4">
        {/* { isLoading
          ? <Loader variant='scaleUp' className="bg-gray-700 text-white py-2 px-4 rounded-md" /> 
          : <button className="bg-gray-700 text-white py-2 px-4 rounded-md" onClick={() => testNewRegularAccount()}>Create account</button>
        } */}
        <button disabled={createAccountLoading} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => createAccount()}>{ createAccountLoading ? <Loader variant='scaleUp' />  : 'Create account'}</button>
      </div>
      <AccountsTable accounts={accounts} isLoading={fetchAccountsLoading} />
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