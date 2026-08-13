/**
 * Auditoria de campanhas.
 * Tabela existente: campanhas_historico
 * Colunas reais: id, created_at, campanha_id, usuario_id, acao, descricao, metadata
 *
 * Não lança erro para o fluxo de campanha. Falha de auditoria só gera log.
 */

const supabase = require("../config/supabase");

const ACOES = Object.freeze({
    CRIADA: "criada",
    ATUALIZADA: "atualizada",
    EXCLUIDA: "excluída"
});

const CAMPOS_RASTREADOS = [
    "titulo",
    "texto_header",
    "descricao",
    "resumo",
    "categoria",
    "objetivo",
    "publico_recomendado",
    "mecanica",
    "premio",
    "cupom",
    "deposito_minimo",
    "data_inicio",
    "data_fim",
    "status",
    "imagem_card",
    "banner"
];

const LABELS_CAMPOS = {
    titulo: "Título",
    texto_header: "Texto do header",
    descricao: "Descrição",
    resumo: "Visão geral",
    categoria: "Categoria",
    objetivo: "Objetivo",
    publico_recomendado: "Público recomendado",
    mecanica: "Mecânica",
    premio: "Prêmio",
    cupom: "Cupom",
    deposito_minimo: "Depósito mínimo",
    data_inicio: "Data de início",
    data_fim: "Data de término",
    status: "Status",
    imagem_card: "Imagem do card",
    banner: "Banner"
};

function atorDoUsuario(usuario) {
    if (!usuario || typeof usuario !== "object") {
        return { usuario_id: null, email: null };
    }

    const usuario_id = usuario.id ? String(usuario.id) : null;
    const email = usuario.email ? String(usuario.email) : null;

    return { usuario_id, email };
}

function snapshotRelevante(campanha) {
    const origem = campanha && typeof campanha === "object" ? campanha : {};
    const snapshot = {};

    CAMPOS_RASTREADOS.forEach((campo) => {
        if (Object.prototype.hasOwnProperty.call(origem, campo)) {
            snapshot[campo] = origem[campo];
        }
    });

    return snapshot;
}

function normalizarValor(valor) {
    if (valor === undefined || valor === null) {
        return null;
    }

    if (Array.isArray(valor)) {
        return JSON.stringify(
            valor
                .map((item) => String(item ?? "").trim())
                .filter(Boolean)
        );
    }

    if (typeof valor === "object") {
        try {
            return JSON.stringify(valor);
        } catch {
            return String(valor);
        }
    }

    const texto = String(valor).trim();

    if (texto === "") {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        return texto.slice(0, 10);
    }

    return texto;
}

function valoresIguais(antes, depois) {
    return normalizarValor(antes) === normalizarValor(depois);
}

function compararCampos(anterior, atual) {
    const antes = anterior && typeof anterior === "object" ? anterior : {};
    const depois = atual && typeof atual === "object" ? atual : {};
    const campos = [];

    CAMPOS_RASTREADOS.forEach((campo) => {
        const existeNoDepois = Object.prototype.hasOwnProperty.call(depois, campo);
        const existeNoAntes = Object.prototype.hasOwnProperty.call(antes, campo);

        if (!existeNoDepois && !existeNoAntes) {
            return;
        }

        const valorAntes = existeNoAntes ? antes[campo] : undefined;
        const valorDepois = existeNoDepois ? depois[campo] : valorAntes;

        if (valoresIguais(valorAntes, valorDepois)) {
            return;
        }

        campos.push({
            campo,
            label: LABELS_CAMPOS[campo] || campo,
            antes: valorAntes ?? null,
            depois: valorDepois ?? null
        });
    });

    return campos;
}

function camposDoSnapshot(campanha) {
    const snapshot = snapshotRelevante(campanha);

    return Object.keys(snapshot).map((campo) => ({
        campo,
        label: LABELS_CAMPOS[campo] || campo,
        antes: null,
        depois: snapshot[campo] ?? null
    }));
}

async function inserirHistorico(linha) {
    const { error } = await supabase
        .from("campanhas_historico")
        .insert([linha]);

    if (error) {
        throw error;
    }
}

