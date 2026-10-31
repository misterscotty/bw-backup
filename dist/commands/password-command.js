"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetPassword = runSetPassword;
const node_process_1 = require("node:process");
const password_js_1 = require("../password.js");
function readSecret(prompt) {
    if (!node_process_1.stdin.isTTY || !node_process_1.stdout.isTTY || !node_process_1.stdin.setRawMode) {
        throw new Error("Setting the encryption password requires an interactive terminal.");
    }
    return new Promise((resolve, reject) => {
        let value = "";
        const cleanup = () => {
            node_process_1.stdin.setRawMode?.(false);
            node_process_1.stdin.pause();
            node_process_1.stdin.removeListener("data", onData);
            node_process_1.stdin.removeListener("error", onError);
            node_process_1.stdout.write("\n");
        };
        const onError = (error) => {
            cleanup();
            reject(error);
        };
        const onData = (chunk) => {
            for (const byte of chunk) {
                if (byte === 3) {
                    cleanup();
                    reject(new Error("Password entry cancelled."));
                    return;
                }
                if (byte === 10 || byte === 13) {
                    cleanup();
                    resolve(value);
                    return;
                }
                if (byte === 127 || byte === 8) {
                    value = value.slice(0, -1);
                    continue;
                }
                value += String.fromCharCode(byte);
            }
        };
        node_process_1.stdout.write(prompt);
        node_process_1.stdin.setRawMode(true);
        node_process_1.stdin.resume();
        node_process_1.stdin.on("data", onData);
        node_process_1.stdin.on("error", onError);
    });
}
async function runSetPassword() {
    const password = await readSecret("Encryption password: ");
    const confirmation = await readSecret("Confirm encryption password: ");
    if (password !== confirmation) {
        throw new Error("Passwords do not match.");
    }
    await (0, password_js_1.setEncryptionPassword)(password);
    console.log("Encryption password saved to the OS credential store.");
}
