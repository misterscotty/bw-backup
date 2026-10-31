import { execFile } from "node:child_process";
import { spawn } from "node:child_process";
import { promisify } from "node:util";
import keytar from "keytar";

const execFileAsync =
    promisify(execFile);

const KEYTAR_SERVICE =
    "BitwardenBackup";

export interface BitwardenVault {
    name: string;
    organizationId?: string;
}

async function getApiCredentials(): Promise<{
    clientId: string;
    clientSecret: string;
}> {
    const clientId =
        await keytar.getPassword(
            KEYTAR_SERVICE,
            "client_id"
        );

    const clientSecret =
        await keytar.getPassword(
            KEYTAR_SERVICE,
            "client_secret"
        );

    if (!clientId || !clientSecret) {
        throw new Error(
            "Bitwarden API credentials are not stored in the OS credential store."
        );
    }

    return {
        clientId,
        clientSecret
    };
}

export async function authenticateBw(): Promise<void> {
    const {
        clientId,
        clientSecret
    } = await getApiCredentials();

    try {
        await execFileAsync(
            "bw",
            [
                "login",
                "--apikey"
            ],
            {
                env: {
                    ...process.env,
                    BW_CLIENTID: clientId,
                    BW_CLIENTSECRET: clientSecret
                }
            }
        );
    } catch (error) {
        if (
            error &&
            typeof error === "object" &&
            "stderr" in error &&
            typeof error.stderr === "string" &&
            error.stderr.includes("You are already logged in as")
        ) {
            return;
        }

        throw error;
    }
}

export async function runBw(
    args: string[]
): Promise<string> {

    const result =
        await execFileAsync(
            "bw",
            args
        );

    return result.stdout.trim();
}

export async function listVaults(
    session: string
): Promise<BitwardenVault[]> {
    const organizations =
        JSON.parse(
            await runBw([
                "list",
                "organizations",
                "--session",
                session
            ])
        ) as Array<{
            id?: unknown;
            name?: unknown;
        }>;

    if (!Array.isArray(organizations)) {
        throw new Error(
            "Bitwarden returned an invalid organizations response."
        );
    }

    const vaults: BitwardenVault[] = [
        {
            name: "personal"
        }
    ];

    for (const organization of organizations) {
        if (
            typeof organization.id !== "string" ||
            typeof organization.name !== "string" ||
            !organization.id ||
            !organization.name
        ) {
            throw new Error(
                "Bitwarden returned an organization without a valid id or name."
            );
        }

        vaults.push({
            name: organization.name,
            organizationId: organization.id
        });
    }

    return vaults;
}

export async function runBwInteractive(
    args: string[]
): Promise<string> {
    return new Promise(
        (resolve, reject) => {
            const child =
                spawn(
                    "bw",
                    args,
                    {
                        stdio: [
                            "inherit",
                            "pipe",
                            "inherit"
                        ]
                    }
                );

            let stdout = "";

            child.stdout.on(
                "data",
                chunk => {
                    stdout += chunk.toString();
                }
            );

            child.on(
                "error",
                reject
            );

            child.on(
                "close",
                code => {
                    if (code === 0) {
                        resolve(stdout.trim());
                        return;
                    }

                    reject(
                        new Error(
                            `bw ${args.join(" ")} exited with code ${code}`
                        )
                    );
                }
            );
        }
    );
}