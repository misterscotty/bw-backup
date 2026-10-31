import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { Config } from "./types.js";

export async function loadConfig(): Promise<Config> {
    const yaml =
        await fs.readFile(
            "config.yaml",
            "utf8"
        );

    return YAML.parse(yaml) as Config;
}

export function expandHome(
    value: string
): string {

    if (
        value.startsWith("~/")
    ) {
        return path.join(
            os.homedir(),
            value.slice(2)
        );
    }

    return value;
}