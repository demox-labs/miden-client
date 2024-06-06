'use client'

import { useWasm } from '@/context/wasm-context';

export default function Greet() {
  const wasm = useWasm();
  if (!wasm) {
    return <div>Loading...</div>;
  }

  async function greetFromWasm() {
    if (!wasm) {
      console.error('wasm or webClient is null');
      return
    }

    wasm.greet();
    console.log('serialze: ', wasm.serialize_test())
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-row items-start">
        <div className="mr-3">This is the greeting page.</div>
        <button onClick={() => greetFromWasm()}>Greet</button>
      </div>
    </div>
  )
}