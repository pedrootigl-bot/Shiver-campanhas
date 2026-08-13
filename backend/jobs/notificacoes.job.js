/**
 * Job: sincroniza notificações de ciclo de vida das campanhas.
 * Reutiliza diretamente o service (sem HTTP interno).
 */

const {
    sincronizarNotificacoesCampanhas
} = require("../services/notificacoes.service");

async function executarJobNotificacoes() {
    console.log("[JOB:NOTIFICACOES] Início");

    const resultado = await sincronizarNotificacoesCampanhas();

    console.log(
        `[JOB:NOTIFICACOES] Concluído — campanhas=${resultado.campanhas}, criadas=${resultado.criadas}`
    );

    return resultado;
}

module.exports = {
    executarJobNotificacoes
};
