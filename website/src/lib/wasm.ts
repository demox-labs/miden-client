import init, * as wasm from 'wasm';

let wasmModule: typeof wasm;

export async function initializeWasmAndWebClient() {
  if (!wasmModule) {
    await init();
    wasmModule = wasm;
  }
  return wasmModule
}
