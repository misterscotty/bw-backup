import { stdin, stdout } from "node:process";

import { setEncryptionPassword } from "../password.js";

function readSecret(prompt: string): Promise<string> {
    if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode) {
        throw new Error(
            "Setting the encryption password requires an interactive terminal."
        );
    }

    return new Promise(
        (resolve, reject) => {
            let value = "";

            const cleanup = (): void => {
                stdin.setRawMode?.(false);
                stdin.pause();
                stdin.removeListener("data", onData);
                stdin.removeListener("error", onError);
                stdout.write("\n");
            };

            const onError = (error: Error): void => {
                cleanup();
                reject(error);
            };

            const onData = (chunk: Buffer): void => {
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

            stdout.write(prompt);
            stdin.setRawMode(true);
            stdin.resume();
            stdin.on("data", onData);
            stdin.on("error", onError);
        }
    );
}

export async function runSetPassword(): Promise<void> {
    const password =
        await readSecret("Encryption password: ");

    const confirmation =
        await readSecret("Confirm encryption password: ");

    if (password !== confirmation) {
        throw new Error("Passwords do not match.");
    }

    await setEncryptionPassword(password);
    console.log("Encryption password saved to the OS credential store.");
}
