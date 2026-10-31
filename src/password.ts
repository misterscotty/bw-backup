import keytar from "keytar";

const SERVICE_NAME = "BitwardenBackup";
const ACCOUNT_NAME = "file_pwd";

export async function getEncryptionPassword(): Promise<string> {
    const password =
        await keytar.getPassword(
            SERVICE_NAME,
            ACCOUNT_NAME
        );

    if (!password) {
        throw new Error(
            `No encryption password is stored in the OS credential store. Run "node dist/main.js set-password".`
        );
    }

    return password;
}

export async function setEncryptionPassword(
    password: string
): Promise<void> {
    if (!password) {
        throw new Error(
            "The encryption password cannot be empty."
        );
    }

    await keytar.setPassword(
        SERVICE_NAME,
        ACCOUNT_NAME,
        password
    );
}
