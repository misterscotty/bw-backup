import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "../config.js";
import { computeSha256 } from "../checksum.js";
import {
    authenticateBw,
    listVaults,
    runBw,
    runBwInteractive
} from "../bitwarden.js";
import { getEncryptionPassword } from "../password.js";
import {
    deleteBackupSet,
    getBackupDir,
    getBackups
} from "../backup-utils.js";

function buildTimestamp(): string {

    const now = new Date();

    const yyyy =
        now.getFullYear();

    const mm =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const dd =
        String(
            now.getDate()
        ).padStart(2, "0");

    const hh =
        String(
            now.getHours()
        ).padStart(2, "0");

    const min =
        String(
            now.getMinutes()
        ).padStart(2, "0");

    const ss =
        String(
            now.getSeconds()
        ).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

function formatSizeInKb(
    sizeInBytes: number
): string {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
}

export async function runBackup(): Promise<void> {

    let logFile = "";

    try {

        const config =
            await loadConfig();

        const backupDir =
            await getBackupDir();

        await fs.mkdir(
            backupDir,
            {
                recursive: true
            }
        );

        const timestamp =
            buildTimestamp();

        logFile =
            path.join(
                backupDir,
                `bw-backup-${timestamp}.log`
            );

        const log = async (
            message = ""
        ): Promise<void> => {

            console.log(
                message
            );

            await fs.appendFile(
                logFile,
                `${message}\n`
            );
        };

        //
        // Header
        //

        await log(
            "======================================================"
        );

        await log(
            "Bitwarden Backup Started"
        );

        await log(
            "======================================================"
        );

        await log(
            `Timestamp: ${new Date().toISOString()}`
        );

        await log(
            `User: ${os.userInfo().username}`
        );

        await log(
            `Hostname: ${os.hostname()}`
        );

        await log(
            `Bitwarden CLI Version: ${await runBw(["--version"])}`
        );

        await log(
            `Backup Directory: ${backupDir}`
        );

        await log();

        //
        // Read Export Password
        //

        const exportPassword =
            await getEncryptionPassword();

        //
        // Unlock through the Bitwarden Desktop App
        //

        await log(
            "Authenticating with Bitwarden..."
        );

        await authenticateBw();

        await log(
            "Unlocking through the Bitwarden Desktop App..."
        );

        await log();

        const session =
            await runBwInteractive([
                "unlock",
                "--raw"
            ]);

        //
        // Sync
        //

        await log(
            "Syncing vault..."
        );

        await runBw([
            "sync",
            "--session",
            session
        ]);

        //
        // Export
        //

        await log(
            "Creating encrypted export..."
        );

        const vaults =
            await listVaults(
                session
            );

        const backupFiles: Array<{
            jsonFile: string;
            checksumFile: string;
            size: number;
        }> = [];

        for (const vault of vaults) {
            const safeVaultName =
                vault.name
                    .replace(/[^a-zA-Z0-9._-]+/g, "-")
                    .replace(/^-+|-+$/g, "") ||
                "unnamed-vault";

            const jsonFile =
                path.join(
                    backupDir,
                    `bw-${safeVaultName}-${timestamp}.json`
                );

            const checksumFile =
                `${jsonFile}.sha256`;

            await log(
                `Exporting vault: ${vault.name}`
            );

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
                exportArgs.push(
                    "--organizationid",
                    vault.organizationId
                );
            }

            await runBw(exportArgs);

            await log(
                `Validating ${path.basename(jsonFile)}...`
            );

            const stat =
                await fs.stat(
                    jsonFile
                );

            if (stat.size === 0) {
                throw new Error(
                    `Backup file is empty: ${jsonFile}`
                );
            }

            await log(
                `Backup size: ${formatSizeInKb(stat.size)}`
            );

            await log(
                "Generating SHA-256 checksum..."
            );

            const checksum =
                await computeSha256(
                    jsonFile
                );

            await fs.writeFile(
                checksumFile,
                `${checksum}  ${path.basename(jsonFile)}\n`
            );

            await log(
                `SHA-256: ${checksum}`
            );

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

        await log(
            `Applying retention policy (${config.retentionCount} backups)...`
        );

        const backups =
            await getBackups(
                backupDir
            );

        if (
            backups.length >
            config.retentionCount
        ) {

            const backupsToDelete =
                backups.slice(
                    config.retentionCount
                );

            for (
                const backup
                of backupsToDelete
            ) {

                await log(
                    `Removing old backup set: ${path.basename(backup.file)}`
                );

                await deleteBackupSet(
                    backup.file
                );

            }

        } else {

            await log(
                "Retention policy: no pruning required."
            );

        }

        //
        // Success
        //

        await log();

        await log(
            "======================================================"
        );

        await log(
            "Backup Successful"
        );

        await log(
            "======================================================"
        );

        await log();

        await log(
            `Log File: ${logFile}`
        );

        for (const backup of backupFiles) {
            await log(
                `Backup File: ${backup.jsonFile}`
            );
            await log(
                `Checksum File: ${backup.checksumFile}`
            );
            await log(
                `File Size: ${formatSizeInKb(backup.size)}`
            );
        }

        await log();

    } catch (error) {

        if (logFile) {

            try {

                await fs.appendFile(
                    logFile,
                    `ERROR: ${
                        error instanceof Error
                            ? error.message
                            : String(error)
                    }\n`
                );

            } catch {
                // Ignore logging failures
            }

        }

        throw error;
    }

}