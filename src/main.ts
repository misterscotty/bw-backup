import { runBackup }
from "./commands/backup-command.js";

import { runVerify }
from "./commands/verify-command.js";

import { runList }
from "./commands/list-command.js";

import { runPrune }
from "./commands/prune-command.js";

import { runSetPassword }
from "./commands/password-command.js";

async function main()
: Promise<void> {

    const command =
        process.argv[2] ??
        "backup";

    switch (command) {

        case "backup":
            await runBackup();
            break;

        case "verify":
            await runVerify();
            break;

        case "list":
            await runList();
            break;

        case "prune":
            await runPrune(
                process.argv[3]
            );
            break;

        case "set-password":
            await runSetPassword();
            break;

        default:

            console.error(`
Usage:

  bitwarden-backup backup

  bitwarden-backup verify

  bitwarden-backup list

  bitwarden-backup prune

  bitwarden-backup prune bitwarden-2026-09-30_18-00-00.json

  bitwarden-backup set-password
`);

            process.exit(1);
    }
}

main().catch(
    error => {

        console.error(
            error
        );

        process.exit(1);

    }
);