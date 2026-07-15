import { readFileSync } from "node:fs";

const tokensFile = "tokens.json";

export function isTokenUsed(token) {
    const tokens = JSON.parse(readFileSync(tokensFile, "utf-8"));

    if ( token in tokens) {
        return tokens[token]["used"]
    } else {
        return null;
    }
}