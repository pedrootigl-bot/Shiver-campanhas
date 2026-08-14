const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const campanhasRoutes = require("./routes/campanhaRoutes");
const partnerHubRoutes = require("./routes/partnerHubRoutes");
const materiaisRoutes = require("./routes/materiaisRoutes");
const copiesRoutes = require("./routes/copiesRoutes");
const regrasRoutes = require("./routes/regras");
const statsRoutes = require("./routes/stats");
const destaqueRoutes = require("./routes/destaque");
const downloadRoutes = require("./routes/download");
const kitsRoutes = require("./routes/kits");
const angulosRoutes = require("./routes/angulosRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificacoesRoutes = require("./routes/notificacoesRoutes");
const authRoutes = require("./routes/authRoutes");
const { servirSitePublico } = require("./servePublico");
const {
    iniciarScheduler,
    pararScheduler
} = require("./jobs");

const app = express();
app.set("trust proxy", 1);

function origensExtrasDoHost() {
    const extras = [];
    const publicUrl = String(process.env.PUBLIC_APP_URL || "")
        .trim()
        .replace(/\/$/, "");

    if (publicUrl) extras.push(publicUrl);

    const railway = String(process.env.RAILWAY_PUBLIC_DOMAIN || "").trim();
    if (railway) extras.push(`https://${railway.replace(/^https?:\/\//, "")}`);

    const render = String(process.env.RENDER_EXTERNAL_URL || "")
        .trim()
        .replace(/\/$/, "");
    if (render) extras.push(render);

    return extras;
}

const corsOrigins = [
    ...String(
        process.env.CORS_ORIGINS
        || "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176,http://localhost:55434,http://127.0.0.1:55434"
    )
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ...origensExtrasDoHost()
];

function origemPermitida(origin) {
    if (!origin) return true;
    if (corsOrigins.includes("*") || corsOrigins.includes(origin)) {
        return true;
    }

    try {
        const url = new URL(origin);
        const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        const porta = Number(url.port);
        return local && porta >= 5173 && porta <= 5199;
    } catch {
        return false;
    }
}

app.use(cors({
    origin(origin, callback) {
        if (origemPermitida(origin)) {
            return callback(null, true);
        }

        console.warn("[CORS] Origin bloqueada:", origin);
        return callback(null, false);
    }
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/public-config", (req, res) => {
    const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
    const supabaseAnonKey = String(
        process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ""
    ).trim();

    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({
            erro: "Configuração pública do Supabase ausente"
        });
    }

    return res.json({
        supabaseUrl,
        supabaseAnonKey
    });
});

// Rotas

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/campanhas",
    campanhasRoutes
);

app.use(
    "/api/partner-hub",
    partnerHubRoutes
);

app.use(
    "/api/materiais",
    materiaisRoutes
);

app.use(
    "/api/copies",
    copiesRoutes
);

app.use(
    "/api/regras",
    regrasRoutes
);

app.use(
    "/api/stats",
    statsRoutes
);

app.use(
    "/api/destaque",
    destaqueRoutes
);

app.use(
    "/api/download",
    downloadRoutes
);

app.use(
    "/api/kits",
    kitsRoutes
);

app.use(
    "/api/angulos",
    angulosRoutes
);

app.use(
    "/api/upload",
    uploadRoutes
);

app.use("/api/notificacoes", notificacoesRoutes);

app.get("/api/health", (_req, res) => {
    res.json({
        ok: true,
        servico: "shiver-campanhas"
    });
});

const siteNoAr = servirSitePublico(app);

if (!siteNoAr) {
    app.get("/", (_req, res) => {
        res.json({
            mensagem: "API Shiver-Campanhas no ar",
            dica: "O site (Partner Hub + admin) aparece em / depois do build do partner-hub"
        });
    });
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    iniciarScheduler();
});

function encerrarServidor(sinal) {
    console.log(`[SERVER] Recebido ${sinal} — encerrando...`);
    pararScheduler();

    server.close(() => {
        console.log("[SERVER] HTTP encerrado");
        process.exit(0);
    });

    // Failsafe se conexões travarem o close
    setTimeout(() => {
        console.error("[SERVER] Encerramento forçado após timeout");
        process.exit(1);
    }, 10000).unref();
}

process.on("SIGINT", () => encerrarServidor("SIGINT"));
process.on("SIGTERM", () => encerrarServidor("SIGTERM"));
