const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const { validarCampanha } = require("../services/campanhaValidacao.service");


function normalizarRegrasPayload(lista = []) {
    const origem = Array.isArray(lista) ? lista : [];

    return origem
        .map((item, index) => {
            const titulo = String(item?.titulo || "").trim();
            const descricao = String(item?.descricao || "").trim();

            if (!titulo && !descricao) return null;

            return {
                titulo: titulo || `Regra ${index + 1}`,
                descricao: descricao || null,
                ordem:
                    item?.ordem !== "" &&
                    item?.ordem !== undefined &&
                    item?.ordem !== null &&
                    !Number.isNaN(Number(item.ordem))
                        ? Number(item.ordem)
                        : index + 1
            };
        })
        .filter(Boolean);
}


function erroSupabase(res, error, contexto) {
    console.error(contexto + ":", error);
    return res.status(500).json({
        erro: contexto,
        detalhe: error?.message || String(error)
    });
}


// ======================================================
// SINCRONIZAR REGRAS DE UMA CAMPANHA
// PUT /api/regras/por-campanha/:campanha_id
// ======================================================

router.put("/por-campanha/:campanha_id", requireAuth, async (req, res) => {

    try {

        const campanhaId = Number(req.params.campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        const regras = normalizarRegrasPayload(req.body?.regras);

        const { error: erroDelete } = await supabase
            .from("regras")
            .delete()
            .eq("campanha_id", campanhaId);

        if (erroDelete) {
            return erroSupabase(
                res,
                erroDelete,
                "Erro ao limpar regras da campanha"
            );
        }

        if (regras.length === 0) {
            let validacaoVazia;

            try {
                validacaoVazia = await validarCampanha(campanhaId);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após limpar regras"
                );
            }

            return res.json({
                mensagem: "Regras sincronizadas",
                regras: [],
                validacao: validacaoVazia
            });
        }

        const payload = regras.map((regra) => ({
            campanha_id: campanhaId,
            titulo: regra.titulo,
            descricao: regra.descricao,
            ordem: regra.ordem
        }));

        const { data, error } = await supabase
            .from("regras")
            .insert(payload)
            .select("*");

        if (error) {
            // Tenta inserir uma a uma para isolar falha
            const salvas = [];

            for (const item of payload) {
                const tentativa = await supabase
                    .from("regras")
                    .insert([item])
                    .select("*")
                    .single();

                if (tentativa.error) {
                    return erroSupabase(
                        res,
                        tentativa.error,
                        `Erro ao salvar regra "${item.titulo}"`
                    );
                }

                salvas.push(tentativa.data);
            }

            let validacaoFallback;

            try {
                validacaoFallback = await validarCampanha(campanhaId);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após sincronizar regras"
                );
            }

            return res.json({
                mensagem: "Regras sincronizadas",
                regras: salvas,
                validacao: validacaoFallback
            });
        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após sincronizar regras"
            );
        }

        return res.json({
            mensagem: "Regras sincronizadas",
            regras: data || [],
            validacao
        });

    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao sincronizar regras"
        );

    }

});


// ======================================================
// CRIAR REGRA
// POST /api/regras
// ======================================================

router.post("/", requireAuth, async (req, res) => {

    try {

        const {
            campanha_id,
            titulo,
            descricao,
            ordem
        } = req.body;

        const campanhaId = Number(campanha_id);

        if (!campanhaId) {

            return res.status(400).json({
                erro: "O campanha_id é obrigatório"
            });

        }

        const tituloFinal = String(titulo || "").trim() || "Regra";


        const novaRegra = {

            campanha_id: campanhaId,

            titulo: tituloFinal,

            descricao:
                descricao?.trim() || null,

            ordem:
                ordem !== "" &&
                ordem !== undefined &&
                ordem !== null
                    ? Number(ordem)
                    : 1

        };


        const { data, error } = await supabase
            .from("regras")
            .insert([novaRegra])
            .select()
            .single();


        if (error) {

            return erroSupabase(
                res,
                error,
                "Erro ao criar regra"
            );

        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após criar regra"
            );
        }

        return res.status(201).json({

            mensagem: "Regra criada com sucesso",

            regra: data,

            validacao

        });


    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao criar regra"
        );

    }

});


// ======================================================
// BUSCAR REGRAS POR CAMPANHA
// GET /api/regras/:campanha_id
// ======================================================

router.get("/:campanha_id", async (req, res) => {

    try {

        const campanhaId = Number(req.params.campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        let { data, error } = await supabase
            .from("regras")
            .select("*")
            .eq("campanha_id", campanhaId)
            .order("ordem", { ascending: true });

        if (error) {
            const mensagem = String(error.message || "").toLowerCase();
            const semOrdem =
                mensagem.includes("ordem") &&
                (mensagem.includes("column") || mensagem.includes("schema"));

            if (semOrdem) {
                const retry = await supabase
                    .from("regras")
                    .select("*")
                    .eq("campanha_id", campanhaId)
                    .order("id", { ascending: true });

                data = retry.data;
                error = retry.error;
            }
        }


        if (error) {

            return erroSupabase(
                res,
                error,
                "Erro ao buscar regras"
            );

        }


        res.json(data || []);

    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao buscar regras"
        );

    }

});


module.exports = router;
