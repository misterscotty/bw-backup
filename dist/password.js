"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncryptionPassword = getEncryptionPassword;
exports.setEncryptionPassword = setEncryptionPassword;
const keytar_1 = __importDefault(require("keytar"));
const SERVICE_NAME = "BitwardenBackup";
const ACCOUNT_NAME = "file_pwd";
async function getEncryptionPassword() {
    const password = await keytar_1.default.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!password) {
        throw new Error(`No encryption password is stored in the OS credential store. Run "node dist/main.js set-password".`);
    }
    return password;
}
async function setEncryptionPassword(password) {
    if (!password) {
        throw new Error("The encryption password cannot be empty.");
    }
    await keytar_1.default.setPassword(SERVICE_NAME, ACCOUNT_NAME, password);
}
