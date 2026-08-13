const express = require("express");
const cors = require("cors");
require("dotenv").config();

const campanhasRoutes = require("./routes/campanhaRoutes");
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
const {
    iniciarScheduler,
    pararScheduler
} = require("./jobs");

const app = express();

const corsOrigins = String(
    process.env.CORS_ORIGINS
    || "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://localhost:55434,http://127.0.0.1:55434"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Permite ferramentas locais sem Origin (curl/Postman)
        if (!origin) {
            return callback(null, true);
        }

        if (corsOrigins.includes("*") || corsOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin não permitida pelo CORS"));
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

app.use(
    "/api/notificacoes",
    notificacoesRoutes
);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API Bullex funcionando!"
    });
});

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
