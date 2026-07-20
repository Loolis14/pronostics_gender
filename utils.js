import { read, readFileSync, writeFileSync } from "node:fs";

export function getCookies(request) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
        return {};
    }

    return Object.fromEntries(
        cookieHeader.split(";").map(cookie => {
            const [key, value] = cookie.trim().split("=");
            return [key, value];
        })
    );
}


const tokensFile = "tokens.json";

export function isTokenUsed(token) {
    const tokens = JSON.parse(readFileSync(tokensFile, "utf-8"));

    if ( token in tokens) {
        return tokens[token]["used"]
    } else {
        return null;
    }
}


export function tokenConsumed(token, name) {
    const tokens = JSON.parse(readFileSync(tokensFile, "utf-8"));

    tokens[token].used = true;
    tokens[token].name = name;

    writeFileSync(
        tokensFile,
        JSON.stringify(tokens, null, 4),
        "utf-8"
    );
}
