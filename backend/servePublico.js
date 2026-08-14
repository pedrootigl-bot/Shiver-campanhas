const fs = require("fs");
const path = require("path");
const express = require("express");

function pastaExiste(caminho) {
    try {
        return fs.existsSync(caminho) && fs.statSync(caminho).isDirectory();
    } catch {
        return false;
    }
}

function arquivoExiste(caminho) {
    try {
        return fs.existsSync(caminho) && fs.statSync(caminho).isFile();
    } catch {
        return false;
    }
}

function caminhosDoSite() {
    const raiz = path.join(__dirname, "..");

    return {
        hubDist: path.join(raiz, "partner-hub", "dist"),
        adminDir: path.join(raiz, "frontend", "admin"),
        cssDir: path.join(raiz, "frontend", "css"),
        imagesDir: path.join(raiz, "frontend", "images")
    };
}

function hubPronto(hubDist) {
    return arquivoExiste(path.join(hubDist, "index.html"));
}

/**
 * Partner Hub (build), admin e CSS estáticos no mesmo processo da API.
 * Só ativa se partner-hub/dist/index.html existir.
 */
function servirSitePublico(app) {
    const { hubDist, adminDir, cssDir, imagesDir } = caminhosDoSite();

    if (!hubPronto(hubDist)) {
        console.log(
            "[SITE] partner-hub/dist ausente — API só. "
            + "Em produção, rode o build do Partner Hub."
        );
        return false;
    }

    if (pastaExiste(adminDir)) {
        app.get(["/admin", "/admin/"], (_req, res) => {
            res.redirect(302, "/admin/login.html");
        });
        app.use(
            "/admin",
            express.static(adminDir, {
                index: false,
                redirect: false
            })
        );
    }

    if (pastaExiste(cssDir)) {
        app.use(
            "/css",
            express.static(cssDir, { index: false, redirect: false })
        );
    }

    if (pastaExiste(imagesDir)) {
        app.use(
            "/images",
            express.static(imagesDir, { index: false, redirect: false })
        );
    }

    app.use(
        express.static(hubDist, {
            index: "index.html",
            redirect: false
        })
    );

    app.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
            return next();
        }

        const caminho = String(req.path || "");

        if (caminho.startsWith("/api")) {
            return next();
        }

        if (
            caminho.startsWith("/admin")
            || caminho.startsWith("/css")
            || caminho.startsWith("/images")
        ) {
            return res.status(404).type("text/plain").send("Não encontrado");
        }

        return res.sendFile(path.join(hubDist, "index.html"));
    });

    console.log("[SITE] Partner Hub + admin sendo servidos por este processo");
    return true;
}

module.exports = {
    caminhosDoSite,
    hubPronto,
    servirSitePublico
};
