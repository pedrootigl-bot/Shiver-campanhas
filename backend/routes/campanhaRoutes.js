const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const {
    calcularStatusPorDatas,
    sincronizarStatusCampanhas,
    sincronizarStatusCampanha
} = require("../utils/campanhaStatus");
const {
    sincronizarNotificacoesCampanhas
} = require("../services/notificacoes.service");
const { validarCampanha } = require("../services/campanhaValidacao.service");
const {
    listarHistorico,
    registrarAtualizacao,
    registrarCriacao,
    registrarExclusao
} = require("../services/campanhaHistorico.service");


// ======================================================
// BUSCAR TODAS AS CAMPANHAS
// GET /api/campanhas
// Sincroniza status (agendada/ativa/finalizada) pelas datas
// ======================================================

router.get("/", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("campanhas")
            .select("*")
            .order("id", { ascending: false });


        if (error) {

            console.error("Erro ao buscar campanhas:", error);

            return responderErroInterno(
                res,
                error,
                "Erro ao buscar campanhas"
            );

        }


        const sincronizadas = await sincronizarStatusCampanhas(
            supabase,
            data || []
        );

        res.json(sincronizadas);

    } catch (error) {

        return responderErroInterno(res, error, "Erro interno");

    }

});


// ======================================================
// SINCRONIZAR STATUS MANUALMENTE (admin / cron futuro)
// POST /api/campanhas/sincronizar-status
// ======================================================

router.post("/sincronizar-status", requireAuth, async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("campanhas")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao buscar campanhas para sincronizar"
            );
        }

        const sincronizadas = await sincronizarStatusCampanhas(
            supabase,
            data || []
        );

        // Também gera notificações de ciclo de vida (sem duplicar)
        let notificacoesCriadas = 0;
        try {
            const resultadoNotif = await sincronizarNotificacoesCampanhas();
            notificacoesCriadas = Number(resultadoNotif?.criadas) || 0;
        } catch (erroNotif) {
            console.error(
                "Aviso: falha ao sincronizar notificações após status:",
                erroNotif
            );
        }

        return res.json({
            mensagem: "Status sincronizados com sucesso",
            total: sincronizadas.length,
            notificacoes_criadas: notificacoesCriadas,
            campanhas: sincronizadas
        });

    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro ao sincronizar status das campanhas"
        );

    }

});


// ======================================================
// HISTÓRICO DA CAMPANHA (admin autenticado)
// GET /api/campanhas/historico/:id
// ======================================================

router.get("/historico/:id", requireAuth, async (req, res) => {
    try {
        const campanhaId = Number(req.params.id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "ID da campanha inválido"
            });
        }

        const historico = await listarHistorico(campanhaId);

        return res.json({
            historico
        });
    } catch (error) {
        if (error?.statusCode === 400) {
            return res.status(400).json({
                erro: error.message
            });
        }

        return responderErroInterno(
            res,
            error,
            "Erro ao buscar histórico da campanha"
        );
    }
});


// ======================================================
// BUSCAR UMA CAMPANHA PELO ID
// GET /api/campanhas/:id
// ======================================================

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;
        const campanhaId = Number(id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "ID da campanha inválido"
            });
        }


        const { data, error } = await supabase
            .from("campanhas")
            .select("*")
            .eq("id", campanhaId)
            .single();


        if (error) {

            console.error("Erro ao buscar campanha:", error);

            return res.status(404).json({
                erro: "Campanha não encontrada"
            });

        }


        const sincronizada = await sincronizarStatusCampanha(
            supabase,
            data
        );

        res.json(sincronizada);

    } catch (error) {

        return responderErroInterno(res, error, "Erro interno");

    }

});


// ======================================================
// CRIAR CAMPANHA
// POST /api/campanhas
// ======================================================

