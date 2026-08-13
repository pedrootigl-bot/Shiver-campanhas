/**
 * Scheduler do Bullex
 *
 * - Executa imediatamente ao iniciar
 * - Repete a cada SCHEDULER_INTERVAL_MINUTES (fallback: 5)
 * - Impede execuções simultâneas
 * - Erro em um job não derruba o servidor
 */

const { executarJobCampanhas } = require("./campanhas.job");
const { executarJobNotificacoes } = require("./notificacoes.job");

const INTERVALO_PADRAO_MINUTOS = 5;

let timer = null;
let rodando = false;
let iniciado = false;

function lerIntervaloMinutos() {
    const bruto = Number(process.env.SCHEDULER_INTERVAL_MINUTES);
    if (!Number.isFinite(bruto) || bruto <= 0) {
        return INTERVALO_PADRAO_MINUTOS;
    }
    return bruto;
}

async function executarCiclo() {
    if (rodando) {
        console.log(
            "[SCHEDULER] Ciclo anterior ainda em execução — pulando esta rodada"
        );
        return;
    }

    rodando = true;
    const inicio = Date.now();
    console.log("[SCHEDULER] Ciclo iniciado");

    try {
        try {
            await executarJobCampanhas();
        } catch (erroCampanhas) {
            console.error(
                "[SCHEDULER] Job de campanhas falhou (servidor segue ativo):",
                erroCampanhas?.message || erroCampanhas
            );
        }

        try {
            await executarJobNotificacoes();
        } catch (erroNotificacoes) {
            console.error(
                "[SCHEDULER] Job de notificações falhou (servidor segue ativo):",
                erroNotificacoes?.message || erroNotificacoes
            );
        }

        const decorridoMs = Date.now() - inicio;
        console.log(`[SCHEDULER] Ciclo concluído em ${decorridoMs}ms`);
    } catch (erroCiclo) {
        // Rede de segurança: não deve chegar aqui, mas garante estabilidade
        console.error(
            "[SCHEDULER] Erro inesperado no ciclo (servidor segue ativo):",
            erroCiclo?.message || erroCiclo
        );
    } finally {
        rodando = false;
    }
}

function iniciarScheduler() {
    if (iniciado) {
        console.log("[SCHEDULER] Já estava iniciado — ignorando nova chamada");
        return;
    }

    const minutos = lerIntervaloMinutos();
    const intervaloMs = minutos * 60 * 1000;

    iniciado = true;
    console.log(
        `[SCHEDULER] Iniciado — intervalo de ${minutos} minuto(s)`
    );

    // Execução imediata ao subir o servidor
    Promise.resolve()
        .then(() => executarCiclo())
        .catch((erro) => {
            console.error(
                "[SCHEDULER] Falha na execução imediata (servidor segue ativo):",
                erro?.message || erro
            );
        });

    timer = setInterval(() => {
        Promise.resolve()
            .then(() => executarCiclo())
            .catch((erro) => {
                console.error(
                    "[SCHEDULER] Falha no ciclo agendado (servidor segue ativo):",
                    erro?.message || erro
                );
            });
    }, intervaloMs);
}

function pararScheduler() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        console.log("[SCHEDULER] Intervalo limpo");
    }
    iniciado = false;
}

module.exports = {
    iniciarScheduler,
    pararScheduler,
    executarCiclo,
    lerIntervaloMinutos
};
