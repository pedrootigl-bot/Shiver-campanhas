/**
 * Status automático de campanhas (BULLEx)
 *
 * agendada   → hoje < data_inicio
 * ativa       → data_inicio <= hoje < data_fim
 * finalizada  → hoje >= data_fim
 *
 * Fonte da verdade: datas. O status no banco é espelhado
 * sob demanda (GET) e no save (POST/PUT).
 *
 * Evolução futura:
 * - cron diário / webhook
 * - timezone configurável por conta
 * - flag status_manual_override
 */

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
 * Atualiza no banco os status desatualizados e devolve a lista já corrigida.
 */
async function sincronizarStatusCampanhas(supabase, campanhas = []) {
    const lista = Array.isArray(campanhas) ? campanhas : [];
    if (!lista.length) return [];

    const hoje = hojeISO();
    const atualizadas = [];
    const pendencias = [];

    for (const campanha of lista) {
        const esperado = calcularStatusPorDatas(
            campanha.data_inicio,
            campanha.data_fim,
            hoje
        );
        const atual = String(campanha.status || "").trim().toLowerCase();

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
    const [resultado] = await sincronizarStatusCampanhas(supabase, [campanha]);
    return resultado || null;
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
    sincronizarStatusCampanha
};