router.post("/", requireAuth, async (req, res) => {

    try {

        const {
            titulo,
            texto_header,
            descricao,
            categoria,
            objetivo,
            resumo,
            publico_recomendado,
            mecanica,
            premio,
            cupom,
            deposito_minimo,
            data_inicio,
            data_fim,
            status,
            imagem_card
        } = req.body;


        // ==================================================
        // VALIDAÇÕES
        // ==================================================

        if (!titulo || !titulo.trim()) {

            return res.status(400).json({
                erro: "O título da campanha é obrigatório"
            });

        }


        if (!data_inicio) {

            return res.status(400).json({
                erro: "A data de início é obrigatória"
            });

        }


        if (!data_fim) {

            return res.status(400).json({
                erro: "A data de fim é obrigatória"
            });

        }


        // ==================================================
        // OBJETO DA CAMPANHA
        // ==================================================

        const novaCampanha = {

            titulo: titulo.trim(),

            texto_header:
                texto_header?.trim() || null,

            descricao:
                descricao?.trim() || "",

            resumo:
                resumo?.trim() || null,

            categoria:
                categoria?.trim() || null,

            objetivo:
                objetivo?.trim() || null,

            publico_recomendado:
                publico_recomendado?.trim() || null,

            mecanica: Array.isArray(mecanica)
                ? mecanica
                    .map((item) => String(item || "").trim())
                    .filter(Boolean)
                : (
                    typeof mecanica === "string" && mecanica.trim()
                        ? [mecanica.trim()]
                        : null
                ),

            premio:
                premio?.trim() || null,

            cupom:
                cupom?.trim() || null,

            deposito_minimo:
                deposito_minimo !== "" &&
                deposito_minimo !== undefined &&
                deposito_minimo !== null
                    ? String(deposito_minimo)
                    : null,

            data_inicio,

            data_fim,

            // Datas mandam: status calculado automaticamente
            status: calcularStatusPorDatas(data_inicio, data_fim),

            imagem_card:
                imagem_card?.trim() || null

        };


        // ==================================================
        // INSERIR NO SUPABASE
        // ==================================================

        const { data, error } = await supabase
            .from("campanhas")
            .insert([novaCampanha])
            .select()
            .single();


        if (error) {

            return responderErroInterno(
                res,
                error,
                "Erro ao criar campanha"
            );

        }

        let validacao;

        try {
            validacao = await validarCampanha(data.id);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após criação"
            );
        }

        await registrarCriacao({
            campanha: data,
            usuario: req.user
        });

        // ==================================================
        // RESPOSTA
        // ==================================================

        return res.status(201).json({

            mensagem: "Campanha criada com sucesso",

            campanha: {
                ...data,
                pronta_publicacao: validacao.pronta
            },

            validacao

        });


    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao criar campanha"
        );

    }

});

// ======================================================
// ATUALIZAR CAMPANHA
// PUT /api/campanhas/:id
// ======================================================

