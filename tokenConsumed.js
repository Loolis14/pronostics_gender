import { read, readFileSync, writeFileSync } from "node:fs";

const tokensFile = "tokens.json";

export function tokenConsumed(token, name) {
    const tokens = JSON.parse(readFileSync(tokensFile, "utf-8"));

    tokens[token].used = true;
    tokens[tokens].name = name;

    writeFileSync(
        tokensFile,
        JSON.stringify(token, null, 4),
        "utf-8"
    );
}