"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBackup = runBackup;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const config_js_1 = require("../config.js");
const checksum_js_1 = require("../checksum.js");
const bitwarden_js_1 = require("../bitwarden.js");
const password_js_1 = require("../password.js");
const backup_utils_js_1 = require("../backup-utils.js");
function buildTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}
function formatSizeInKb(sizeInBytes) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
}
async function runBackup() {
    let logFile = "";
    try {
        const config = await (0, config_js_1.loadConfig)();
        const backupDir = await (0, backup_utils_js_1.getBackupDir)();
        await promises_1.default.mkdir(backupDir, {
            recursive: true
        });
        const timestamp = buildTimestamp();
        logFile =
            node_path_1.default.join(backupDir, `bw-backup-${timestamp}.log`);
        const log = async (message = "") => {
            console.log(message);
            await promises_1.default.appendFile(logFile, `${message}\n`);
        };
        //
        // Header
        //
        await log("======================================================");
        await log("Bitwarden Backup Started");
        await log("======================================================");
        await log(`Timestamp: ${new Date().toISOString()}`);
        await log(`User: ${node_os_1.default.userInfo().username}`);
        await log(`Hostname: ${node_os_1.default.hostname()}`);
        await log(`Bitwarden CLI Version: ${await (0, bitwarden_js_1.runBw)(["--version"])}`);
        await log(`Backup Directory: ${backupDir}`);
        await log();
        //
        // Read Export Password
        //
        const exportPassword = await (0, password_js_1.getEncryptionPassword)();
        //
        // Unlock through the Bitwarden Desktop App
        //
        await log("Authenticating with Bitwarden...");
        await (0, bitwarden_js_1.authenticateBw)();
        await log("Unlocking through the Bitwarden Desktop App...");
        await log();
        const session = await (0, bitwarden_js_1.runBwInteractive)([
            "unlock",
            "--raw"
        ]);
        //
        // Sync
        //
        await log("Syncing vault...");
        await (0, bitwarden_js_1.runBw)([
            "sync",
            "--session",
            session
        ]);
        //
        // Export
        //
        await log("Creating encrypted export...");
        const vaults = await (0, bitwarden_js_1.listVaults)(session);
        const backupFiles = [];
        for (const vault of vaults) {
            const safeVaultName = vault.name
                .replace(/[^a-zA-Z0-9._-]+/g, "-")
                .replace(/^-+|-+$/g, "") ||
                "unnamed-vault";
            const jsonFile = node_path_1.default.join(backupDir, `bw-${safeVaultName}-${timestamp}.json`);
            const checksumFile = `${jsonFile}.sha256`;
            await log(`Exporting vault: ${vault.name}`);
            const exportArgs = [
                "export",
                "--format",
                "encrypted_json",
                "--password",
                exportPassword,
                "--output",
                jsonFile,
                "--session",
                session
            ];
            if (vault.organizationId) {
                exportArgs.push("--organizationid", vault.organizationId);
            }
            await (0, bitwarden_js_1.runBw)(exportArgs);
            await log(`Validating ${node_path_1.default.basename(jsonFile)}...`);
            const stat = await promises_1.default.stat(jsonFile);
            if (stat.size === 0) {
                throw new Error(`Backup file is empty: ${jsonFile}`);
            }
            await log(`Backup size: ${formatSizeInKb(stat.size)}`);
            await log("Generating SHA-256 checksum...");
            const checksum = await (0, checksum_js_1.computeSha256)(jsonFile);
            await promises_1.default.writeFile(checksumFile, `${checksum}  ${node_path_1.default.basename(jsonFile)}\n`);
            await log(`SHA-256: ${checksum}`);
            backupFiles.push({
                jsonFile,
                checksumFile,
                size: stat.size
            });
        }
        //
        // Retention
        // Only executes after successful validation
        //
        await log();
        await log(`Applying retention policy (${config.retentionCount} backups)...`);
        const backups = await (0, backup_utils_js_1.getBackups)(backupDir);
        if (backups.length >
            config.retentionCount) {
            const backupsToDelete = backups.slice(config.retentionCount);
            for (const backup of backupsToDelete) {
                await log(`Removing old backup set: ${node_path_1.default.basename(backup.file)}`);
                await (0, backup_utils_js_1.deleteBackupSet)(backup.file);
            }
        }
        else {
            await log("Retention policy: no pruning required.");
        }
        //
        // Success
        //
        await log();
        await log("======================================================");
        await log("Backup Successful");
        await log("======================================================");
        await log();
        await log(`Log File: ${logFile}`);
        for (const backup of backupFiles) {
            await log(`Backup File: ${backup.jsonFile}`);
            await log(`Checksum File: ${backup.checksumFile}`);
            await log(`File Size: ${formatSizeInKb(backup.size)}`);
        }
        await log();
    }
    catch (error) {
        if (logFile) {
            try {
                await promises_1.default.appendFile(logFile, `ERROR: ${error instanceof Error
                    ? error.message
                    : String(error)}\n`);
            }
            catch {
                // Ignore logging failures
            }
        }
        throw error;
    }
}
