import fs from "node:fs/promises";
import path from "node:path";

import { loadConfig } from "./config.js";
import { BackupInfo } from "./types.js";

export async function getBackupDir(): Promise<string> {

    const config =
        await loadConfig();

    return config.backupDir;
}

export async function getBackups(
    backupDir: string
): Promise<BackupInfo[]> {

    const files =
        await fs.readdir(
            backupDir
        );

    const jsonFiles =
        files.filter(
            f => f.endsWith(".json")
        );

    const backups =
        await Promise.all(
            jsonFiles.map(
                async file => {

                    const full =
                        path.join(
                            backupDir,
                            file
                        );

                    const stat =
                        await fs.stat(
                            full
                        );

                    return {
                        file: full,
                        mtime:
                            stat.mtimeMs,
                        size:
                            stat.size
                    };
                }
            )
        );

    backups.sort(
        (a, b) =>
            b.mtime -
            a.mtime
    );

    return backups;
}

export async function deleteBackupSet(
    jsonFile: string
): Promise<void> {

    await fs.rm(
        jsonFile,
        { force: true }
    );

    await fs.rm(
        `${jsonFile}.sha256`,
        { force: true }
    );

    await fs.rm(
        jsonFile.replace(
            ".json",
            ".log"
        ),
        { force: true }
    );
}