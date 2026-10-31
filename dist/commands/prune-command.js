"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPrune = runPrune;
const node_path_1 = __importDefault(require("node:path"));
const backup_utils_js_1 = require("../backup-utils.js");
const config_js_1 = require("../config.js");
async function runPrune(backupName) {
    const config = await (0, config_js_1.loadConfig)();
    const backupDir = await (0, backup_utils_js_1.getBackupDir)();
    const backups = await (0, backup_utils_js_1.getBackups)(backupDir);
    //
    // Explicit delete
    //
    if (backupName) {
        const target = backups.find(backup => node_path_1.default.basename(backup.file) === backupName);
        if (!target) {
            console.error(`Backup not found: ${backupName}`);
            process.exit(1);
        }
        await (0, backup_utils_js_1.deleteBackupSet)(target.file);
        console.log(`Removed backup set: ${backupName}`);
        return;
    }
    //
    // Retention mode
    //
    if (backups.length <=
        config.retentionCount) {
        console.log("No pruning required.");
        return;
    }
    const oldest = backups[backups.length - 1];
    await (0, backup_utils_js_1.deleteBackupSet)(oldest.file);
    console.log(`Removed oldest backup: ${node_path_1.default.basename(oldest.file)}`);
}
