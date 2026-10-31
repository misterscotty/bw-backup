import path from "node:path";

import {
    deleteBackupSet,
    getBackupDir,
    getBackups
}
from "../backup-utils.js";

import { loadConfig }
from "../config.js";

export async function runPrune(
    backupName?: string
): Promise<void> {

    const config =
        await loadConfig();

    const backupDir =
        await getBackupDir();

    const backups =
        await getBackups(
            backupDir
        );

    //
    // Explicit delete
    //

    if (backupName) {

        const target =
            backups.find(
                backup =>
                    path.basename(
                        backup.file
                    ) === backupName
            );

        if (!target) {

            console.error(
                `Backup not found: ${backupName}`
            );

            process.exit(1);
        }

        await deleteBackupSet(
            target.file
        );

        console.log(
            `Removed backup set: ${backupName}`
        );

        return;
    }

    //
    // Retention mode
    //

    if (
        backups.length <=
        config.retentionCount
    ) {

        console.log(
            "No pruning required."
        );

        return;
    }

    const oldest =
        backups[
            backups.length - 1
        ];

    await deleteBackupSet(
        oldest.file
    );

    console.log(
        `Removed oldest backup: ${path.basename(oldest.file)}`
    );
}