'use client'

import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Loader from '@/components/ui/loader';

function NotesTable({ inputNotes, outputNotes, inputNotesLoading, outputNotesLoading }: { inputNotes: string[], outputNotes: string[], inputNotesLoading: boolean, outputNotesLoading: boolean }) {

  return (
    <div className="flex flex-row items-center">
      <div className="flex flex-col items-center pr-8">
        <div>
          <p className="text-2xl font-bold">Input Notes</p>
        </div>
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b-2 border-gray-300">Id</th>
            </tr>
          </thead>
          <tbody>
            {inputNotesLoading 
              ? <tr><td colSpan={1} className="px-4 py-4 border-b border-gray-200 text-center"><div className="flex justify-center items-center"><Loader /></div></td></tr>
              : inputNotes.map((noteId) => (
                <tr key={noteId}>
                  <td className="px-4 py-2 border-b border-gray-200">{noteId}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center">
        <div>
          <p className="text-2xl font-bold">Output Notes</p>
        </div>
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b-2 border-gray-300">Id</th>
            </tr>
          </thead>
          <tbody>
            {outputNotesLoading 
              ? <tr><td colSpan={1} className="px-4 py-4 border-b border-gray-200 text-center"><div className="flex justify-center items-center"><Loader /></div></td></tr>
              : outputNotes.map((noteId) => (
                <tr key={noteId}>
                  <td className="px-4 py-2 border-b border-gray-200">{noteId}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Notes() {
  const workerRef = useRef<Worker>()
  const [inputNotes, setInputNotes] = useState<string[]>([])
  const [fetchInputNotes, setFetchInputNotesLoading] = useState(true)
  const [outputNotes, setOutputNotes] = useState<string[]>([])
  const [fetchOutputNotes, setFetchOutputNotesLoading] = useState(true)

  function createWorkerAndFetchNotes() {
    return new Promise((resolve, reject) => {
      workerRef.current = new Worker(new URL('../../workers/accounts.ts', import.meta.url), { type : "module" });
  
      workerRef.current.onmessage = function(event) {
        switch (event.data.type) {
          case "ready":
            console.log('Worker is ready. Sending message...');
            workerRef.current?.postMessage({ type: "fetchInputNotes", params: { noteFilter: "All" } });
            break;
          case "fetchInputNotes":
            console.log('fetch input notes worker finished', event.data.inputNotes)
            setFetchInputNotesLoading(false)
            setInputNotes(event.data.inputNotes)
            workerRef.current?.postMessage({ type: "fetchOutputNotes", params: { noteFilter: "All" } });
            break;
          case "fetchOutputNotes":
            console.log('fetch output notes worker finished', event.data.outputNotes)
            setFetchOutputNotesLoading(false)
            setOutputNotes(event.data.outputNotes)
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
    createWorkerAndFetchNotes()

    return () => {
      workerRef.current?.terminate();
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center">
      <NotesTable inputNotes={inputNotes} outputNotes={outputNotes} inputNotesLoading={fetchInputNotes} outputNotesLoading={fetchOutputNotes} />
    </div>
  )
}

Notes.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardLayout contentClassName="flex items-center justify-center">
      {page}
    </DashboardLayout>
  )
}