/**
 * Job: sincroniza status das campanhas e atualiza pronta_publicacao.
 * Reutiliza: sincronizarStatusCampanhas + validarCampanha
 *
 * A notificação de transição (false↔true) é criada dentro de validarCampanha,
 * para cobrir tanto o Scheduler quanto as rotas da API.
 */

const supabase = require("../config/supabase");
const { sincronizarStatusCampanhas } = require("../utils/campanhaStatus");
const { validarCampanha } = require("../services/campanhaValidacao.service");

async function executarJobCampanhas() {
    console.log("[JOB:CAMPANHAS] Início");

    const { data, error } = await supabase
        .from("campanhas")
        .select("id,titulo,data_inicio,data_fim,status,pronta_publicacao")
        .order("id", { ascending: true });

    if (error) {
        console.error("[JOB:CAMPANHAS] Erro ao buscar campanhas:", error.message || error);
        throw error;
    }

    const campanhas = Array.isArray(data) ? data : [];

    const sincronizadas = await sincronizarStatusCampanhas(
        supabase,
        campanhas
    );

    let aprovadas = 0;
    let reprovadas = 0;
    let errosValidacao = 0;
    let notificacoesCriadas = 0;

    for (const campanha of sincronizadas) {
        try {
            const resultado = await validarCampanha(campanha.id);

            if (resultado.pronta) {
                aprovadas += 1;
            } else {
                reprovadas += 1;
            }

            if (resultado.notificacaoCriada) {
                notificacoesCriadas += 1;
            }
        } catch (erroValidacao) {
            errosValidacao += 1;
            console.error(
                `[JOB:CAMPANHAS] Erro ao validar campanha ${campanha.id}:`,
                erroValidacao?.message || erroValidacao
            );
        }
    }

    const resumo = {
        total: sincronizadas.length,
        aprovadas,
        reprovadas,
        errosValidacao,
        notificacoesCriadas
    };

    console.log(
        `[JOB:CAMPANHAS] Concluído — total=${resumo.total}, prontas=${resumo.aprovadas}, pendentes=${resumo.reprovadas}, erros=${resumo.errosValidacao}, notificacoes=${resumo.notificacoesCriadas}`
    );

    return resumo;
}

module.exports = {
    executarJobCampanhas
};
