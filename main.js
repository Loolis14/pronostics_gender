import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCookies } from "./utils.js";
import { route, servePhpFile, startHttpServer } from "./serveur.js";
import { getToken, isTokenUsed, isValidToken, markTokenAsUsed, withToken } from "./token.js";

const mainPage = readFileSync("welcome_page.html", "utf-8");
const formulairePage = readFileSync("formulaire.html", "utf-8");

startHttpServer();

route("GET", "/", withToken((request, response) => {
    const token = getToken(request);
    if (!isValidToken(token)) {
        response.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
        response.end("Le token n'est pas valide.");
        return;
    }
    if (isTokenUsed(token)) {
        response.writeHead(302, { "Location": "/statistics"});
        response.end();
        return;
    }
    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    response.write(mainPage);
    response.end();
}));

route("GET", "/formulaire", withToken((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    response.write(formulairePage);
    response.end();
}));

route("GET", "/statistics", withToken((_request, response) => {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    servePhpFile("statistics.php", response);
}));

route("POST", "/formulaire", (request, response) => {
    const token = getToken(request);
    if (!isValidToken(token)) {
        response.writeHead(401, { "Content-Type": "text/plain;charset=utf-8" });
        response.end("401 Unauthorized");
        return;
    } 
    if (isTokenUsed(token)) {
        response.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
        response.end("Tu ne peux voter qu'une fois.\nhttp://auptitroliste.ddns.net/ pour retourner aux stats");
        return;
    }
    request.setEncoding("utf-8");
    const MAX_PAYLOAD_SIZE = 2 * 1024; // 2 kB limit
    let corpsFormulary = "";
    request.on("data", (chunk) => {
        corpsFormulary += chunk;
        // Prevent memory exhaustion attacks
        if (corpsFormulary.length > MAX_PAYLOAD_SIZE) {
            request.destroy();
            return;
        }
    });
    request.on("end", () => {
        if (request.destroyed) {
            return;
        }
        const donnees = Object.fromEntries(new URLSearchParams(corpsFormulary));
        const dirName = "participants";
        const fileName = `${randomUUID()}.json`
        const pathName = path.join(dirName, fileName)
        // ensures the "/participants" directory exists (i.e. creates it if it doesn't)
        mkdirSync(dirName, { recursive: true });
        try {
            const donneesJson = JSON.stringify(donnees, null, 4);
            writeFileSync(pathName, donneesJson, "utf-8");
            console.log(`Fichier creer avec succes`);
            response.writeHead(303, {"Location": "/statistics" });
            response.end();
            markTokenAsUsed(token, donnees.name);
        } catch (error) {
            console.error("Erreur lors de la création du fichier.");
            response.writeHead(500, { "Content-Type": "text/html;charset=utf-8" });
            response.end("Une erreur interne est survenue lors de la sauvegarde.");
        }
    });
});
