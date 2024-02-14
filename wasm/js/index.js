import wasm from "../dist/wasm.js";

const {
    greet,
    create_new_account,
} = await wasm({
    importHook: () => {
        return new URL("assets/miden_wasm.wasm", import.meta.url);
    },
});

export {
    greet,
    create_new_account
};