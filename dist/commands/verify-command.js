"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVerify = runVerify;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const backup_utils_js_1 = require("../backup-utils.js");
const checksum_js_1 = require("../checksum.js");
async function runVerify() {
    const backupDir = await (0, backup_utils_js_1.getBackupDir)();
    const files = await promises_1.default.readdir(backupDir);
    const backups = files.filter(f => f.endsWith(".json"));
    for (const backup of backups) {
        const fullPath = node_path_1.default.join(backupDir, backup);
        const checksumFile = `${fullPath}.sha256`;
        const logFile = fullPath.replace(".json", ".log");
        try {
            await promises_1.default.access(checksumFile);
            await promises_1.default.access(logFile);
            const expected = (await promises_1.default.readFile(checksumFile, "utf8"))
                .split(/\s+/)[0];
            const actual = await (0, checksum_js_1.computeSha256)(fullPath);
            if (expected === actual) {
                console.log(`✓ ${backup}`);
            }
            else {
                console.log(`✗ ${backup} checksum mismatch`);
            }
        }
        catch {
            console.log(`✗ ${backup} incomplete backup set`);
        }
    }
}
