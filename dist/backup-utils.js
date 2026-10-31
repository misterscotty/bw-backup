"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackupDir = getBackupDir;
exports.getBackups = getBackups;
exports.deleteBackupSet = deleteBackupSet;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const config_js_1 = require("./config.js");
async function getBackupDir() {
    const config = await (0, config_js_1.loadConfig)();
    return config.backupDir;
}
async function getBackups(backupDir) {
    const files = await promises_1.default.readdir(backupDir);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    const backups = await Promise.all(jsonFiles.map(async (file) => {
        const full = node_path_1.default.join(backupDir, file);
        const stat = await promises_1.default.stat(full);
        return {
            file: full,
            mtime: stat.mtimeMs,
            size: stat.size
        };
    }));
    backups.sort((a, b) => b.mtime -
        a.mtime);
    return backups;
}
async function deleteBackupSet(jsonFile) {
    await promises_1.default.rm(jsonFile, { force: true });
    await promises_1.default.rm(`${jsonFile}.sha256`, { force: true });
    await promises_1.default.rm(jsonFile.replace(".json", ".log"), { force: true });
}
