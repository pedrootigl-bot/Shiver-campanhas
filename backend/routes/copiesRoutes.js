const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const { validarCampanha } = require("../services/campanhaValidacao.service");

function normalizarCopiesPayload(lista = []) {
    const origem = Array.isArray(lista) ? lista : [];

    return origem
        .map((item, index) => {
            const titulo = String(item?.titulo || "").trim();
            const texto = String(item?.texto || "").trim();
            const canal = String(item?.canal || "").trim();
            const tipo = String(item?.tipo || "").trim();

            if (!titulo && !texto && !canal && !tipo) return null;

            return {
                titulo: titulo || `Copy ${index + 1}`,
                texto: texto || "",
                canal: canal || null,
                tipo: tipo || null,
                ordem:
                    item?.ordem !== "" &&
                    item?.ordem !== undefined &&
                    item?.ordem !== null
                        ? Number(item.ordem)
                        : index + 1
            };
        })
        .filter(Boolean)
        .filter((item) => item.titulo && item.texto);
}

// ======================================================
// SINCRONIZAR COPIES DE UMA CAMPANHA
// PUT /api/copies/por-campanha/:campanha_id
// ======================================================

router.put("/por-campanha/:campanha_id", requireAuth, async (req, res) => {
    try {
        const campanhaId = Number(req.params.campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        const copies = normalizarCopiesPayload(req.body?.copies);

        const { error: erroDelete } = await supabase
            .from("copies")
            .delete()
            .eq("campanha_id", campanhaId);

        if (erroDelete) {
            return responderErroInterno(
                res,
                erroDelete,
                "Erro ao limpar copies da campanha"
            );
        }

        if (copies.length === 0) {
            let validacaoVazia;

            try {
                validacaoVazia = await validarCampanha(campanhaId);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após limpar copies"
                );
            }

            return res.json({
                mensagem: "Copies sincronizadas",
                copies: [],
                validacao: validacaoVazia
            });
        }

        const payload = copies.map((copy) => ({
            campanha_id: campanhaId,
            titulo: copy.titulo,
            texto: copy.texto,
            canal: copy.canal,
            tipo: copy.tipo,
            ordem: copy.ordem
        }));

        const { data, error } = await supabase
            .from("copies")
            .insert(payload)
            .select("*");

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao salvar copies"
            );
        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após sincronizar copies"
            );
        }

        return res.json({
            mensagem: "Copies sincronizadas",
            copies: data || [],
            validacao
        });
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao sincronizar copies"
        );
    }
});

// ======================================================
// CRIAR COPY
// POST /api/copies
// ======================================================

router.post("/", requireAuth, async (req, res) => {
    try {
        const {
            campanha_id,
            titulo,
            texto,
            canal,
            tipo,
            ordem
        } = req.body;

        const campanhaId = Number(campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "O campanha_id é obrigatório"
            });
        }

        if (!titulo || !String(titulo).trim()) {
            return res.status(400).json({
                erro: "O título da copy é obrigatório"
            });
        }

        if (!texto || !String(texto).trim()) {
            return res.status(400).json({
                erro: "O texto da copy é obrigatório"
            });
        }

        const novaCopy = {
            campanha_id: campanhaId,
            titulo: String(titulo).trim(),
            texto: String(texto).trim(),
            canal: canal?.trim() || null,
            tipo: tipo?.trim() || null,
            ordem:
                ordem !== "" &&
                ordem !== undefined &&
                ordem !== null
                    ? Number(ordem)
                    : 1
        };

        const { data, error } = await supabase
            .from("copies")
            .insert([novaCopy])
            .select()
            .single();

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao criar copy"
            );
        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após criar copy"
            );
        }

        return res.status(201).json({
            mensagem: "Copy criada com sucesso",
            copy: data,
            validacao
        });
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao criar copy"
        );
    }
});

// ======================================================
// BUSCAR COPIES POR CAMPANHA
// GET /api/copies/:campanha_id
// ======================================================

router.get("/:campanha_id", async (req, res) => {
    try {
        const campanhaId = Number(req.params.campanha_id);

        if (!campanhaId) {
            return res.status(400).json({
                erro: "campanha_id inválido"
            });
        }

        const { data, error } = await supabase
            .from("copies")
            .select("*")
            .eq("campanha_id", campanhaId)
            .order("ordem", { ascending: true });

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao buscar copies"
            );
        }

        res.json(data || []);
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao buscar copies"
        );
    }
});

// ======================================================
// ATUALIZAR COPY
// PUT /api/copies/:id
// ======================================================

router.put("/:id", requireAuth, async (req, res) => {
    try {
        const copyId = Number(req.params.id);

        if (!copyId) {
            return res.status(400).json({
                erro: "id inválido"
            });
        }

        const { titulo, texto, canal, tipo, ordem } = req.body;

        if (!titulo || !String(titulo).trim()) {
            return res.status(400).json({
                erro: "O título da copy é obrigatório"
            });
        }

        if (!texto || !String(texto).trim()) {
            return res.status(400).json({
                erro: "O texto da copy é obrigatório"
            });
        }

        const atualizacao = {
            titulo: String(titulo).trim(),
            texto: String(texto).trim(),
            canal: canal?.trim() || null,
            tipo: tipo?.trim() || null,
            ordem:
                ordem !== "" &&
                ordem !== undefined &&
                ordem !== null
                    ? Number(ordem)
                    : 1
        };

        const { data, error } = await supabase
            .from("copies")
            .update(atualizacao)
            .eq("id", copyId)
            .select()
            .single();

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao atualizar copy"
            );
        }

        let validacao = null;

        if (data?.campanha_id) {
            try {
                validacao = await validarCampanha(data.campanha_id);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após atualizar copy"
                );
            }
        }

        return res.json({
            mensagem: "Copy atualizada com sucesso",
            copy: data,
            validacao
        });
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao atualizar copy"
        );
    }
});

// ======================================================
// EXCLUIR COPY
// DELETE /api/copies/:id
// ======================================================

router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const copyId = Number(req.params.id);

        if (!copyId) {
            return res.status(400).json({
                erro: "id inválido"
            });
        }

        const { data: copy, error: erroBusca } = await supabase
            .from("copies")
            .select("id, campanha_id")
            .eq("id", copyId)
            .single();

        if (erroBusca || !copy) {
            return res.status(404).json({
                erro: "Copy não encontrada"
            });
        }

        const { error } = await supabase
            .from("copies")
            .delete()
            .eq("id", copyId);

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao excluir copy"
            );
        }

        let validacao = null;

        if (copy.campanha_id) {
            try {
                validacao = await validarCampanha(copy.campanha_id);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após excluir copy"
                );
            }
        }

        return res.json({
            mensagem: "Copy excluída com sucesso",
            validacao
        });
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno ao excluir copy"
        );
    }
});

module.exports = router;
