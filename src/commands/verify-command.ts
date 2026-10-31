import fs from "node:fs/promises";
import path from "node:path";

import { getBackupDir }
from "../backup-utils.js";

import { computeSha256 }
from "../checksum.js";

export async function runVerify()
: Promise<void> {

    const backupDir =
        await getBackupDir();

    const files =
        await fs.readdir(
            backupDir
        );

    const backups =
        files.filter(
            f => f.endsWith(".json")
        );

    for (const backup of backups) {

        const fullPath =
            path.join(
                backupDir,
                backup
            );

        const checksumFile =
            `${fullPath}.sha256`;

        const logFile =
            fullPath.replace(
                ".json",
                ".log"
            );

        try {

            await fs.access(
                checksumFile
            );

            await fs.access(
                logFile
            );

            const expected =
                (
                    await fs.readFile(
                        checksumFile,
                        "utf8"
                    )
                )
                .split(/\s+/)[0];

            const actual =
                await computeSha256(
                    fullPath
                );

            if (
                expected === actual
            ) {

                console.log(
                    `✓ ${backup}`
                );

            } else {

                console.log(
                    `✗ ${backup} checksum mismatch`
                );

            }

        } catch {

            console.log(
                `✗ ${backup} incomplete backup set`
            );

        }
    }
}