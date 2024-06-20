'use client'

import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement, useLayoutEffect, useRef } from 'react';

import { useState } from 'react'
import Loader from '@/components/ui/loader';
import { Account } from '../accounts/page';


function FaucetsTable({ accounts, isLoading }: { accounts: Account[], isLoading: boolean }) {

  return (
    <div className="flex flex-col items-center">
      <div>
        <p className="text-2xl font-bold">Faucets</p>
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

export default function Faucets() {
  const workerRef = useRef<Worker>()
  const [faucetStorageType, setFaucetStorageType] = useState('OffChain')
  const [tokenSymbol, setTokenSymbol] = useState("TOK")
  const [decimals, setDecimals] = useState("6")
  const [maxSupply, setMaxSupply] = useState("1000000")
  const [createAccountLoading, setCreateAccountLoading] = useState(false)
  const [fetchAccountsLoading, setFetchAccountsLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recentFaucetId, setRecentFaucetId] = useState("")
  
  function createWorkerAndSendMessage(message: object) {
    return new Promise((resolve, reject) => {
      workerRef.current = new Worker(new URL('../../workers/accounts.ts', import.meta.url), { type : "module" });
  
      workerRef.current.onmessage = function(event) {
        switch (event.data.type) {
          case "ready":
            workerRef.current?.postMessage(message);
            break;
          case "createFaucet":
            workerRef.current?.postMessage({ type: "fetchAccounts" })
            setRecentFaucetId(event.data.faucetId)
            setCreateAccountLoading(false)
            break;
          case "fetchAccounts":
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
  
  async function createFaucet() {
    try {
      setCreateAccountLoading(true)
      workerRef.current?.postMessage({
        type: "createFaucet", 
        params: { 
          storageType: faucetStorageType,
          nonFungible: false, // Only support fungible tokens for now
          tokenSymbol: tokenSymbol,
          decimals: decimals,
          maxSupply: maxSupply
        } 
      })
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
            <select value={faucetStorageType} onChange={(event) => setFaucetStorageType(event.target.value)} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 mr-4 cursor-pointer">
              <option value="OffChain">OffChain</option>
              <option value="OnChain">OnChain</option>
            </select>
          </div>

          <div className="flex items-center pb-2">
            <label className="text-sm mr-2 w-28">Token Symbol:</label>
            <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 mr-4 cursor-pointer" />
          </div>

          <div className="flex items-center pb-2">
            <label className="text-sm mr-2 w-28">Decimals:</label>
            <input type="text" id="tokenSymbol" value={decimals} onChange={(e) => setDecimals(e.target.value)} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 mr-4 cursor-pointer" />
          </div>

          <div className="flex items-center">
            <label className="text-sm mr-2 w-28">Max Supply:</label>
            <input type="text" id="tokenSymbol" value={maxSupply} onChange={(e) => setMaxSupply(e.target.value)} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 mr-4 cursor-pointer" />
          </div>
        </div>
        
        <button disabled={createAccountLoading} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => createFaucet()}>{ createAccountLoading ? <Loader variant='scaleUp' />  : 'Create faucet'}</button>
      </div>
      <FaucetsTable accounts={accounts.filter((account) => account.is_faucet)} isLoading={fetchAccountsLoading} />
    </div>
  )
}

Faucets.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardLayout contentClassName="flex items-center justify-center">
      {page}
    </DashboardLayout>
  )
}