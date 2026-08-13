const express = require("express");
const router = express.Router();
const archiver = require("archiver");
const supabase = require("../config/supabase");

/**
 * Extrai bucket + path de URL pública do Supabase Storage.
 * Ex.: .../object/public/campanhas/materiais/imagens/x.png
 */
function extrairStorageDeUrl(url) {
    try {
        const texto = String(url || "");
        const match = texto.match(
            /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
        );

        if (!match) return null;

        return {
            bucket: match[1],
            path: decodeURIComponent(match[2].split("?")[0])
        };
    } catch {
        return null;
    }
}

/**
 * Pastas do ZIP seguem o campo `formato` (stories|feed|videos|banners).
 * Fallback legado: tipo/nome só se forem categorias de postagem (não imagem/video).
 */
function pastaPorFormatoMaterial(item) {
    const formato = String(item?.formato || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (formato === "stories" || formato.includes("stor")) return "stories";
    if (formato === "feed" || formato.includes("feed")) return "feed";
    if (formato === "videos" || formato.includes("video")) return "videos";
    if (formato === "banners" || formato.includes("banner")) return "banners";

    const legado = String(
        item?.categoria
        || item?.tipo
        || item?.nome
        || item?.titulo
        || ""
    )
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    // Não usar tipo=imagem|video como pasta de postagem
    if (legado === "imagem" || legado === "image" || legado === "video" || legado === "arquivo") {
        return "outros";
    }

    if (legado.includes("stor")) return "stories";
    if (legado.includes("feed")) return "feed";
    if (legado.includes("video")) return "videos";
    if (legado.includes("banner")) return "banners";

    return "outros";
}

function nomeArquivoItem(item, fallbackIndex) {
    const origem =
        item.nome
        || item.titulo
        || item.arquivo
        || item.url
        || `arquivo-${fallbackIndex}`;

    const base = String(origem).split("?")[0];
    const nome = base.substring(base.lastIndexOf("/") + 1);
    return nome || `arquivo-${fallbackIndex}`;
}

async function baixarBufferItem(item) {
    // 1) URL pública (campo atual de materiais.url)
    if (item.url) {
        const storage = extrairStorageDeUrl(item.url);

        if (storage) {
            const { data, error } = await supabase.storage
                .from(storage.bucket)
                .download(storage.path);

            if (!error && data) {
                return Buffer.from(await data.arrayBuffer());
            }
        }

        // Fallback: fetch direto da URL
        const resposta = await fetch(item.url);
        if (resposta.ok) {
            return Buffer.from(await resposta.arrayBuffer());
        }
    }

    // 2) Campo legado arquivo (kits / stories)
    if (item.arquivo) {
        const caminho = String(item.arquivo).replace(/^\/+/, "");

        for (const bucket of ["campanhas", "stories"]) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .download(caminho);

            if (!error && data) {
                return Buffer.from(await data.arrayBuffer());
            }
        }
    }

    return null;
}

