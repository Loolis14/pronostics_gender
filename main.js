import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCookies, isTokenUsed, tokenConsumed } from "./utils.js";
import { route, servePhpFile, startHttpServer } from "./serveur.js";

const mainPage = readFileSync("welcome_page.html", "utf-8");
const formulairePage = readFileSync("formulaire.html", "utf-8");

startHttpServer(8080);

route("GET", "/", (request, response) => {
    const cookies = getCookies(request);
    const queryString = request.url.split("?")[1] || "";
    const searchParams = new URLSearchParams(queryString);
    const token = searchParams.get("token");
    const used = isTokenUsed(token);
    if ( used === null && !cookies.token ) {
        response.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
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
    const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024; // 1 MB limit
    if ( isTokenUsed(getCookies(request)["token"]) == true ) {
        response.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
        response.end("Tu ne peux voter qu'une fois.\n http://auptitroliste.ddns.net/welcome pour retourner a l'accueil");
        return;
    }
    request.setEncoding("utf-8");
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
            const cookie = getCookies(request);
            tokenConsumed(cookie.token, donnees.name);
        } catch (error) {
            console.error("Erreur lors de la création du fichier.");
            response.writeHead(500, { "Content-Type": "text/html;charset=utf-8" });
            response.end("Une erreur interne est survenue lors de la sauvegarde.");
        }
    });
});
