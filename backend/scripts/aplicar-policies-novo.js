require("dotenv").config();
const fs = require("fs");
const path = require("path");

const sql = fs.readFileSync(
    path.join(__dirname, "..", "..", "documents", "supabase-schema-policies.sql"),
    "utf8"
);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias");
}

const endpoints = [
    `${url}/pg/query`,
    `${url}/pg-meta/default/query`,
    `${url}/pg-meta/query`
];

async function tentar(endpoint, body) {
    const resposta = await fetch(endpoint, {
        method: "POST",
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const texto = await resposta.text();
    return {
        endpoint,
        status: resposta.status,
        ok: resposta.ok,
        body: texto.slice(0, 300)
    };
}

(async () => {
    console.log("HOST", new URL(url).host);

    for (const endpoint of endpoints) {
        const a = await tentar(endpoint, { query: sql });
        console.log("TRY", a.status, a.endpoint.replace(url, ""), a.body.replace(/\s+/g, " ").slice(0, 180));
        if (a.ok) {
            console.log("SQL_APLICADO");
            process.exit(0);
        }

        const b = await tentar(endpoint, { sql });
        console.log("TRY2", b.status, b.endpoint.replace(url, ""), b.body.replace(/\s+/g, " ").slice(0, 180));
        if (b.ok) {
            console.log("SQL_APLICADO");
            process.exit(0);
        }
    }

    console.log("SQL_NAO_APLICADO_VIA_API");
    process.exit(2);
})().catch((error) => {
    console.error("FATAL", error.message);
    process.exit(1);
});
