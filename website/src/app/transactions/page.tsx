'use client'

import Loader from '@/components/ui/loader';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { MutableRefObject, ReactElement, use, useLayoutEffect, useRef, useState } from "react"
import { Account } from '../accounts/page';

interface ConsumeParams {
  targetAccountId: string,
  listOfNotes: string[]
}

interface TransactionResult {
  transactionId: string,
  createdNoteIds: string[],
}

interface SwapTransactionResult {
  transactionId: string,
  expectedOutputNoteIds: string[],
  expectedPartialNoteIds: string[],
  paybackNoteTag: string
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

interface SendTransactionProps {
  accounts: Account[],
  fetchAccountsLoading: boolean,
  worker: MutableRefObject<Worker | undefined>,
  sendLoading: boolean,
  setSendLoading: React.Dispatch<React.SetStateAction<boolean>>,
  sentTransaction: TransactionResult | null,
  consumeLoading: boolean,
  setConsumeLoading: React.Dispatch<React.SetStateAction<boolean>>
}

interface SwapTransactionProps {
  accounts: Account[],
  fetchAccountsLoading: boolean,
  worker: MutableRefObject<Worker | undefined>,
  swapLoading: boolean,
  setSwapLoading: React.Dispatch<React.SetStateAction<boolean>>,
  swappedTransaction: SwapTransactionResult | null,
  swapANotes: string[] | null,
  swapBNotes: string[] | null,
  consumeALoading: boolean,
  setConsumeALoading: React.Dispatch<React.SetStateAction<boolean>>,
  consumeBLoading: boolean,
  setConsumeBLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

interface ConsumeTransactionProps {
  consumeLoading: boolean,
  setConsumeLoading: React.Dispatch<React.SetStateAction<boolean>>,
  worker: MutableRefObject<Worker | undefined>,
  transactionId?: string,
  consumeParams: ConsumeParams | null,
  consumeType: string,
  consumeTitle?: string
}

function ConsumeTransaction({consumeLoading, setConsumeLoading, worker, transactionId, consumeParams, consumeType, consumeTitle="Consume Note" }: ConsumeTransactionProps) {
  const DoComsume = async () => {
    setConsumeLoading(true)
    worker.current?.postMessage({ type: "consumeTransaction", params: { 
      targetAccountId: consumeParams?.targetAccountId,
      noteIds: consumeParams?.listOfNotes,
      consumeType: consumeType
    } })
  }

  return(
  <div>
    <div className="flex place-content-center mb-2">
        <p className="text-2xl font-bold">{consumeTitle}</p>
      </div>
      <div className="flex place-content-center">
        {consumeParams
        ? <div>
          <p>Created Transaction Id: {transactionId}</p>
          <p>Created Note Ids: {consumeParams.listOfNotes.join(", ")}</p>
          <div className="flex place-content-center">
            <button disabled={consumeLoading} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => DoComsume()}>{ consumeLoading ? <Loader variant='scaleUp' />  : 'Consume'}</button>
          </div>
        </div>
        : <p>Create a note to consume it here!</p>}
      </div>
  </div>
  )
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

