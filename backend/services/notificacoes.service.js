/**
 * Serviço de notificações do Bullex
 * Tabela: notificacoes (id, created_at, campanha_id, tipo, titulo, mensagem, lida)
 *
 * Deduplicação (sem coluna extra):
 * - iniciada / encerrada → campanha_id + tipo
 * - encerrando → campanha_id + tipo + mensagem exata
 */

const supabase = require("../config/supabase");
const {
    hojeISO,
    dataISO,
    sincronizarStatusCampanhas,
    STATUS
} = require("../utils/campanhaStatus");

const TIPOS = Object.freeze({
    INICIADA: "campanha_iniciada",
    ENCERRANDO: "campanha_encerrando",
    ENCERRADA: "campanha_encerrada",
    PRONTA: "campanha_pronta",
    PENDENTE: "campanha_pendente"
});

function nomeCampanha(campanha) {
    return String(campanha?.titulo || "Campanha").trim();
}

function diffDias(hoje, alvo) {
    if (!hoje || !alvo) return null;
    const a = new Date(`${hoje}T12:00:00`);
    const b = new Date(`${alvo}T12:00:00`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

async function listarNotificacoes({ limit = 50 } = {}) {
    const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(limit) || 50, 200));

    if (error) throw error;
    return Array.isArray(data) ? data : [];
}

async function contarNaoLidas() {
    const { count, error } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("lida", false);

    if (error) throw error;
    return Number(count) || 0;
}

async function marcarComoLida(id) {
    const notificacaoId = Number(id);
    if (!notificacaoId) {
        const erro = new Error("ID inválido");
        erro.statusCode = 400;
        throw erro;
    }

    const { data, error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", notificacaoId)
        .select()
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        const erro = new Error("Notificação não encontrada");
        erro.statusCode = 404;
        throw erro;
    }

    return data;
}

async function existeNotificacao({ campanhaId, tipo, mensagem = null }) {
    let query = supabase
        .from("notificacoes")
        .select("id")
        .eq("campanha_id", campanhaId)
        .eq("tipo", tipo)
        .limit(1);

    if (mensagem != null) {
        query = query.eq("mensagem", mensagem);
    }

    const { data, error } = await query;
    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
}

