const {
    obterExtensao,
    extensaoPorAssinatura
} = require("./uploadValidation");

function caminhoDoItem(item) {
    const bruto = String(item?.url || item?.arquivo || "").split("?")[0];

    try {
        if (/^https?:\/\//i.test(bruto)) {
            return decodeURIComponent(new URL(bruto).pathname);
        }
    } catch {
        // URL inválida: usa o texto bruto
    }

    return bruto;
}

function sanitizarNomeZip(nome) {
    const limpo = String(nome || "")
        .replace(/[\\/]+/g, "_")
        .replace(/[<>:"|?*\x00-\x1f]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^[. ]+|[. ]+$/g, "")
        .slice(0, 120);

    return limpo || "arquivo";
}

function nomeExibicaoItem(item, fallbackIndex) {
    const candidatos = [item?.nome, item?.titulo];

    for (const candidato of candidatos) {
        const texto = String(candidato || "").trim();
        if (!texto) continue;
        if (/^https?:\/\//i.test(texto)) continue;
        if (texto.includes("/") || texto.includes("\\")) continue;
        return texto;
    }

    const caminho = caminhoDoItem(item);
    const base = caminho.substring(caminho.lastIndexOf("/") + 1);
    return base || `arquivo-${fallbackIndex}`;
}

/**
 * Nome no ZIP / download: título amigável + extensão real
 * (.png, .jpg, .pdf, .mp4, .webm…). Sem extensão o Windows lista como "Arquivo".
 */
function nomeArquivoItem(item, fallbackIndex, buffer) {
    const caminho = caminhoDoItem(item);
    const ext =
        obterExtensao(caminho)
        || extensaoPorAssinatura(buffer)
        || obterExtensao(String(item?.nome || item?.titulo || ""));

    let nome = sanitizarNomeZip(nomeExibicaoItem(item, fallbackIndex));
    const extAtual = obterExtensao(nome);

    if (ext) {
        if (extAtual) {
            nome = sanitizarNomeZip(nome.slice(0, nome.lastIndexOf(".")));
        }
        return `${nome}.${ext}`;
    }

    return nome || `arquivo-${fallbackIndex}`;
}

module.exports = {
    caminhoDoItem,
    sanitizarNomeZip,
    nomeArquivoItem
};
