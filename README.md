# Bitwarden Backup

Back up the personal Bitwarden vault and every shared vault available to
the authenticated user. Each vault is written as an encrypted JSON export with
a SHA-256 checksum.

## Requirements

- Node.js 20 or newer
- Bitwarden CLI (`bw`) installed and available on `PATH`
- A working OS credential store supported by [`keytar`](https://github.com/atom/node-keytar)
- A Bitwarden API key with access to the vaults to back up

Verify the Bitwarden CLI is available:

```bash
bw --version
```

## Build

Clone the project, install dependencies, and compile it:

```bash
npm install
npm run build
```

## Configure credentials

The application reads all credentials from the OS credential store. Do not put
these values in `config.yaml` or source code.

Store the Bitwarden API credentials under:

| Service | Account | Value |
|---|---|---|
| `BitwardenBackup` | `client_id` | Bitwarden API client ID |
| `BitwardenBackup` | `client_secret` | Bitwarden API client secret |
| `BitwardenBackup` | `file_pwd` | Password used to encrypt exported JSON files |

On Linux, use `secret-tool` to store each value:

```bash
secret-tool store --label="Bitwarden API client ID" \
  service BitwardenBackup credential client_id

secret-tool store --label="Bitwarden API client secret" \
  service BitwardenBackup credential client_secret

secret-tool store --label="Bitwarden export password" \
  service BitwardenBackup credential file_pwd
```

Each command prompts for its secret value. The export password is used to
encrypt the backup files and is not your Bitwarden login password.

Alternatively, run:

```bash
node dist/main.js set-password
```

This interactively stores or replaces only the `file_pwd` entry.

## Configure the backup location

Edit [`config.yaml`](./config.yaml):

```yaml
backupDir: /path/to/bitwarden-backups
retentionCount: 12
minimumBackupSize: 100000 (currently not used)
```

`backupDir` is created if it does not exist. Backups are written directly to
that directory, without an additional subdirectory.

## Run

From the project directory:

```bash
node dist/main.js backup
```

Other commands:

```bash
node dist/main.js list
node dist/main.js verify
node dist/main.js prune
node dist/main.js prune bw-personal-2026-10-31_16-00-00.json
```

The backup command authenticates with the Bitwarden API, unlocks the vault,
syncs it, and exports every accessible vault. Files are named using this
pattern:

```text
bw-<vault-name>-<timestamp>.json
```

Each JSON file has a matching `.sha256` checksum file. Retention is applied
after a successful backup.

## Linux package

Create a portable Linux application directory:

```bash
npm run package:linux
```

Run the packaged application:

```bash
./release/bitwarden-backup/bitwarden-backup backup
```

The package still requires Node.js, the `bw` CLI, and the OS credential store.
It can be moved to another directory or to your home directory. Update the
packaged `config.yaml` if the destination backup path differs.
