"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backup_command_js_1 = require("./commands/backup-command.js");
const verify_command_js_1 = require("./commands/verify-command.js");
const list_command_js_1 = require("./commands/list-command.js");
const prune_command_js_1 = require("./commands/prune-command.js");
const password_command_js_1 = require("./commands/password-command.js");
async function main() {
    const command = process.argv[2] ??
        "backup";
    switch (command) {
        case "backup":
            await (0, backup_command_js_1.runBackup)();
            break;
        case "verify":
            await (0, verify_command_js_1.runVerify)();
            break;
        case "list":
            await (0, list_command_js_1.runList)();
            break;
        case "prune":
            await (0, prune_command_js_1.runPrune)(process.argv[3]);
            break;
        case "set-password":
            await (0, password_command_js_1.runSetPassword)();
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
main().catch(error => {
    console.error(error);
    process.exit(1);
});
