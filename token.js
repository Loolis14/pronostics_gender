import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCookies } from "./utils.js";

const TOKEN_PATH = "./tokens.json";
const tokens = loadTokens();

function loadTokens() {
    try {
        return JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("tokens.json is not a valid JSON.");
        }
        if (error.code === "ENOENT") {
            throw new Error("Missing tokens.json");
        }
        throw error;
    }
}

async function saveTokens() {
    try {
        await atomicWrite(TOKEN_PATH, JSON.stringify(tokens, null, 4));
    } catch (error) {
        console.error("Error saving tokens:", error);
    }
}

async function atomicWrite(filePath, data, options = {}) {
    const tmpFilename = `.tmp-${randomBytes(4).toString("hex")}`;
    const tmpPath = path.join(path.resolve(filePath, ".."), tmpFilename);
    try {
        await writeFile(tmpPath, data, { ...options, flush: true });
        await rename(tmpPath, filePath);
    } catch (error) {
        await unlink(tmpPath).catch(() => {});
        throw error;
    }
}

export function isValidToken(token) {
    if (!token) {
        return false;
    }
    return Object.hasOwn(tokens, token);
}

export function isTokenUsed(token) {
    if (!isValidToken(token)) {
        throw new Error("Invalid token.");
    }
    return tokens[token].used;
}

export function getToken(request) {
    const queryString = request.url.split("?")[1] || "";
    const searchParams = new URLSearchParams(queryString);
    // 1. token from searchParams has priority if it is valid
    let token = searchParams.get("token");
    if (isValidToken(token)) {
        return token;
    }
    // 2. try to retrieve token from cookies
    token = getCookies(request).token;
    if (isValidToken(token)) {
        return token;    
    }
    return null;
}

export function markTokenAsUsed(token, username) {
    if (!isValidToken(token)) {
        throw new Error("Invalid token.");
    }
    tokens[token].used = true;
    tokens[token].name = username;
}

export function withToken(handler) {
    return (request, response) => {
        const token = getToken(request);
        if (!isValidToken(token)) {
            response.writeHead(401, { "Content-Type": "text/plain" });
            response.end("401 Unauthorized");
            return;
        }
        const currentToken = getCookies(request).token;
        const cleanUrl = request.url.split("?")[0];
        if (token !== currentToken || request.url !== cleanUrl) {
            if (token !== currentToken) {
                response.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/`);
            }
            response.writeHead(302, { "Location": cleanUrl });
            response.end();
            return;
        }
        handler(request, response);
        return;
    };
}

setInterval(saveTokens, 10 * 1000);