  return fetchAccountsLoading ? <div className="flex justify-center items-center mb-6"><Loader /></div> : (
    <div className="rounded-lg border border-gray-200 p-4 pb-5 w-3/4 min-h-fit mb-6">
      <div className="flex place-content-center mb-2">
        <p className="text-2xl font-bold">Mint 5 tokens</p>
      </div>
      <div className="flex place-content-center">
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
        <ConsumeTransaction
          consumeLoading={consumeLoading} 
          setConsumeLoading={setConsumeLoading}
          worker={worker}
          transactionId={mintedTransaction?.transactionId}
          consumeParams={mintedTransaction ? { targetAccountId: selectedWalletId, listOfNotes: mintedTransaction?.createdNoteIds } : null}
          consumeType='mint' />
      </div>
    </div>
  )
}

function SendTransaction(props: SendTransactionProps) {
  const wallets = props.accounts.filter(account => account.is_regular_account)
  const faucets = props.accounts.filter(account => account.is_faucet)
  const [senderId, setSenderId] = useState<string>("Select a sender")
  const [receiverId, setReceiverId] = useState<string>("Select a recipient")
  const [faucetId, setFaucetId] = useState<string>("Select a faucet")

  const parametersSelected = (): boolean => {
    return senderId != "Select a sender" && receiverId != "Select a recipient" && faucetId != "Select a faucet"
  }

  const DoSend = async () => {
    props.setSendLoading(true)
    props.worker.current?.postMessage({ type: "sendTransaction", params: {
      senderAccountId: senderId,
      targetAccountId: receiverId,
      faucetId: faucetId,
      noteType: "Private",
      amount: "1",
      recallHeight: null
    } });
  }

  return props.fetchAccountsLoading ? <div className="flex justify-center items-center mb-6"><Loader /></div> : (
    <div className="rounded-lg border border-gray-200 p-4 pb-5 w-3/4 min-h-fit mb-6">
      <div className="flex place-content-center mb-2">
        <p className="text-2xl font-bold">Send 1 token</p>
      </div>
      <div className="flex place-content-center ">
        <div className="flex items-center">
          <div className="flex">
            <div className="w-1/2">
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={senderId} onChange={(event) => setSenderId(event.target.value)}>
                <option disabled value="Select a sender">Select a sender</option>
                {wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.id}</option>)}
              </select>
            </div>
            <div className="w-1/2">
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={receiverId} onChange={(event) => setReceiverId(event.target.value)}>
                <option disabled value="Select a recipient">Select a recipient</option>
                {wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.id}</option>)}
              </select>
            </div>
            <div className="w-1/2">
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={faucetId} onChange={(event) => setFaucetId(event.target.value)}>
                <option disabled value="Select a faucet">Select a faucet</option>
                {faucets.map(faucet => <option key={faucet.id} value={faucet.id}>{faucet.id}</option>)}
              </select>
            </div>
          </div>
          <button disabled={props.sendLoading || !parametersSelected()} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => DoSend()}>{ props.sendLoading ? <Loader variant='scaleUp' />  : 'Send'}</button>
        </div>
      </div>
      <div className="flex place-content-center mb-2 mt-12">
        <ConsumeTransaction
          consumeLoading={props.consumeLoading} 
          setConsumeLoading={props.setConsumeLoading}
          worker={props.worker}
          transactionId={props.sentTransaction?.transactionId}
          consumeParams={props.sentTransaction ? { targetAccountId: senderId, listOfNotes: props.sentTransaction?.createdNoteIds } : null }
          consumeType='send' />
      </div>
    </div>
  )
}

