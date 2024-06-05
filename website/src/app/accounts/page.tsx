'use client'

// import { testNewRegularAccount } from '../../helpers/account-helpers';
import init, { WebClient } from 'wasm'
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement } from 'react';

import { useState } from 'react'
import Loader from '@/components/ui/loader';

interface AccountTableProps {
  webClient: WebClient
}

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

  const fetchAccounts = async () => {
    setIsLoading(true)
    await init();
    const webClient = new WebClient();
    await webClient.create_client();
    const accounts = await webClient.get_accounts();
    const accountObjs = []
    for (let i = 0; i < accounts.length; i++) {
      const acc = await webClient.get_account_stub_by_id(accounts[i])
      console.log('account!!', acc)
      accountObjs.push(acc)
    }
    console.log('account objs', accountObjs)
    setAccounts(accounts)
    setIsLoading(false)
  }

  return (
    <div>
      <button onClick={fetchAccounts} className="bg-gray-700 text-white py-2 px-4 rounded-md">Fetch accounts</button>
    </div>
  )
}

export default function Accounts() {
  const [isLoading, setIsLoading] = useState(false)

  async function testNewRegularAccount() {
    setIsLoading(true)
    try {
      await init();
      const webClient = new WebClient();
      await webClient.create_client();
      const basicMutableTemplate = {
        type: "BasicMutable"
      };
      let result = await webClient.new_account(basicMutableTemplate);
      return result;
    } catch (error) {
      console.error('Failed to call create account:', error);
    }
    finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-row items-start">
        { isLoading 
          ? <Loader /> 
          : <button className="bg-gray-700 text-white py-2 px-4 rounded-md" onClick={() => testNewRegularAccount()}>Create account</button>
        }
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