router.put("/:id", requireAuth, async (req, res) => {

    try {

        const { id } = req.params;
        const campanhaId = Number(id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "ID da campanha inválido"
            });
        }

        const {
            titulo,
            texto_header,
            descricao,
            categoria,
            objetivo,
            resumo,
            publico_recomendado,
            mecanica,
            premio,
            cupom,
            deposito_minimo,
            data_inicio,
            data_fim,
            status,
            imagem_card
        } = req.body;


        // ==============================================
        // VALIDAÇÕES
        // ==============================================

        if (!titulo || !titulo.trim()) {

            return res.status(400).json({
                erro: "O título da campanha é obrigatório"
            });

        }


        if (!data_inicio) {

            return res.status(400).json({
                erro: "A data de início é obrigatória"
            });

        }


        if (!data_fim) {

            return res.status(400).json({
                erro: "A data de fim é obrigatória"
            });

        }

        const { data: campanhaAnterior, error: erroAnterior } = await supabase
            .from("campanhas")
            .select("*")
            .eq("id", campanhaId)
            .single();

        if (erroAnterior || !campanhaAnterior) {
            return res.status(404).json({
                erro: "Campanha não encontrada"
            });
        }


        // ==============================================
        // DADOS ATUALIZADOS
        // ==============================================

        const campanhaAtualizada = {

            titulo: titulo.trim(),

            texto_header:
                texto_header?.trim() || null,

            descricao:
                descricao?.trim() || "",

            resumo:
                resumo?.trim() || null,

            categoria:
                categoria?.trim() || null,

            objetivo:
                objetivo?.trim() || null,

            publico_recomendado:
                publico_recomendado?.trim() || null,

            mecanica: Array.isArray(mecanica)
                ? mecanica
                    .map((item) => String(item || "").trim())
                    .filter(Boolean)
                : (
                    typeof mecanica === "string" && mecanica.trim()
                        ? [mecanica.trim()]
                        : null
                ),

            premio:
                premio?.trim() || null,

            cupom:
                cupom?.trim() || null,

            deposito_minimo:
                deposito_minimo !== "" &&
                deposito_minimo !== undefined &&
                deposito_minimo !== null
                    ? String(deposito_minimo)
                    : null,

            data_inicio,

            data_fim,

            // Datas mandam: status calculado automaticamente
            status: calcularStatusPorDatas(data_inicio, data_fim),

            imagem_card:
                imagem_card?.trim() || null

        };


        // ==============================================
        // UPDATE
        // ==============================================

        const { data, error } = await supabase
            .from("campanhas")
            .update(campanhaAtualizada)
            .eq("id", campanhaId)
            .select()
            .single();


        if (error) {

            return responderErroInterno(
                res,
                error,
                "Erro ao atualizar campanha"
            );

        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após atualização"
            );
        }

        await registrarAtualizacao({
            campanhaId,
            anterior: campanhaAnterior,
            atual: campanhaAtualizada,
            usuario: req.user
        });

        // ==============================================
        // RESPOSTA
        // ==============================================

        return res.json({

            mensagem: "Campanha atualizada com sucesso",

            campanha: {
                ...data,
                pronta_publicacao: validacao.pronta
            },

            validacao

        });


    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao atualizar campanha"
        );

    }

});


// ======================================================
// EXCLUIR CAMPANHA
// DELETE /api/campanhas/:id
// ======================================================

router.delete("/:id", requireAuth, async (req, res) => {

    try {

        const { id } = req.params;
        const campanhaId = Number(id);

        if (!campanhaId) {

            return res.status(400).json({
                erro: "ID da campanha inválido"
            });

        }


        // Confere se a campanha existe (snapshot completo para auditoria)
        const { data: campanha, error: erroBusca } = await supabase
            .from("campanhas")
            .select("*")
            .eq("id", campanhaId)
            .single();


        if (erroBusca || !campanha) {

            return res.status(404).json({
                erro: "Campanha não encontrada"
            });

        }


        // Remove vínculos antes da campanha (evita erro de FK)
        const tabelasRelacionadas = [
            "copies",
            "regras",
            "materiais",
            "kits",
            "angulos_divulgacao"
        ];

        for (const tabela of tabelasRelacionadas) {

            const { error: erroRelacionado } = await supabase
                .from(tabela)
                .delete()
                .eq("campanha_id", campanhaId);

            if (erroRelacionado) {

                // Se a tabela não existir no banco, segue; outros erros param a exclusão
                const mensagem = String(erroRelacionado.message || "");
                const tabelaInexistente =
                    mensagem.toLowerCase().includes("does not exist") ||
                    mensagem.toLowerCase().includes("não existe") ||
                    erroRelacionado.code === "42P01" ||
                    erroRelacionado.code === "PGRST205";

                if (!tabelaInexistente) {

                    return responderErroInterno(
                        res,
                        erroRelacionado,
                        `Erro ao excluir ${tabela}`
                    );

                }

            }

        }

        await registrarExclusao({
            campanha,
            usuario: req.user
        });


        const { error: erroCampanha } = await supabase
            .from("campanhas")
            .delete()
            .eq("id", campanhaId);


        if (erroCampanha) {

            return responderErroInterno(
                res,
                erroCampanha,
                "Erro ao excluir campanha"
            );

        }


        return res.json({
            mensagem: "Campanha excluída com sucesso",
            id: campanhaId
        });


    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao excluir campanha"
        );

    }

});


module.exports = router;