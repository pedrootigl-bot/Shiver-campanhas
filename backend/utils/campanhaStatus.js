/**
 * Status de campanhas
 *
 * agendada   → hoje < data_inicio
 * ativa       → período em curso (data chegou sozinha) OU admin confirmou
 *               antecipação de data de uma campanha que estava agendada
 * finalizada  → hoje >= data_fim
 *
 * Se o admin antecipar a data de início de uma campanha agendada para o
 * período atual, o status permanece agendada até a confirmação
 * (POST /api/campanhas/:id/publicar). Sem essa mudança de data, a campanha
 * vira ativa sozinha quando o calendário chegar em data_inicio.
 */

const {
    mapaConfirmacaoDataPendente
} = require("../services/campanhaHistorico.service");

const STATUS = Object.freeze({
    AGENDADA: "agendada",
    ATIVA: "ativa",
    FINALIZADA: "finalizada"
});

const TIMEZONE_PADRAO = "America/Sao_Paulo";

function hojeISO(timezone = TIMEZONE_PADRAO) {
    try {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());
    } catch {
        const agora = new Date();
        const y = agora.getFullYear();
        const m = String(agora.getMonth() + 1).padStart(2, "0");
        const d = String(agora.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
}

function dataISO(valor) {
    if (!valor) return null;
    const texto = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        return texto.slice(0, 10);
    }
    const data = new Date(texto);
    if (Number.isNaN(data.getTime())) return null;
    const y = data.getUTCFullYear();
    const m = String(data.getUTCMonth() + 1).padStart(2, "0");
    const d = String(data.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function normalizarStatus(valor) {
    const bruto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (!bruto) return null;

    if (bruto === STATUS.AGENDADA || bruto.includes("agend") || bruto.includes("program")) {
        return STATUS.AGENDADA;
    }

    if (bruto === STATUS.FINALIZADA || bruto.includes("final") || bruto === "inativa" || bruto.includes("paus")) {
        // "inativa" legado passa a ser tratado como finalizada na normalização
        // quando não houver recálculo por datas.
        if (bruto === "inativa" || bruto.includes("paus")) {
            return STATUS.FINALIZADA;
        }
        return STATUS.FINALIZADA;
    }

    if (bruto === STATUS.ATIVA) {
        return STATUS.ATIVA;
    }

    return null;
}

/**
 * Calcula o status esperado com base nas datas.
 */
function calcularStatusPorDatas(dataInicio, dataFim, hoje = hojeISO()) {
    const inicio = dataISO(dataInicio);
    const fim = dataISO(dataFim);

    if (!inicio && !fim) {
        return STATUS.ATIVA;
    }

    if (inicio && hoje < inicio) {
        return STATUS.AGENDADA;
    }

    if (fim && hoje >= fim) {
        return STATUS.FINALIZADA;
    }

    return STATUS.ATIVA;
}

function statusPublicoVisivel(status, prontaPublicacao) {
    const normalizado = normalizarStatus(status);
    if (normalizado === STATUS.ATIVA) return true;
    if (normalizado !== STATUS.AGENDADA) return false;
    return (
        prontaPublicacao === true
        || prontaPublicacao === "true"
        || prontaPublicacao === 1
        || prontaPublicacao === "1"
    );
}

/**
 * Encerramento por data sempre vence.
 * Se o admin já ativou, não rebaixa para agendada.
 */
function resolverStatusPersistido(statusAtual, dataInicio, dataFim, hoje = hojeISO()) {
    const porData = calcularStatusPorDatas(dataInicio, dataFim, hoje);
    if (porData === STATUS.FINALIZADA) {
        return STATUS.FINALIZADA;
    }
    if (normalizarStatus(statusAtual) === STATUS.ATIVA) {
        return STATUS.ATIVA;
    }
    return porData;
}

/**
 * Campanha agendada teve a data de início antecipada e, com a nova data,
 * já estaria no período atual. Exige confirmação do admin antes de ativar.
 */
function mudancaInicioExigeConfirmacao({
    statusAnterior,
    inicioAnterior,
    inicioNovo,
    fimNovo,
    hoje = hojeISO()
} = {}) {
    if (normalizarStatus(statusAnterior) !== STATUS.AGENDADA) {
        return false;
    }

    const antes = dataISO(inicioAnterior);
    const depois = dataISO(inicioNovo);

    if (!antes || !depois || antes === depois) {
        return false;
    }

    return calcularStatusPorDatas(inicioNovo, fimNovo, hoje) === STATUS.ATIVA;
}

function resolverStatusAoSalvar({
    statusAnterior,
    inicioAnterior,
    dataInicio,
    dataFim,
    hoje = hojeISO()
} = {}) {
    if (mudancaInicioExigeConfirmacao({
        statusAnterior,
        inicioAnterior,
        inicioNovo: dataInicio,
        fimNovo: dataFim,
        hoje
    })) {
        return STATUS.AGENDADA;
    }

    return resolverStatusPersistido(
        statusAnterior,
        dataInicio,
        dataFim,
        hoje
    );
}

/**
 * Atualiza no banco os status desatualizados e devolve a lista já corrigida.
 */
async function sincronizarStatusCampanhas(supabase, campanhas = [], opcoes = {}) {
    const lista = Array.isArray(campanhas) ? campanhas : [];
    if (!lista.length) return [];

    const hoje = hojeISO();
    const atualizadas = [];
    const pendencias = [];
    const idsPendentes = new Set(
        (opcoes.idsConfirmacaoDataPendente || [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0)
    );

    for (const campanha of lista) {
        let esperado = resolverStatusPersistido(
            campanha.status,
            campanha.data_inicio,
            campanha.data_fim,
            hoje
        );
        const atual = String(campanha.status || "").trim().toLowerCase();

        if (
            idsPendentes.has(Number(campanha.id))
            && atual === STATUS.AGENDADA
            && esperado === STATUS.ATIVA
        ) {
            esperado = STATUS.AGENDADA;
        }

        if (atual !== esperado) {
            pendencias.push({ id: campanha.id, status: esperado });
        }

        atualizadas.push({
            ...campanha,
            status: esperado
        });
    }

    if (pendencias.length > 0 && supabase) {
        await Promise.all(
            pendencias.map((item) =>
                supabase
                    .from("campanhas")
                    .update({ status: item.status })
                    .eq("id", item.id)
                    .then(({ error }) => {
                        if (error) {
                            console.error(
                                `Erro ao sincronizar status da campanha ${item.id}:`,
                                error
                            );
                        }
                    })
            )
        );
    }

    return atualizadas;
}

async function sincronizarStatusCampanha(supabase, campanha) {
    if (!campanha) return null;
    const [resultado] = await sincronizarStatusComConfirmacaoData(
        supabase,
        [campanha]
    );
    return resultado || null;
}

async function sincronizarStatusComConfirmacaoData(supabase, campanhas = []) {
    const lista = Array.isArray(campanhas) ? campanhas : [];
    if (!lista.length) return [];

    const hoje = hojeISO();
    const candidatos = lista.filter((campanha) => {
        const status = String(campanha.status || "").trim().toLowerCase();
        return (
            status === STATUS.AGENDADA
            && calcularStatusPorDatas(
                campanha.data_inicio,
                campanha.data_fim,
                hoje
            ) === STATUS.ATIVA
        );
    });

    const mapaPendente = await mapaConfirmacaoDataPendente(
        candidatos.map((campanha) => campanha.id)
    );
    const idsPendentes = [...mapaPendente.keys()];

    const sincronizadas = await sincronizarStatusCampanhas(
        supabase,
        lista,
        { idsConfirmacaoDataPendente: idsPendentes }
    );

    return sincronizadas.map((campanha) => {
        const pendente = mapaPendente.get(Number(campanha.id));
        const status = String(campanha.status || "").trim().toLowerCase();

        if (!pendente || status !== STATUS.AGENDADA) {
            return {
                ...campanha,
                confirmacao_data_pendente: false
            };
        }

        return {
            ...campanha,
            confirmacao_data_pendente: true,
            data_inicio_anterior: pendente.data_inicio_anterior,
            data_inicio_nova: pendente.data_inicio_nova || dataISO(campanha.data_inicio)
        };
    });
}

module.exports = {
    STATUS,
    TIMEZONE_PADRAO,
    hojeISO,
    dataISO,
    normalizarStatus,
    calcularStatusPorDatas,
    statusPublicoVisivel,
    sincronizarStatusCampanhas,
    sincronizarStatusCampanha,
    sincronizarStatusComConfirmacaoData,
    resolverStatusPersistido,
    resolverStatusAoSalvar,
    mudancaInicioExigeConfirmacao
};
