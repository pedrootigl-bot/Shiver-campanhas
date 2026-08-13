const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const {
    listarNotificacoes,
    contarNaoLidas,
    marcarComoLida,
    sincronizarNotificacoesCampanhas
} = require("../services/notificacoes.service");

// ======================================================
// LISTAR NOTIFICAÇÕES
// GET /api/notificacoes
// Gera eventos de campanha pendentes e devolve a lista
// ======================================================

router.get("/", requireAuth, async (req, res) => {
    try {
        // Automação: sincroniza status + cria notificações faltantes
        try {
            await sincronizarNotificacoesCampanhas();
        } catch (erroSync) {
            console.error(
                "Aviso: falha ao sincronizar notificações de campanha:",
                erroSync
            );
        }

        const [notificacoes, naoLidas] = await Promise.all([
            listarNotificacoes({ limit: 50 }),
            contarNaoLidas()
        ]);

        return res.json({
            notificacoes,
            nao_lidas: naoLidas
        });
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro ao buscar notificações"
        );
    }
});

// ======================================================
// SINCRONIZAR EVENTOS (cron / manual)
// POST /api/notificacoes/sincronizar
// ======================================================

router.post("/sincronizar", requireAuth, async (req, res) => {
    try {
        const resultado = await sincronizarNotificacoesCampanhas();
        return res.json({
            mensagem: "Notificações sincronizadas",
            ...resultado
        });
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro ao sincronizar notificações"
        );
    }
});

// ======================================================
// MARCAR COMO LIDA
// PATCH /api/notificacoes/:id/lida
// ======================================================

router.patch("/:id/lida", requireAuth, async (req, res) => {
    try {
        const notificacao = await marcarComoLida(req.params.id);

        return res.json({
            mensagem: "Notificação marcada como lida",
            notificacao
        });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({
                erro: error.message
            });
        }

        return responderErroInterno(
            res,
            error,
            "Erro ao marcar notificação como lida"
        );
    }
});

module.exports = router;
