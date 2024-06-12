// import { AccountsBuilder } from '@/workers/accounts';
// import { spawn, Thread, Worker } from 'threads';

export const createBasicAccount = async () => {
  const worker = new Worker('src/workers/accounts.ts', { type : "module" })
  const num = worker.postMessage(2)
  return num
}