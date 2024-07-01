'use client'

import Loader from '@/components/ui/loader';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { MutableRefObject, ReactElement, useLayoutEffect, useRef, useState } from "react"
import { Account } from '../accounts/page';

interface TransactionResult {
  transactionId: string,
  createdNoteIds: string[],
}

interface MintTransactionProps {
  accounts: Account[],
  fetchAccountsLoading: boolean,
  worker: MutableRefObject<Worker | undefined>,
  mintLoading: boolean,
  setMintLoading: React.Dispatch<React.SetStateAction<boolean>>,
  mintedTransaction: TransactionResult | null
  consumeLoading: boolean,
  setConsumeLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

function MintTransaction({ accounts, fetchAccountsLoading, worker, mintLoading, setMintLoading, mintedTransaction, consumeLoading, setConsumeLoading }: MintTransactionProps) {
  const wallets = accounts.filter(account => account.is_regular_account)
  const faucets = accounts.filter(account => account.is_faucet)
  const [selectedWalletId, setSelectedWallet] = useState<string>("Select a wallet")
  const [selectedFaucetId, setSelectedFaucet] = useState<string>("Select a faucet")

  const DoMint = async () => {
    setMintLoading(true)
    worker.current?.postMessage({ type: "mintTransaction", params: {
      faucetId: selectedFaucetId,
      walletId: selectedWalletId,
      noteType: "Private",
      amount: "5",
    } });
  }

  const DoComsume = async () => {
    setConsumeLoading(true)
    worker.current?.postMessage({ type: "consumeTransaction", params: { 
      targetAccountId: selectedWalletId,
      noteIds: mintedTransaction?.createdNoteIds 
    } })
  }

  return fetchAccountsLoading ? <div className="flex justify-center items-center mb-6"><Loader /></div> : (
    <div className="rounded-lg border border-gray-200 p-4 pb-5 w-3/4 min-h-fit mb-6">
      <div className="flex place-content-center mb-2">
        <p className="text-2xl font-bold">Mint 5 tokens</p>
      </div>
      <div className="flex place-content-center ">
        <div className="flex items-center">
          <div className="flex">
            <div className="w-1/2">
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={selectedWalletId} onChange={(event) => setSelectedWallet(event.target.value)}>
                <option disabled value="Select a wallet">Select a wallet</option>
                {wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.id}</option>)}
              </select>
            </div>
            <div className="w-1/2">
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={selectedFaucetId} onChange={(event) => setSelectedFaucet(event.target.value)}>
                <option disabled value="Select a faucet">Select a faucet</option>
                {faucets.map(faucet => <option key={faucet.id} value={faucet.id}>{faucet.id}</option>)}
              </select>
            </div>
          </div>
          <button disabled={mintLoading || selectedWalletId == "Select a wallet" || selectedFaucetId == "Select a faucet"} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => DoMint()}>{ mintLoading ? <Loader variant='scaleUp' />  : 'Mint'}</button>
        </div>
      </div>
      <div className="flex place-content-center mb-2 mt-12">
        <p className="text-2xl font-bold">Consume Minted Note</p>
      </div>
      <div className="flex place-content-center">
        {mintedTransaction
        ? <div>
          <p>Created Transaction Id: {mintedTransaction.transactionId}</p>
          <p>Created Note Ids: {mintedTransaction.createdNoteIds.join(", ")}</p>
          <div className="flex place-content-center">
            <button className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => DoComsume()}>{ consumeLoading ? <Loader variant='scaleUp' />  : 'Consume'}</button>
          </div>
        </div> 
        : <p>Mint a note to consume it here!</p>}
      </div>
    </div>
  )
}

function TransactionsTable({ transactions, isLoading }: { transactions: string[], isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div>
        <p className="text-2xl font-bold">Transactions</p>
      </div>
      <table className="w-full table-auto border-collapse text-center">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b-2 border-gray-300">Id</th>
          </tr>
        </thead>
        <tbody>
          {isLoading 
            ? <tr><td colSpan={1} className="px-4 py-4 border-b border-gray-200 text-center"><div className="flex justify-center items-center"><Loader /></div></td></tr>
            : transactions.map((transactionId) => (
              <tr key={transactionId}>
                <td className="px-4 py-2 border-b border-gray-200">{transactionId}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export default function Transactions() {
  const workerRef = useRef<Worker>()
  const [fetchTransactionsLoading, setFetchTransactionsLoading] = useState(true)
  const [transactionIds, setTransactionIds] = useState<string[]>([])
  const [fetchAccountsLoading, setFetchAccountsLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [mintLoading, setMintLoading] = useState(false)
  const [mintedTransaction, setMintedTransacton] = useState<TransactionResult | null>(null)
  const [consumeLoading, setConsumeLoading] = useState(false)

  function createWorkerAndFetchTransactions() {
    return new Promise((resolve, reject) => {
      workerRef.current = new Worker(new URL('../../workers/accounts.ts', import.meta.url), { type : "module" });
  
      workerRef.current.onmessage = function(event) {
        switch (event.data.type) {
          case "ready":
            console.log('Worker is ready. Sending message...');
            workerRef.current?.postMessage({ type: "fetchTransactions" });
            break;
          case "fetchTransactions":
            console.log('fetch transaction ids worker finished', event.data.inputNotes)
            setFetchTransactionsLoading(false)
            setTransactionIds(event.data.transactions)
            workerRef.current?.postMessage({ type: "fetchAccounts" });
            break;
          case "fetchAccounts":
            console.log('fetch accounts worker finished', event.data.accounts)
            setFetchAccountsLoading(false)
            setAccounts(event.data.accounts)
            break;
          case "mintTransaction":
            console.log('mint transaction worker finished', event.data.mintResult.transactionId, event.data.mintResult.createdNoteIds)
            setMintLoading(false)
            setMintedTransacton(event.data.mintResult as TransactionResult)
            workerRef.current?.postMessage({ type: "fetchTransactions" })
            break;
          case "consumeTransaction":
            console.log('consume transaction worker finished', event.data)
            setConsumeLoading(false)
            setMintedTransacton(null)
            workerRef.current?.postMessage({ type: "fetchTransactions" })
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
    createWorkerAndFetchTransactions()

    return () => {
      workerRef.current?.terminate();
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center">
      <MintTransaction 
        accounts={accounts} 
        fetchAccountsLoading={fetchAccountsLoading} 
        worker={workerRef} 
        mintLoading={mintLoading} 
        setMintLoading={setMintLoading} 
        mintedTransaction={mintedTransaction}
        consumeLoading={consumeLoading}
        setConsumeLoading={setConsumeLoading} />
      <TransactionsTable transactions={transactionIds} isLoading={fetchTransactionsLoading} />
    </div>
  )
}

Transactions.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardLayout contentClassName="flex items-center justify-center">
      {page}
    </DashboardLayout>
  )
}