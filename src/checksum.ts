import fs from "node:fs/promises";
import { createHash } from "node:crypto";

export async function computeSha256(
    file: string
): Promise<string> {

    const data =
        await fs.readFile(file);

    return createHash("sha256")
        .update(data)
        .digest("hex");
}