async function criarNotificacao({ campanhaId, tipo, titulo, mensagem }) {
    const payload = {
        campanha_id: campanhaId ?? null,
        tipo,
        titulo,
        mensagem,
        lida: false
    };

    const { data, error } = await supabase
        .from("notificacoes")
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function criarSeNaoExistir(evento) {
    const precisaMensagem =
        evento.tipo === TIPOS.ENCERRANDO;

    const existe = await existeNotificacao({
        campanhaId: evento.campanhaId,
        tipo: evento.tipo,
        mensagem: precisaMensagem ? evento.mensagem : null
    });

    if (existe) {
        return { criada: false, motivo: "duplicada" };
    }

    const notificacao = await criarNotificacao(evento);
    return { criada: true, notificacao };
}

/**
 * Notifica o admin apenas quando pronta_publicacao muda de fato.
 * Deduplicação = comparação do valor anterior vs o novo (não por tipo eterno).
 */
async function notificarMudancaProntaPublicacao({
    campanhaId,
    tituloCampanha,
    prontaAnterior,
    prontaAtual
}) {
    const id = Number(campanhaId);
    if (!id) {
        return { criada: false, motivo: "campanha_id_invalido" };
    }

    const antes = Boolean(prontaAnterior);
    const depois = Boolean(prontaAtual);

    if (antes === depois) {
        return { criada: false, motivo: "sem_mudanca" };
    }

    const nome = String(tituloCampanha || "Campanha").trim() || "Campanha";

    const evento = (!antes && depois)
        ? {
            campanhaId: id,
            tipo: TIPOS.PRONTA,
            titulo: "Campanha pronta para publicação",
            mensagem:
                `A campanha "${nome}" está completa e pronta para publicação.`
        }
        : {
            campanhaId: id,
            tipo: TIPOS.PENDENTE,
            titulo: "Campanha possui pendências",
            mensagem:
                `A campanha "${nome}" possui pendências e não está pronta para publicação.`
        };

    const notificacao = await criarNotificacao(evento);

    console.log(
        `[NOTIFICAÇÃO] Campanha ${id}: pronta_publicacao ${antes} → ${depois} (${evento.tipo})`
    );

    return {
        criada: true,
        notificacao,
        transicao: { de: antes, para: depois }
    };
}

function eventosDaCampanha(campanha, hoje = hojeISO()) {
    const eventos = [];
    const id = Number(campanha?.id);
    if (!id) return eventos;

    const nome = nomeCampanha(campanha);
    const inicio = dataISO(campanha.data_inicio);
    const fim = dataISO(campanha.data_fim);
    const status = String(campanha.status || "").toLowerCase();

    const diasParaFim = diffDias(hoje, fim);
    const jaIniciou = !inicio || hoje >= inicio;
    const jaEncerrou = Boolean(fim && hoje >= fim);
    const estaAtiva =
        status === STATUS.ATIVA
        || (jaIniciou && !jaEncerrou);

    if (estaAtiva) {
        eventos.push({
            campanhaId: id,
            tipo: TIPOS.INICIADA,
            titulo: "Campanha iniciada",
            mensagem: `A campanha ${nome} está oficialmente ativa.`
        });
    }

    if (!jaEncerrou && diasParaFim === 7) {
        eventos.push({
            campanhaId: id,
            tipo: TIPOS.ENCERRANDO,
            titulo: "Campanha terminando",
            mensagem: `A campanha ${nome} termina em 7 dias.`
        });
    }

    if (!jaEncerrou && diasParaFim === 3) {
        eventos.push({
            campanhaId: id,
            tipo: TIPOS.ENCERRANDO,
            titulo: "Campanha terminando",
            mensagem: `A campanha ${nome} termina em 3 dias.`
        });
    }

    if (!jaEncerrou && diasParaFim === 1) {
        eventos.push({
            campanhaId: id,
            tipo: TIPOS.ENCERRANDO,
            titulo: "Campanha terminando amanhã",
            mensagem: `A campanha ${nome} termina amanhã.`
        });
    }

    if (jaEncerrou || status === STATUS.FINALIZADA) {
        eventos.push({
            campanhaId: id,
            tipo: TIPOS.ENCERRADA,
            titulo: "Campanha encerrada",
            mensagem: `A campanha ${nome} foi encerrada.`
        });
    }

    return eventos;
}

/**
 * Sincroniza status das campanhas e gera notificações pendentes.
 * Seguro para rodar em todo GET de notificações / campanhas.
 */
async function sincronizarNotificacoesCampanhas() {
    const { data: campanhas, error } = await supabase
        .from("campanhas")
        .select("id,titulo,data_inicio,data_fim,status");

    if (error) throw error;

    const sincronizadas = await sincronizarStatusCampanhas(
        supabase,
        campanhas || []
    );

    const hoje = hojeISO();
    const criadas = [];

    for (const campanha of sincronizadas) {
        const eventos = eventosDaCampanha(campanha, hoje);

        for (const evento of eventos) {
            try {
                const resultado = await criarSeNaoExistir(evento);
                if (resultado.criada) {
                    criadas.push(resultado.notificacao);
                }
            } catch (erroEvento) {
                console.error(
                    "Erro ao criar notificação automática:",
                    evento,
                    erroEvento
                );
            }
        }
    }

    return {
        campanhas: sincronizadas.length,
        criadas: criadas.length,
        notificacoes: criadas
    };
}

module.exports = {
    TIPOS,
    listarNotificacoes,
    contarNaoLidas,
    marcarComoLida,
    existeNotificacao,
    criarNotificacao,
    criarSeNaoExistir,
    notificarMudancaProntaPublicacao,
    eventosDaCampanha,
    sincronizarNotificacoesCampanhas
};
