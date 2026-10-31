"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSha256 = computeSha256;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_crypto_1 = require("node:crypto");
async function computeSha256(file) {
    const data = await promises_1.default.readFile(file);
    return (0, node_crypto_1.createHash)("sha256")
        .update(data)
        .digest("hex");
}
