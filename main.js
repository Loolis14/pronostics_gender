import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCookies } from "./getCookies.js";
import { isTokenUsed } from "./isTokenUsed.js";
import { route, servePhpFile, startHttpServer } from "./serveur.js";
import { tokenConsumed } from "./tokenConsumed.js";

const mainPage = readFileSync("welcome_page.html", "utf-8");
const formulairePage = readFileSync("formulaire.html", "utf-8");

startHttpServer(8080);

route("GET", "/", (request, response) => {
    const cookies = getCookies(request);
    const baseUrl = `http://${request.headers.host}`;
    const reqUrl = new URL(request.url, baseUrl);
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
});

route("GET", "/welcome", (_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    response.write(mainPage);
    response.end();
});

route("GET", "/formulaire", (_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    response.write(formulairePage);
    response.end();
});

route("GET", "/statistics", (_request, response) => {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    servePhpFile("statistics.php", response);
});

route("POST", "/formulaire", (request, response) => {
    let corpsFormulary = "";
    request.on("data", (chunk) => {
        corpsFormulary += chunk.toString();
    });
    request.on("end", () => {
        const donnees = Object.fromEntries(new URLSearchParams(corpsFormulary));
        const dirName = "participants";
        const fileName = `${donnees.name}.json`
        const pathName = path.join(dirName, fileName)
        // ensures the "/participants" directory exists (i.e. creates it if it doesn't)
        mkdirSync(dirName, { recursive: true });
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
});
