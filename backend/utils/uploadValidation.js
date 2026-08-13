const path = require("path");
const crypto = require("crypto");

const DESTINOS = {
    card: {
        bucket: "campanhas",
        pasta: "imagens/cards",
        maxBytes: 5 * 1024 * 1024,
        extensoes: ["png", "jpg", "jpeg", "webp"],
        mimes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    },
    banner: {
        bucket: "campanhas",
        pasta: "imagens/banners",
        maxBytes: 5 * 1024 * 1024,
        extensoes: ["png", "jpg", "jpeg", "webp"],
        mimes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    },
    material: {
        bucket: "campanhas",
        pasta: null, // definida pelo MIME
        maxBytes: 50 * 1024 * 1024,
        extensoes: [
            "png", "jpg", "jpeg", "webp", "gif",
            "mp4", "webm",
            "pdf", "zip"
        ],
        mimes: [
            "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
            "video/mp4", "video/webm",
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed"
        ]
    },
    video: {
        bucket: "campanhas",
        pasta: "materiais/videos",
        maxBytes: 50 * 1024 * 1024,
        extensoes: ["mp4", "webm"],
        mimes: ["video/mp4", "video/webm"]
    },
    kit: {
        bucket: "campanhas",
        pasta: "kits/arquivos",
        maxBytes: 50 * 1024 * 1024,
        extensoes: [
            "png", "jpg", "jpeg", "webp", "gif",
            "mp4", "webm",
            "pdf", "zip"
        ],
        mimes: [
            "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
            "video/mp4", "video/webm",
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed"
        ]
    }
};

function normalizarTipo(tipo) {
    const valor = String(tipo || "").trim().toLowerCase();
    return DESTINOS[valor] ? valor : null;
}

function obterExtensao(nomeArquivo = "", mime = "") {
    const base = path.basename(String(nomeArquivo));
    const ext = base.includes(".")
        ? base.split(".").pop().toLowerCase()
        : "";

    if (ext && /^[a-z0-9]{1,8}$/.test(ext)) {
        return ext === "jpeg" ? "jpg" : ext;
    }

    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/gif") return "gif";
    if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
    if (mime === "video/mp4") return "mp4";
    if (mime === "video/webm") return "webm";
    if (mime === "application/pdf") return "pdf";
    if (
        mime === "application/zip"
        || mime === "application/x-zip-compressed"
    ) {
        return "zip";
    }

    return "";
}

function sanitizarNomeOriginal(nomeArquivo = "") {
    const base = path.basename(String(nomeArquivo));
    const limpo = base
        .replace(/[^\w.\-]+/g, "_")
        .replace(/_{2,}/g, "_")
        .slice(0, 120);

    return limpo || "arquivo";
}

function pastaPorMimeMaterial(mime = "") {
    const tipo = String(mime).toLowerCase();
    if (tipo.startsWith("image/")) return "materiais/imagens";
    if (tipo.startsWith("video/")) return "materiais/videos";
    return "materiais/arquivos";
}

function gerarCaminhoUnico({ tipo, mime, nomeOriginal }) {
    const config = DESTINOS[tipo];
    const ext = obterExtensao(nomeOriginal, mime);
    const uid = crypto.randomUUID();
    const pasta =
        tipo === "material"
            ? pastaPorMimeMaterial(mime)
            : config.pasta;

    return `${pasta}/${Date.now()}-${uid}.${ext}`;
}

/**
 * Valida arquivo recebido no upload.
 * @returns {{ ok: true, tipo: string, config: object, caminho: string, nomeOriginal: string } | { ok: false, erro: string }}
 */
function validarUpload({ tipo, file }) {
    const tipoNormalizado = normalizarTipo(tipo);

    if (!tipoNormalizado) {
        return {
            ok: false,
            erro: "Tipo de upload inválido. Use card, banner, material, video ou kit."
        };
    }

    if (!file) {
        return {
            ok: false,
            erro: "Arquivo é obrigatório."
        };
    }

    const config = DESTINOS[tipoNormalizado];
    const mime = String(file.mimetype || "").toLowerCase();
    const nomeOriginal = sanitizarNomeOriginal(file.originalname);
    const ext = obterExtensao(file.originalname, mime);

    if (!ext) {
        return {
            ok: false,
            erro: "Não foi possível identificar a extensão do arquivo."
        };
    }

    const extOk =
        config.extensoes.includes(ext)
        || (ext === "jpg" && config.extensoes.includes("jpeg"));

    if (!extOk) {
        return {
            ok: false,
            erro: `Extensão .${ext} não permitida para ${tipoNormalizado}.`
        };
    }

    if (!config.mimes.includes(mime)) {
        return {
            ok: false,
            erro: `Tipo MIME não permitido: ${mime || "desconhecido"}.`
        };
    }

    if (!file.size || file.size <= 0) {
        return {
            ok: false,
            erro: "Arquivo vazio."
        };
    }

    if (file.size > config.maxBytes) {
        const mb = Math.round(config.maxBytes / (1024 * 1024));
        return {
            ok: false,
            erro: `Arquivo excede o limite de ${mb} MB.`
        };
    }

    // Bloqueia path traversal no nome original (já sanitizado, reforço)
    if (
        String(file.originalname || "").includes("..")
        || String(file.originalname || "").includes("/")
        || String(file.originalname || "").includes("\\")
    ) {
        // ainda permitimos após sanitizar, mas geramos caminho próprio
    }

    const caminho = gerarCaminhoUnico({
        tipo: tipoNormalizado,
        mime,
        nomeOriginal
    });

    if (
        caminho.includes("..")
        || caminho.startsWith("/")
        || caminho.includes("\\")
    ) {
        return {
            ok: false,
            erro: "Caminho de destino inválido."
        };
    }

    return {
        ok: true,
        tipo: tipoNormalizado,
        config,
        caminho,
        nomeOriginal,
        mime,
        tamanho: file.size
    };
}

function limiteMaximoGeral() {
    return Math.max(
        ...Object.values(DESTINOS).map((item) => item.maxBytes)
    );
}

module.exports = {
    DESTINOS,
    normalizarTipo,
    validarUpload,
    limiteMaximoGeral,
    sanitizarNomeOriginal
};
