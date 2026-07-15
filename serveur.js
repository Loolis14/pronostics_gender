import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { isTokenUsed } from "./isTokenUsed.js";
import { tokenConsumed } from "./tokenConsumed.js";

const server = createServer(handleRequest);
const mainPage = readFileSync("welcome_page.html", "utf-8");
const mainPageStyle = readFileSync("assets/welcome_page.css", "utf-8");
const mainPageBanniere = readFileSync("images/boy_or_girl.png");
const formulairePage = readFileSync("formulaire.html", "utf-8");
const banniereProno = readFileSync("images/pronostics.png");
const formulaireStyle = readFileSync("assets/formulaire.css", "utf-8");
const statisticsPage = readFileSync("statistics.php", "utf-8");
const statisticsStyle = readFileSync("assets/statistics.css", "utf-8");
const statisticsBoy= readFileSync("images/boy.png");
const statisticsGirl= readFileSync("images/girl.png");


function handleRequest(request, response) {
    if (!request.url) {
        return;
    }
    const baseUrl = `http://${request.headers.host}`;
    const reqUrl = new URL(request.url, baseUrl);
    console.log(reqUrl.pathname)

    if (reqUrl.pathname === "/") {
        const token = reqUrl.searchParams.get("token");
        const used = isTokenUsed(token);
        if ( used == null ) {
            response.writeHead(404, { "Content-Type": "text/html;charset=utf-8" });
            response.end("Token not valid");
            return;
        } if ( used ) {
            response.writeHead(302, { "Location": "/statistics"});
            response.end();
            return;
        }
        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.write(mainPage);
        response.end();
    } else if (reqUrl.pathname === "/assets/welcome_page.css") {
        response.writeHead(200, { "Content-Type": "text/css;charset=utf-8" });
        response.write(mainPageStyle);
        response.end();
    } else if (reqUrl.pathname === "/images/boy_or_girl.png") {
        response.writeHead(200, { "Content-Type": "image/png" });
        response.write(mainPageBanniere);
        response.end();
    } else if (reqUrl.pathname === "/assets/formulaire.css") {
        response.writeHead(200, { "Content-Type": "image/jpg" });
        response.write(formulaireStyle);
        response.end();
    } else if (reqUrl.pathname === "/images/pronostics.png") {
        response.writeHead(200, { "Content-Type": "image/png" });
        response.write(banniereProno);
        response.end();
    } else if (reqUrl.pathname === "/formulaire" && request.method === "GET") {
        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.write(formulairePage);
        response.end();
    } else if (reqUrl.pathname === "/statistics") {
        response.setHeader("Content-Type", "text/html;charset=utf-8");
        servePhpFile("statistics.php", response)
    } else if (reqUrl.pathname === "/assets/statistics.css") {
        response.writeHead(200, { "Content-Type": "text/css;charset=utf-8" });
        response.write(statisticsStyle);
        response.end();
    } else if (reqUrl.pathname === "/images/girl.png") {
        response.writeHead(200, { "Content-Type": "image/png" });
        response.write(statisticsGirl);
        response.end();
    } else if (reqUrl.pathname === "/images/boy.png") {
        response.writeHead(200, { "Content-Type": "image/png" });
        response.write(statisticsBoy);
        response.end();
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
            tokenConsumed(token, donnees.name);
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