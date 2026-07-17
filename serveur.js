import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, writeFileSync, createReadStream } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { isTokenUsed } from "./isTokenUsed.js";
import { tokenConsumed } from "./tokenConsumed.js";
import { getCookies } from "./getCookies.js";

const server = createServer(handleRequest);
const mainPage = readFileSync("welcome_page.html", "utf-8");
const formulairePage = readFileSync("formulaire.html", "utf-8");
const statisticsPage = readFileSync("statistics.php", "utf-8");

const MIME_TYPE_BY_EXT = Object.freeze({
    ".html": "text/html",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
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
    readStream.pipe(response);
    readStream.on("error", (error) => {
        if (error.code === "ENOENT") { // triggered if the file doesn't exist
            response.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
            response.end("404 Not Found");
        } else {
            response.writeHead(500, { "Content-Type": "text/plain;charset=utf-8" });
            response.end("500 Internal Server Error");
        }
        console.error(`Error reading ${pathname}:`, error.message);
    });
}

function handleRequest(request, response) {
    if (!request.url) {
        return;
    }
    const baseUrl = `http://${request.headers.host}`;
    const reqUrl = new URL(request.url, baseUrl);
    if (reqUrl.pathname.startsWith("/assets")) {
        serveAssets(reqUrl.pathname, response);
        return;
    }
    console.log(reqUrl.pathname)

    if (reqUrl.pathname === "/") {
        const cookies = getCookies(request);
        const token = reqUrl.searchParams.get("token");
        const used = isTokenUsed(token);
        if ( used === null && !cookies.token ) {
            response.writeHead(404, { "Content-Type": "text/html;charset=utf-8" });
            response.end("Le token n'est pas valide.");
            return;
        } if ( used ) {
            response.writeHead(302, { "Location": "/statistics"});
            response.end();
            return;
        }
        if ( !cookies.token ) {
            response.setHeader("Set-Cookie", `token=${token}; Path=/; HttpOnly`);
            response.writeHead(303, {"Location": "/welcome" });
            response.end();
        } else {
            response.writeHead(303, {"Location": "/welcome" });
            response.end();
        }
    } else if (reqUrl.pathname === "/welcome") {
        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.write(mainPage);
        response.end();
    } else if (reqUrl.pathname === "/formulaire" && request.method === "GET") {
        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.write(formulairePage);
        response.end();
    } else if (reqUrl.pathname === "/statistics") {
        response.setHeader("Content-Type", "text/html;charset=utf-8");
        servePhpFile("statistics.php", response)
    } else if (request.method === 'POST') {
        let corpsFormulary = "";
        request.on("data", (chunk) => {
            corpsFormulary += chunk.toString();
        });

        request.on("end", () => {
            const donnees = Object.fromEntries(new URLSearchParams(corpsFormulary));
            const dirName = "participants";
            const fileName = `${donnees.name}.json`
            const pathName = path.join(dirName, fileName)
            try {
                const donneesJson = JSON.stringify(donnees, null, 4);
                writeFileSync(pathName, donneesJson, "utf-8");
                console.log(`Fichier creer avec succes`);
                response.writeHead(303, {"Location": "/statistics" });
                response.end();
            } catch (error) {
                console.error("Erreur lors de la création du fichier.");
                response.writeHead(500, { "Content-Type": "text/html;charset=utf-8" });
                response.end("Une erreur interne est survenue lors de la sauvegarde.");
            }
            const cookie = getCookies(request);
            tokenConsumed(cookie.token, donnees.name);
        });
    } else {
        response.writeHead(404, { "Content-Type": "text/html;charset=utf-8" });
        response.end("404 Not Found");
    }
    console.log(request.url);
    console.log(request.method);
}

function servePhpFile(pathname, response) {
    const phpProcess = spawn("php", [pathname]);
    phpProcess.stdout.pipe(response);
}

server.listen(8080);