async function registrarCriacao({ campanha, usuario } = {}) {
    try {
        const id = Number(campanha?.id);
        if (!id) {
            console.error("[HISTÓRICO] Criação ignorada: campanha sem id");
            return null;
        }

        const ator = atorDoUsuario(usuario);
        const snapshot = snapshotRelevante(campanha);

        await inserirHistorico({
            campanha_id: id,
            usuario_id: ator.usuario_id,
            acao: ACOES.CRIADA,
            descricao: "Campanha criada",
            metadata: {
                usuario_email: ator.email,
                snapshot,
                campos: camposDoSnapshot(campanha)
            }
        });

        return true;
    } catch (error) {
        console.error(
            "[HISTÓRICO] Falha ao registrar criação:",
            error?.message || error
        );
        return null;
    }
}

async function registrarAtualizacao({
    campanhaId,
    anterior,
    atual,
    usuario,
    extraMetadata
} = {}) {
    try {
        const id = Number(campanhaId);
        if (!id) {
            console.error("[HISTÓRICO] Atualização ignorada: id inválido");
            return null;
        }

        const campos = compararCampos(anterior, atual);

        if (!campos.length) {
            return null;
        }

        const ator = atorDoUsuario(usuario);
        const nomes = campos.map((item) => item.campo).join(", ");
        const extra =
            extraMetadata && typeof extraMetadata === "object"
                ? extraMetadata
                : {};

        await inserirHistorico({
            campanha_id: id,
            usuario_id: ator.usuario_id,
            acao: ACOES.ATUALIZADA,
            descricao: extra.confirmacao_data_pendente
                ? `Data de início alterada — aguardando confirmação (${nomes})`
                : `Campanha atualizada (${nomes})`,
            metadata: {
                usuario_email: ator.email,
                campos,
                ...extra
            }
        });

        return true;
    } catch (error) {
        console.error(
            "[HISTÓRICO] Falha ao registrar atualização:",
            error?.message || error
        );
        return null;
    }
}

async function registrarExclusao({ campanha, usuario } = {}) {
    try {
        const id = Number(campanha?.id);
        if (!id) {
            console.error("[HISTÓRICO] Exclusão ignorada: campanha sem id");
            return null;
        }

        const ator = atorDoUsuario(usuario);
        const snapshot = snapshotRelevante(campanha);

        await inserirHistorico({
            campanha_id: id,
            usuario_id: ator.usuario_id,
            acao: ACOES.EXCLUIDA,
            descricao: "Campanha excluída",
            metadata: {
                usuario_email: ator.email,
                snapshot,
                campos: camposDoSnapshot(campanha)
            }
        });

        return true;
    } catch (error) {
        console.error(
            "[HISTÓRICO] Falha ao registrar exclusão:",
            error?.message || error
        );
        return null;
    }
}

async function listarHistorico(campanhaId) {
    const id = Number(campanhaId);

    if (!id) {
        const erro = new Error("ID da campanha inválido");
        erro.statusCode = 400;
        throw erro;
    }

    const { data, error } = await supabase
        .from("campanhas_historico")
        .select("id, created_at, campanha_id, usuario_id, acao, descricao, metadata")
        .eq("campanha_id", id)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
}

/**
 * Campanhas agendadas cuja data de início foi antecipada para o período atual
 * e ainda não tiveram a mudança confirmada pelo admin.
 */
async function mapaConfirmacaoDataPendente(campanhaIds = []) {
    const ids = [...new Set(
        (Array.isArray(campanhaIds) ? campanhaIds : [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0)
    )];

    if (!ids.length) {
        return new Map();
    }

    const { data, error } = await supabase
        .from("campanhas_historico")
        .select("campanha_id, metadata, created_at")
        .in("campanha_id", ids)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(
            "[HISTÓRICO] Falha ao buscar confirmação de data:",
            error.message || error
        );
        return new Map();
    }

    const mapa = new Map();

    for (const linha of data || []) {
        const id = Number(linha.campanha_id);
        if (!id || mapa.has(id)) continue;

        const meta =
            linha.metadata && typeof linha.metadata === "object"
                ? linha.metadata
                : {};

        if (meta.confirmacao_data_pendente === true) {
            mapa.set(id, {
                data_inicio_anterior: meta.data_inicio_anterior || null,
                data_inicio_nova: meta.data_inicio_nova || null
            });
        }
    }

    return mapa;
}

module.exports = {
    ACOES,
    CAMPOS_RASTREADOS,
    compararCampos,
    listarHistorico,
    mapaConfirmacaoDataPendente,
    registrarAtualizacao,
    registrarCriacao,
    registrarExclusao,
    snapshotRelevante
};
