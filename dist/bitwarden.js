"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateBw = authenticateBw;
exports.runBw = runBw;
exports.listVaults = listVaults;
exports.runBwInteractive = runBwInteractive;
const node_child_process_1 = require("node:child_process");
const node_child_process_2 = require("node:child_process");
const node_util_1 = require("node:util");
const keytar_1 = __importDefault(require("keytar"));
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const KEYTAR_SERVICE = "BitwardenBackup";
async function getApiCredentials() {
    const clientId = await keytar_1.default.getPassword(KEYTAR_SERVICE, "client_id");
    const clientSecret = await keytar_1.default.getPassword(KEYTAR_SERVICE, "client_secret");
    if (!clientId || !clientSecret) {
        throw new Error("Bitwarden API credentials are not stored in the OS credential store.");
    }
    return {
        clientId,
        clientSecret
    };
}
async function authenticateBw() {
    const { clientId, clientSecret } = await getApiCredentials();
    try {
        await execFileAsync("bw", [
            "login",
            "--apikey"
        ], {
            env: {
                ...process.env,
                BW_CLIENTID: clientId,
                BW_CLIENTSECRET: clientSecret
            }
        });
    }
    catch (error) {
        if (error &&
            typeof error === "object" &&
            "stderr" in error &&
            typeof error.stderr === "string" &&
            error.stderr.includes("You are already logged in as")) {
            return;
        }
        throw error;
    }
}
async function runBw(args) {
    const result = await execFileAsync("bw", args);
    return result.stdout.trim();
}
async function listVaults(session) {
    const organizations = JSON.parse(await runBw([
        "list",
        "organizations",
        "--session",
        session
    ]));
    if (!Array.isArray(organizations)) {
        throw new Error("Bitwarden returned an invalid organizations response.");
    }
    const vaults = [
        {
            name: "personal"
        }
    ];
    for (const organization of organizations) {
        if (typeof organization.id !== "string" ||
            typeof organization.name !== "string" ||
            !organization.id ||
            !organization.name) {
            throw new Error("Bitwarden returned an organization without a valid id or name.");
        }
        vaults.push({
            name: organization.name,
            organizationId: organization.id
        });
    }
    return vaults;
}
async function runBwInteractive(args) {
    return new Promise((resolve, reject) => {
        const child = (0, node_child_process_2.spawn)("bw", args, {
            stdio: [
                "inherit",
                "pipe",
                "inherit"
            ]
        });
        let stdout = "";
        child.stdout.on("data", chunk => {
            stdout += chunk.toString();
        });
        child.on("error", reject);
        child.on("close", code => {
            if (code === 0) {
                resolve(stdout.trim());
                return;
            }
            reject(new Error(`bw ${args.join(" ")} exited with code ${code}`));
        });
    });
}
