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
    UPDATE: "UPDATE",
    EXCLUIDA: "excluída",
    CREATE: "CREATE",
    PUBLISH: "PUBLISH",
    ACTIVATE: "ACTIVATE",
    PAUSE: "PAUSE",
    FINISH: "FINISH",
    DELETE: "DELETE",
    DUPLICATE: "DUPLICATE"
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
    data_fim: "Data de encerramento",
    status: "Status",
    imagem_card: "Imagem do card",
    banner: "Banner",
    visao_geral: "Visão geral",
    angulos_divulgacao: "Ângulos de divulgação"
};

function atorDoUsuario(usuario) {
    if (!usuario || typeof usuario !== "object") {
        return { usuario_id: null, email: null };
    }

    const usuario_id = usuario.id ? String(usuario.id) : null;
    const email = usuario.email ? String(usuario.email) : null;

    return { usuario_id, email };
}

function auditoriaDaSessao(usuario) {
    const ator = atorDoUsuario(usuario);

    return {
        updated_by: ator.usuario_id,
        updated_at: new Date().toISOString()
    };
}

function erroColunaAuditoria(error) {
    const msg = [
        error?.message,
        error?.details,
        error?.hint,
        error?.code
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return (
        msg.includes("updated_by")
        || msg.includes("updated_at")
        || msg.includes("schema cache")
    );
}

function payloadSemAuditoria(payload) {
    const copia = { ...(payload || {}) };
    delete copia.updated_by;
    delete copia.updated_at;
    return copia;
}

async function persistirCampanhaComAuditoria({ modo, campanhaId, payload } = {}) {
    const executar = (dados) => {
        if (modo === "insert") {
            return supabase
                .from("campanhas")
                .insert([dados])
                .select()
                .single();
        }

        return supabase
            .from("campanhas")
            .update(dados)
            .eq("id", campanhaId)
            .select()
            .single();
    };

    const primeira = await executar(payload);
    if (!primeira.error) {
        return {
            data: primeira.data,
            error: null,
            triggerAtiva: true
        };
    }

    if (!erroColunaAuditoria(primeira.error)) {
        return {
            data: primeira.data,
            error: primeira.error,
            triggerAtiva: false
        };
    }

    const segunda = await executar(payloadSemAuditoria(payload));
    return {
        data: segunda.data,
        error: segunda.error,
        triggerAtiva: false
    };
}

function labelDoCampo(campo) {
    if (LABELS_CAMPOS[campo]) {
        return LABELS_CAMPOS[campo];
    }

    return String(campo || "")
        .replace(/_/g, " ")
        .replace(/^\w/, (letra) => letra.toUpperCase()) || "Campo";
}

function camposDeAlteracoes(alteracoes) {
    if (!alteracoes || typeof alteracoes !== "object" || Array.isArray(alteracoes)) {
        return [];
    }

    return Object.entries(alteracoes).map(([campo, delta]) => {
        const mudanca =
            delta && typeof delta === "object" && !Array.isArray(delta)
                ? delta
                : { antes: null, depois: delta };

        return {
            campo,
            label: labelDoCampo(campo),
            antes: Object.prototype.hasOwnProperty.call(mudanca, "antes")
                ? mudanca.antes
                : null,
            depois: Object.prototype.hasOwnProperty.call(mudanca, "depois")
                ? mudanca.depois
                : null
        };
    });
}

function extrairCamposMetadata(metadata) {
    const meta =
        metadata && typeof metadata === "object" && !Array.isArray(metadata)
            ? metadata
            : {};

    if (Array.isArray(meta.campos) && meta.campos.length) {
        return meta.campos.map((item) => ({
            campo: item?.campo || "",
            label: item?.label || labelDoCampo(item?.campo),
            antes: item?.antes ?? null,
            depois: item?.depois ?? null
        }));
    }

    return camposDeAlteracoes(meta.alteracoes);
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

async function anexarMetadataAoHistoricoRecente(campanhaId, extraMetadata) {
    const extra =
        extraMetadata && typeof extraMetadata === "object"
            ? extraMetadata
            : null;

    if (!extra || !Object.keys(extra).length) {
        return null;
    }

    const id = Number(campanhaId);
    if (!id) {
        return null;
    }

    try {
        const { data, error } = await supabase
            .from("campanhas_historico")
            .select("id, metadata")
            .eq("campanha_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data?.id) {
            if (error) {
                console.error(
                    "[HISTÓRICO] Falha ao localizar registro recente:",
                    error.message || error
                );
            }
            return null;
        }

        const atual =
            data.metadata && typeof data.metadata === "object"
                ? data.metadata
                : {};

        const { error: erroUpdate } = await supabase
            .from("campanhas_historico")
            .update({
                metadata: {
                    ...atual,
                    ...extra
                }
            })
            .eq("id", data.id);

        if (erroUpdate) {
            throw erroUpdate;
        }

        return true;
    } catch (error) {
        console.error(
            "[HISTÓRICO] Falha ao anexar metadata:",
            error?.message || error
        );
        return null;
    }
}

function nomeDoUsuarioAuth(usuario) {
    if (!usuario || typeof usuario !== "object") {
        return null;
    }

    const meta =
        usuario.user_metadata && typeof usuario.user_metadata === "object"
            ? usuario.user_metadata
            : {};

    return (
        String(meta.full_name || meta.name || meta.nome || "").trim()
        || String(usuario.email || "").trim()
        || null
    );
}

async function mapaUsuariosHistorico(usuarioIds = []) {
    const ids = [...new Set(
        (Array.isArray(usuarioIds) ? usuarioIds : [])
            .map((id) => String(id || "").trim())
            .filter(Boolean)
    )];

    const mapa = new Map();

    await Promise.all(
        ids.map(async (usuarioId) => {
            try {
                const { data, error } = await supabase.auth.admin.getUserById(
                    usuarioId
                );

                if (error || !data?.user) {
                    mapa.set(usuarioId, {
                        id: usuarioId,
                        email: null,
                        nome: null
                    });
                    return;
                }

                mapa.set(usuarioId, {
                    id: data.user.id,
                    email: data.user.email || null,
                    nome: nomeDoUsuarioAuth(data.user)
                });
            } catch (error) {
                console.error(
                    "[HISTÓRICO] Falha ao buscar admin:",
                    error?.message || error
                );
                mapa.set(usuarioId, {
                    id: usuarioId,
                    email: null,
                    nome: null
                });
            }
        })
    );

    return mapa;
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

    const linhas = Array.isArray(data) ? data : [];
    const usuarios = await mapaUsuariosHistorico(
        linhas.map((linha) => linha.usuario_id)
    );

    return linhas.map((linha) => {
        const meta =
            linha.metadata && typeof linha.metadata === "object"
                ? linha.metadata
                : {};
        const usuarioId = linha.usuario_id ? String(linha.usuario_id) : null;
        const doAuth = usuarioId ? usuarios.get(usuarioId) : null;

        return {
            ...linha,
            campos: extrairCamposMetadata(meta),
            usuario: {
                id: usuarioId,
                email:
                    doAuth?.email
                    || meta.usuario_email
                    || meta.email
                    || null,
                nome:
                    doAuth?.nome
                    || meta.usuario_nome
                    || meta.usuario_email
                    || meta.email
                    || null
            }
        };
    });
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
    LABELS_CAMPOS,
    anexarMetadataAoHistoricoRecente,
    auditoriaDaSessao,
    compararCampos,
    extrairCamposMetadata,
    listarHistorico,
    mapaConfirmacaoDataPendente,
    persistirCampanhaComAuditoria,
    registrarAtualizacao,
    registrarCriacao,
    registrarExclusao,
    snapshotRelevante
};
