"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runList = runList;
const backup_utils_js_1 = require("../backup-utils.js");
async function runList() {
    const backupDir = await (0, backup_utils_js_1.getBackupDir)();
    const backups = await (0, backup_utils_js_1.getBackups)(backupDir);
    if (backups.length === 0) {
        console.log("No backups found.");
        return;
    }
    for (const backup of backups) {
        console.log(`${new Date(backup.mtime).toISOString()}  ${(backup.size / 1024).toFixed(2)} KB  ${backup.file}`);
    }
}
