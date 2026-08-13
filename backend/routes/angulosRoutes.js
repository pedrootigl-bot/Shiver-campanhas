const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const { validarCampanha } = require("../services/campanhaValidacao.service");

function normalizarAngulosPayload(lista = []) {
    const origem = Array.isArray(lista) ? lista : [];

    return origem
        .map((item, index) => {
            const titulo = String(item?.titulo || "").trim();
            const descricao = String(item?.descricao || "").trim();

            if (!titulo && !descricao) return null;

            return {
                titulo: titulo || `Ângulo ${index + 1}`,
                descricao: descricao || null,
                ordem:
                    item?.ordem !== "" &&
                    item?.ordem !== undefined &&
                    item?.ordem !== null
                        ? Number(item.ordem)
                        : index + 1
            };
        })
        .filter(Boolean);
}

// ======================================================
// SINCRONIZAR ÂNGULOS DE UMA CAMPANHA
// PUT /api/angulos/:campanha_id
// Substitui todos os ângulos pelos enviados no body
// ======================================================

router.put("/:campanha_id", requireAuth, async (req, res) => {

    try {

        const campanhaId = Number(req.params.campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        const angulos = normalizarAngulosPayload(req.body?.angulos);

        const { error: erroDelete } = await supabase
            .from("angulos_divulgacao")
            .delete()
            .eq("campanha_id", campanhaId);

        if (erroDelete) {
            return responderErroInterno(
                res,
                erroDelete,
                "Erro ao limpar ângulos da campanha"
            );
        }

        if (angulos.length === 0) {
            let validacaoVazia;

            try {
                validacaoVazia = await validarCampanha(campanhaId);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após limpar ângulos"
                );
            }

            return res.json({
                mensagem: "Ângulos sincronizados",
                angulos: [],
                validacao: validacaoVazia
            });
        }

        const payload = angulos.map((angulo) => ({
            campanha_id: campanhaId,
            titulo: angulo.titulo,
            descricao: angulo.descricao,
            ordem: angulo.ordem
        }));

        const { data, error } = await supabase
            .from("angulos_divulgacao")
            .insert(payload)
            .select("*");

        if (error) {
            // Fallback se a coluna ordem ainda não existir no banco
            const mensagem = String(error.message || "").toLowerCase();
            const semColunaOrdem =
                mensagem.includes("ordem") &&
                (mensagem.includes("column") || mensagem.includes("schema"));

            if (semColunaOrdem) {
                const payloadSemOrdem = payload.map(({ ordem, ...resto }) => resto);
                const retry = await supabase
                    .from("angulos_divulgacao")
                    .insert(payloadSemOrdem)
                    .select("*");

                if (retry.error) {
                    return responderErroInterno(
                        res,
                        retry.error,
                        "Erro ao salvar ângulos"
                    );
                }

                let validacaoRetry;

                try {
                    validacaoRetry = await validarCampanha(campanhaId);
                } catch (erroValidacao) {
                    return responderErroInterno(
                        res,
                        erroValidacao,
                        "Erro ao validar campanha após sincronizar ângulos"
                    );
                }

                return res.json({
                    mensagem: "Ângulos sincronizados",
                    angulos: retry.data || [],
                    validacao: validacaoRetry
                });
            }

            return responderErroInterno(
                res,
                error,
                "Erro ao salvar ângulos"
            );
        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após sincronizar ângulos"
            );
        }

        return res.json({
            mensagem: "Ângulos sincronizados",
            angulos: data || [],
            validacao
        });

    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao sincronizar ângulos"
        );
    }

});

// ======================================================
// CRIAR ÂNGULO
// POST /api/angulos
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

        const tituloFinal = String(titulo || "").trim() || "Ângulo";

        const novoAngulo = {
            campanha_id: campanhaId,
            titulo: tituloFinal,
            descricao: descricao?.trim() || null,
            ordem:
                ordem !== "" &&
                ordem !== undefined &&
                ordem !== null
                    ? Number(ordem)
                    : 1
        };

        let { data, error } = await supabase
            .from("angulos_divulgacao")
            .insert([novoAngulo])
            .select()
            .single();

        if (error) {
            const mensagem = String(error.message || "").toLowerCase();
            const semColunaOrdem =
                mensagem.includes("ordem") &&
                (mensagem.includes("column") || mensagem.includes("schema"));

            if (semColunaOrdem) {
                const { ordem: _ordem, ...semOrdem } = novoAngulo;
                const retry = await supabase
                    .from("angulos_divulgacao")
                    .insert([semOrdem])
                    .select()
                    .single();

                data = retry.data;
                error = retry.error;
            }
        }

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao criar ângulo"
            );
        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após criar ângulo"
            );
        }

        return res.status(201).json({
            mensagem: "Ângulo criado com sucesso",
            angulo: data,
            validacao
        });

    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao criar ângulo"
        );
    }

});

// ======================================================
// BUSCAR ÂNGULOS DE UMA CAMPANHA
// GET /api/angulos/:campanha_id
// ======================================================

router.get("/:campanha_id", async (req, res) => {

    try {

        const { campanha_id } = req.params;
        const campanhaId = Number(campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        let { data, error } = await supabase
            .from("angulos_divulgacao")
            .select("*")
            .eq("campanha_id", campanhaId)
            .order("ordem", { ascending: true });

        // Fallback se a coluna ordem não existir
        if (error) {
            const mensagem = String(error.message || "").toLowerCase();
            const semColunaOrdem =
                mensagem.includes("ordem") &&
                (mensagem.includes("column") || mensagem.includes("schema"));

            if (semColunaOrdem) {
                const retry = await supabase
                    .from("angulos_divulgacao")
                    .select("*")
                    .eq("campanha_id", campanhaId)
                    .order("id", { ascending: true });

                data = retry.data;
                error = retry.error;
            }
        }

        if (error) {
            console.error("Erro ao buscar ângulos:", error);
            return res.status(500).json({
                erro: "Erro interno do servidor",
                detalhe: error.message
            });
        }

        res.json(data || []);

    } catch (error) {
        console.error("Erro interno ao buscar ângulos:", error);
        res.status(500).json({
            erro: "Erro interno do servidor"
        });
    }

});


module.exports = router;