function SwapTransaction(props: SwapTransactionProps) {
  const wallets = props.accounts.filter(account => account.is_regular_account)
  const faucets = props.accounts.filter(account => account.is_faucet)
  const [walletA, setWalletA] = useState<string>("Select wallet A")
  const [faucetA, setFaucetA] = useState<string>("Select faucet A")
  const [walletB, setWalletB] = useState<string>("Select wallet B")
  const [faucetB, setFaucetB] = useState<string>("Select faucet B")

  const parametersSelected = (): boolean => {
    return walletA != "Select wallet A" && faucetA != "Select faucet A" && walletB != "Select wallet B" && faucetB != "Select faucet B"
  }

  const DoSwap = async () => {
    props.setSwapLoading(true)
    props.worker.current?.postMessage({ type: "swapTransaction", params: {
      walletA: walletA,
      faucetA: faucetA,
      amountOfA: "1",
      faucetB: faucetB,
      amountOfB: "1",
      noteType: "Public"
    } });
  }

  return props.fetchAccountsLoading ? <div className="flex justify-center items-center mb-6"><Loader /></div> : (
    <div className="rounded-lg border border-gray-200 p-4 pb-5 w-3/4 min-h-fit mb-6">
      <div className="flex place-content-center mb-2">
        <p className="text-2xl font-bold">Swap assets</p>
      </div>
      <div className="flex place-content-center ">
        <div className="flex items-center w-full">
          <div className="flex">
            <div>
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={walletA} onChange={(event) => setWalletA(event.target.value)}>
                <option disabled value="Select wallet A">Select wallet A</option>
                {wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.id}</option>)}
              </select>
            </div>
            <div>
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={faucetA} onChange={(event) => setFaucetA(event.target.value)}>
                <option disabled value="Select faucet A">Select faucet A</option>
                {faucets.map(faucet => <option key={faucet.id} value={faucet.id}>{faucet.id}</option>)}
              </select>
            </div>
            <div>
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={walletB} onChange={(event) => setWalletB(event.target.value)}>
                <option disabled value="Select wallet B">Select wallet B</option>
                {wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.id}</option>)}
              </select>
            </div>
            <div>
              <select className="text-sm bg-gray-700 text-white rounded-md h-10 mr-4 cursor-pointer" value={faucetB} onChange={(event) => setFaucetB(event.target.value)}>
                <option disabled value="Select faucet B">Select faucet B</option>
                {faucets.map(faucet => <option key={faucet.id} value={faucet.id}>{faucet.id}</option>)}
              </select>
            </div>
          </div>
          <button disabled={props.swapLoading || !parametersSelected()} className="text-sm bg-gray-700 text-white rounded-md h-10 w-32 flex items-center justify-center" onClick={() => DoSwap()}>{ props.swapLoading ? <Loader variant='scaleUp' />  : 'Swap'}</button>
        </div>
      </div>
      <div className="flex place-content-center mb-2 mt-12">
        <ConsumeTransaction
          consumeLoading={props.consumeBLoading} 
          setConsumeLoading={props.setConsumeBLoading}
          worker={props.worker}
          transactionId={props.swappedTransaction?.transactionId}
          consumeParams={props.swapBNotes ? { targetAccountId: walletB, listOfNotes: props.swapBNotes } : null }
          consumeTitle="Consume Note for Wallet B"
          consumeType='swapB' />
      </div>
      <div className="flex place-content-center mb-2 mt-12">
        <ConsumeTransaction
          consumeLoading={props.consumeALoading}
          setConsumeLoading={props.setConsumeALoading}
          worker={props.worker}
          transactionId={props.swappedTransaction?.transactionId}
          consumeParams={props.swapANotes ? { targetAccountId: walletA, listOfNotes: props.swapANotes } : null }
          consumeTitle="Consume Note for Wallet A"
          consumeType='swapA' />
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
  // Mint state
  const [mintLoading, setMintLoading] = useState(false)
  const [mintedTransaction, setMintedTransacton] = useState<TransactionResult | null>(null)
  // Send State
  const [sendLoading, setSendLoading] = useState(false)
  const [sentTransaction, setSentTransaction] = useState<TransactionResult | null>(null)
  // Swap State
  const [swapLoading, setSwapLoading] = useState(false)
  const [swappedTransaction, setSwappedTransaction] = useState<SwapTransactionResult | null>(null)
  // Consume state
  const [mintConsumeLoading, setMintConsumeLoading] = useState(false)
  const [sendConsumeLoading, setSendConsumeLoading] = useState(false)
  const [swapAConsumeLoading, setSwapAConsumeLoading] = useState(false)
  const [swapBConsumeLoading, setSwapBConsumeLoading] = useState(false)
  const [swapANotes, setSwapANotes] = useState<string[] | null>(null)
  const [swapBNotes, setSwapBNotes] = useState<string[] | null>(null)

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
          case "sendTransaction":
            console.log('send transaction worker finished', event.data)
            setSendLoading(false)
            setSentTransaction(event.data.sendResult as TransactionResult)
            workerRef.current?.postMessage({ type: "fetchTransactions" })
            break;
          case "swapTransaction":
            console.log('swap transaction worker finished', event.data)
            setSwapLoading(false)
            const swapResult = event.data.swapResult as SwapTransactionResult
            setSwappedTransaction(swapResult)
            setSwapANotes(swapResult.expectedPartialNoteIds)
            setSwapBNotes(swapResult.expectedOutputNoteIds)
            workerRef.current?.postMessage({ type: "fetchTransactions" })
            break;
          case "consumeTransaction":
            console.log('consume transaction worker finished', event.data)
            setMintConsumeLoading(false)
            if (event.data.consumeType == "mint") setMintedTransacton(null)
            if (event.data.consumeType == "send") setSentTransaction(null)
            if (event.data.consumeType == "swapA") {
              setSwapAConsumeLoading(false)
              setSwapANotes(null)
            }
            if (event.data.consumeType == "swapB") {
              setSwapBConsumeLoading(false)
              setSwapBNotes(null)
            }
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
        consumeLoading={mintConsumeLoading}
        setConsumeLoading={setMintConsumeLoading} />
      <SendTransaction
        accounts={accounts}
        fetchAccountsLoading={fetchAccountsLoading} 
        worker={workerRef}
        sendLoading={sendLoading}
        setSendLoading={setSendLoading}
        sentTransaction={sentTransaction}
        consumeLoading={sendConsumeLoading}
        setConsumeLoading={setSendConsumeLoading} />
      <SwapTransaction
        accounts={accounts} 
        fetchAccountsLoading={fetchAccountsLoading} 
        worker={workerRef}
        swapLoading={swapLoading}
        setSwapLoading={setSwapLoading}
        swappedTransaction={swappedTransaction}
        swapANotes={swapANotes}
        swapBNotes={swapBNotes}
        consumeALoading={swapAConsumeLoading}
        setConsumeALoading={setSwapAConsumeLoading} 
        consumeBLoading={swapBConsumeLoading}
        setConsumeBLoading={setSwapBConsumeLoading} />
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