require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const BUCKETS = [
    {
        nome: "campanhas",
        fileSizeLimit: 50 * 1024 * 1024
    },
    {
        nome: "stories",
        fileSizeLimit: 50 * 1024 * 1024
    }
];

async function garantirBucket(supabase, { nome, fileSizeLimit }) {
    const { data: buckets, error: erroLista } = await supabase.storage.listBuckets();

    if (erroLista) {
        throw erroLista;
    }

    const existe = (buckets || []).some((bucket) => bucket.name === nome);

    if (existe) {
        console.log(`[NOVO] Bucket já existe: ${nome}`);
        return;
    }

    const { error } = await supabase.storage.createBucket(nome, {
        public: true,
        fileSizeLimit
    });

    if (error) {
        throw error;
    }

    console.log(`[NOVO] Bucket criado: ${nome}`);
}

async function main() {
    const url = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRole) {
        throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias");
    }

    console.log("[NOVO] Host:", new URL(url).host);

    const supabase = createClient(url, serviceRole);

    for (const bucket of BUCKETS) {
        await garantirBucket(supabase, bucket);
    }
}

main().catch((error) => {
    console.error("[NOVO] Falha ao criar buckets:", error.message || error);
    process.exit(1);
});
