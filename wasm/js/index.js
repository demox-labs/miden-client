import wasm from "../dist/wasm.js";

const {
    greet,
    create_indexed_db,
} = await wasm({
    importHook: () => {
        return new URL("assets/miden_wasm.wasm", import.meta.url);
    },
});

export {
    greet,
    create_indexed_db
};