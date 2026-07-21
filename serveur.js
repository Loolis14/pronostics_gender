import { spawn } from "node:child_process";
import { createReadStream, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export function startHttpServer(port = null) {
    let server;
    if (IS_PRODUCTION) {
        server = https.createServer({
            key: readFileSync("/etc/letsencrypt/live/auptitroliste.ddns.net/privkey.pem"),
            cert: readFileSync("/etc/letsencrypt/live/auptitroliste.ddns.net/fullchain.pem"),
        }, handleRequest);  
        port ??= 443;
    } else {
        server = http.createServer(handleRequest);
        port ??= 8080;
    }
    server.listen(port);
}

const MIME_TYPE_BY_EXT = Object.freeze({
    ".html": "text/html",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    __proto__: null,
});

function serveAssets(pathname, response) {
    const extension = path.extname(pathname);
    // Infer the MIME type (e.g., text/html) from the extension (e.g., .html).
    let mimeType = MIME_TYPE_BY_EXT[extension] || "application/octet-stream";
    if (mimeType.startsWith("text")) {
        mimeType += ";charset=utf-8";
    }
    response.setHeader("Content-Type", mimeType);

    // Try to read the file and pipe its contents directly into the reponse.
    const readStream = createReadStream(path.join(process.cwd(), pathname));
    readStream.on("error", (error) => {
        if (response.headersSent) {
            response.destroy();
            return;
        }
        if (error.code === "ENOENT") { // triggered if the file doesn't exist
            response.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
            response.end("404 Not Found");
        } else {
            response.writeHead(500, { "Content-Type": "text/plain;charset=utf-8" });
            response.end("500 Internal Server Error");
        }
        console.error(`Error reading ${pathname}:`, error.message);
    });
    readStream.pipe(response);
}

function getRouteName(method, url) {
    return `${method.toUpperCase()}:${url}`;
}

const routes = new Map();

export function route(method, url, callback) {
    const routeName = getRouteName(method, url);
    if (routes.has(routeName)) {
        throw new Error(`Duplicate route detected! '${routeName}'`);
    }
    routes.set(routeName, callback);
}

function handleRequest(request, response) {
    console.log((new Date()).toLocaleString("fr-BE"), request.url, request.method)
    if (!request.url) {
        return;
    }
    const rawPath = request.url.split("?")[0] ?? "";
    // resolve dot-segments (../) to prevent path traversal attacks
    const pathname = path.posix.normalize(rawPath);
    if (pathname.startsWith("/assets")) {
        serveAssets(pathname, response);
        return;
    }
    const routeName = getRouteName(request.method, pathname);
    if (routes.has(routeName)) {
        routes.get(routeName)(request, response);
        return;
    }
    // It is not an asset and it matches no routes: 404.
    response.writeHead(404, { "Content-Type": "text/html;charset=utf-8" });
    response.end("404 Not Found");
}

export function servePhpFile(pathname, response) {
    const phpProcess = spawn("php", [pathname]);
    phpProcess.stdout.pipe(response);
}
