import { getBackupDir, getBackups }
from "../backup-utils.js";

export async function runList()
: Promise<void> {

    const backupDir =
        await getBackupDir();

    const backups =
        await getBackups(
            backupDir
        );

    if (
        backups.length === 0
    ) {
        console.log(
            "No backups found."
        );
        return;
    }

    for (const backup of backups) {

        console.log(
            `${new Date(
                backup.mtime
            ).toISOString()}  ${(backup.size / 1024).toFixed(2)} KB  ${backup.file}`
        );

    }
}