// Download do kit completo da campanha
router.get("/kit/:campanha_id", async (req, res) => {
    try {
        const campanhaId = Number(req.params.campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        const { data: materiais, error: erroMateriais } = await supabase
            .from("materiais")
            .select("*")
            .eq("campanha_id", campanhaId);

        const { data: kits, error: erroKits } = await supabase
            .from("kits")
            .select("*")
            .eq("campanha_id", campanhaId);

        if (erroMateriais || erroKits) {
            console.log("Erro materiais:", erroMateriais);
            console.log("Erro kits:", erroKits);
            throw new Error("Erro ao buscar arquivos");
        }

        const arquivos = [
            ...(materiais || []),
            ...(kits || [])
        ].filter((item) => item.url || item.arquivo);

        console.log("Arquivos encontrados:", arquivos.length);

        if (!arquivos.length) {
            return res.status(404).json({
                erro: "Nenhum arquivo encontrado"
            });
        }

        // Baixa buffers ANTES de abrir a resposta ZIP
        // (evita Content-Type application/zip com corpo vazio/corrompido)
        const entradas = [];

        for (let i = 0; i < arquivos.length; i++) {
            const item = arquivos[i];
            const buffer = await baixarBufferItem(item);

            if (!buffer) {
                console.log(
                    "Erro ao baixar item do kit:",
                    item.url || item.arquivo
                );
                continue;
            }

            const pasta = pastaPorFormatoMaterial(item);
            const nomeBase = nomeArquivoItem(item, i + 1);

            entradas.push({
                buffer,
                name: `${pasta}/${nomeBase}`
            });
        }

        if (!entradas.length) {
            return res.status(404).json({
                erro: "Nenhum arquivo pôde ser baixado"
            });
        }

        // Evita nomes duplicados no ZIP
        const nomesUsados = new Set();
        for (const entrada of entradas) {
            let nomeFinal = entrada.name;
            let contador = 2;

            while (nomesUsados.has(nomeFinal.toLowerCase())) {
                const ponto = entrada.name.lastIndexOf(".");
                if (ponto > entrada.name.lastIndexOf("/")) {
                    nomeFinal =
                        `${entrada.name.slice(0, ponto)}-${contador}`
                        + entrada.name.slice(ponto);
                } else {
                    nomeFinal = `${entrada.name}-${contador}`;
                }
                contador += 1;
            }

            nomesUsados.add(nomeFinal.toLowerCase());
            entrada.name = nomeFinal;
        }

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=kit-${campanhaId}.zip`
        );

        const zip = archiver("zip", {
            zlib: { level: 9 }
        });

        zip.on("error", (error) => {
            console.error("Erro ZIP:", error);
            if (!res.headersSent) {
                res.status(500).end();
            }
        });

        zip.pipe(res);

        for (const entrada of entradas) {
            zip.append(entrada.buffer, {
                name: entrada.name
            });
        }

        await zip.finalize();
    } catch (error) {
        console.error("Erro download kit:", error);

        if (!res.headersSent) {
            res.status(500).json({
                erro: "Erro interno do servidor"
            });
        }
    }
});

/**
 * Download de um arquivo pela URL pública do Storage.
 * GET /api/download/file?url=...&nome=opcional
 * Reutiliza baixarBufferItem (mesmo fluxo do kit).
 */
router.get("/file", async (req, res) => {
    try {
        const url = String(req.query.url || "").trim();
        const nomeQuery = String(req.query.nome || "").trim();

        if (!url) {
            return res.status(400).json({
                erro: "url é obrigatória"
            });
        }

        const storage = extrairStorageDeUrl(url);

        if (!storage) {
            return res.status(400).json({
                erro: "URL de arquivo inválida"
            });
        }

        // Restringe a buckets conhecidos do projeto
        if (!["campanhas", "stories"].includes(storage.bucket)) {
            return res.status(400).json({
                erro: "Bucket não permitido"
            });
        }

        const buffer = await baixarBufferItem({ url });

        if (!buffer) {
            return res.status(404).json({
                erro: "Arquivo não encontrado"
            });
        }

        const nomeSeguro = (nomeQuery || nomeArquivoItem({ url }, 1))
            .replace(/[\\/]+/g, "_")
            .replace(/"/g, "")
            .slice(0, 180) || "arquivo";

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${nomeSeguro}"`
        );
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", buffer.length);
        return res.send(buffer);
    } catch (error) {
        console.error("Erro download file:", error);
        return res.status(500).json({
            erro: "Erro ao baixar arquivo"
        });
    }
});

// Download de arquivo individual (legado)
router.get("/:arquivo", async (req, res) => {
    try {
        const arquivo = req.params.arquivo;

        // Bloqueia path traversal
        if (
            !arquivo
            || arquivo.includes("..")
            || arquivo.includes("\\")
            || arquivo.includes("/")
        ) {
            return res.status(400).json({
                erro: "Nome de arquivo inválido"
            });
        }

        let data = null;
        let error = null;

        for (const bucket of ["campanhas", "stories"]) {
            const resultado = await supabase.storage
                .from(bucket)
                .download(arquivo);

            if (!resultado.error && resultado.data) {
                data = resultado.data;
                error = null;
                break;
            }

            error = resultado.error;
        }

        if (error || !data) {
            throw error || new Error("Arquivo não encontrado");
        }

        const buffer = Buffer.from(await data.arrayBuffer());

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${arquivo}"`
        );
        res.setHeader(
            "Content-Type",
            "application/octet-stream"
        );
        res.send(buffer);
    } catch (error) {
        console.error("Erro download arquivo:", error);
        res.status(500).json({
            erro: "Erro ao baixar arquivo"
        });
    }
});

module.exports = router;
