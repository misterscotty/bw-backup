export interface Config {
    backupDir: string;
    retentionCount: number;
    minimumBackupSize: number;
}

export interface BackupInfo {
    file: string;
    mtime: number;
    size: number;
}