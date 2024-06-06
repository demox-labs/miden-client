'use client'

// import { testNewRegularAccount } from '../../helpers/account-helpers';
import { useWasm } from '@/context/wasm-context';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement } from 'react';

import { useState } from 'react'
import Loader from '@/components/ui/loader';
import * as w from 'wasm';

interface Account {
  id: number
  address: string
  nonce: number
  codeRoot: string
  storageRoot: string
  vaultRoot: string
  accoutSeed: string
}

function AccountsTable() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const wasm = useWasm();

  if (!wasm) {
    return <div>Loading...</div>;
  }

  const fetchAccounts = async (wasm: typeof w) => {
    setIsLoading(true)
    const webClient = new wasm.WebClient();
    await webClient.create_client();
    const accounts = await webClient.get_accounts();
    console.log('Found accounts: ', accounts);
    setAccounts(accounts)
    setIsLoading(false)
  }

  return (
    <div>
      <button onClick={() => fetchAccounts(wasm)} className="bg-gray-700 text-white py-2 px-4 rounded-md">Fetch accounts</button>
    </div>
  )
}

export default function Accounts() {
  const [isLoading, setIsLoading] = useState(false)
  const wasm = useWasm();
  if (!wasm) {
    return <div>Loading...</div>;
  }

  async function testNewRegularAccount(wasm: typeof w) {
    setIsLoading(true)
    try {
      const webClient = new wasm.WebClient();
      await webClient.create_client();
      const basicMutableTemplate = {
        type: "BasicMutable",
        storage_mode: "Local"
      };
      let result = await webClient.new_account(basicMutableTemplate);
      return result;
      // await new Promise(r => setTimeout(r, 10000));
    } catch (error) {
      console.error('Failed to call create account:', error);
    }
    finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="flex flex-row items-start">
        {/* { isLoading
          ? <Loader variant='scaleUp' className="bg-gray-700 text-white py-2 px-4 rounded-md" /> 
          : <button className="bg-gray-700 text-white py-2 px-4 rounded-md" onClick={() => testNewRegularAccount()}>Create account</button>
        } */}
        <button disabled={isLoading} className="bg-gray-700 text-white py-2 px-4 rounded-md h-10 w-32" onClick={() => testNewRegularAccount(wasm)}>{ isLoading ? <Loader variant='scaleUp' />  : 'Create account'}</button>
      </div>
      <AccountsTable />
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