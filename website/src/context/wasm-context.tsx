// 'use client'
// import { createContext, useContext, useState, useEffect } from 'react';
// import { initializeWasmAndWebClient } from '../lib/wasm';
// import * as w from 'wasm';

// const WasmContext = createContext<typeof w | null>(null);

// export function WasmProvider({ children }: { children: React.ReactNode }): React.ReactNode {
//   const [wasm, setWasm] = useState<typeof w | null>(null);

//   useEffect(() => {
//     (async () => {
//       const wasmModule = await initializeWasmAndWebClient();
//       setWasm(wasmModule);
//     })();
//   }, []);

//   return (
//     <WasmContext.Provider value={wasm}>
//       {children}
//     </WasmContext.Provider>
//   );
// }

// export function useWasm() {
//   const context = useContext(WasmContext);
//   if (context === undefined) {
//     throw new Error('useWasm must be used within a WasmProvider');
//   }
//   return context;
// }
