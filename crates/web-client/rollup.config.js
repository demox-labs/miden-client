import rust from "@wasm-tool/rollup-plugin-rust";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";

// Flag that indicates if the build is meant for testing purposes.
const testing = process.env.MIDEN_WEB_TESTING === "true";
const wasmOptArgs = [
  "-O3",
  "--enable-bulk-memory",
  "--enable-nontrapping-float-to-int",
];

// Base cargo arguments that are always included
const baseCargoArgs = [
  "--features",
  "testing",
  "--config",
  `build.rustflags=["-C", "target-feature=+atomics,+bulk-memory,+mutable-globals", "-C", "link-arg=--max-memory=4294967296"]`,
  "--no-default-features",
];

// Cargo arguments for testing builds
// to ensure release like optimizations are enable
const testCargoArgs = [
  "--config",
  "profile.dev.opt-level=3",
  "--config",
  "profile.dev.debug=false",
  "--config",
  'profile.dev.panic="abort"',
  "--config",
  "profile.dev.lto=true",
  "--config",
  'profile.dev.strip="none"',
  "-Z",
  "build-std=panic_abort,std",
  "-Z",
  "build-std-features=panic_immediate_abort,optimize_for_size",
];

/**
 * Rollup configuration file for building a Cargo project and creating a WebAssembly (WASM) module,
 * as well as bundling a dedicated web worker file.
 *
 * The configuration sets up three build processes:
 *
 * 1. **WASM Module Build:**
 *    Compiles Rust code into WASM using the @wasm-tool/rollup-plugin-rust plugin. This process
 *    applies specific cargo arguments to enable necessary WebAssembly features (such as atomics,
 *    bulk memory operations, and mutable globals) and to set maximum memory limits. For testing builds,
 *    the WASM optimization level is set to 0 to improve build times, reducing the feedback loop during development.
 *
 * 2. **Worker Build:**
 *    Bundles the dedicated web worker file (`web-client-methods-worker.js`) into the `dist/workers` directory.
 *    This configuration resolves WASM module imports and uses the copy plugin to ensure that the generated
 *    WASM assets are available to the worker.
 *
 * 3. **Main Entry Point Build:**
 *    Resolves and bundles the main JavaScript file (`index.js`) for the primary entry point of the application
 *    into the `dist` directory.
 *
 * Each build configuration outputs ES module format files with source maps to facilitate easier debugging.
 */
export default [
  {
    input: "./js/wasm.js",
    output: {
      dir: `dist`,
      format: "es",
      sourcemap: true,
      assetFileNames: "assets/[name][extname]",
    },
    plugins: [
      rust({
        extraArgs: {
          cargo: [...baseCargoArgs, ...(testing ? testCargoArgs : [])],
          ...(testing ? {} : { wasmOpt: wasmOptArgs }),
        },
        experimental: {
          typescriptDeclarationDir: "dist/crates",
        },
        ...(testing
          ? { optimize: { release: false, rustc: false } }
          : { optimize: { release: true, rustc: true } }),
      }),
      resolve(),
      commonjs(),
    ],
  },
  // Build the worker file
  {
    input: "./js/workers/web-client-methods-worker.js",
    output: {
      dir: `dist/workers`,
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      copy({
        targets: [
          // Copy WASM to `dist/workers/assets` for worker accessibility
          { src: "dist/assets/*.wasm", dest: "dist/workers/assets" },
        ],
        verbose: true,
      }),
    ],
  },
  // Build the main entry point
  {
    input: "./js/index.js",
    output: {
      dir: `dist`,
      format: "es",
      sourcemap: true,
    },
    plugins: [resolve(), commonjs()],
  },
];
