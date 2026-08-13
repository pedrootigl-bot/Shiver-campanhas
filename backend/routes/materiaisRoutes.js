const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const { validarCampanha } = require("../services/campanhaValidacao.service");

const FORMATOS_VALIDOS = new Set([
    "stories",
    "feed",
    "videos",
    "banners"
]);

/**
 * formato = categoria da postagem (stories|feed|videos|banners)
 * Não confundir com tipo (imagem|video|arquivo).
 */
function normalizarFormato(valor) {
    const bruto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (!bruto) return null;

    if (FORMATOS_VALIDOS.has(bruto)) {
        return bruto;
    }

    if (bruto.includes("stor")) return "stories";
    if (bruto.includes("feed")) return "feed";
    if (bruto.includes("video")) return "videos";
    if (bruto.includes("banner")) return "banners";

    return null;
}

/**
 * tipo = tipo do arquivo (imagem|video|arquivo)
 * Ignora valores legados que eram categorias de postagem.
 */
function normalizarTipoArquivo(valor) {
    const bruto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (!bruto) return null;

    // Valores antigos do form (Stories/Feed/...) não são tipo de arquivo
    if (FORMATOS_VALIDOS.has(bruto) || bruto === "story" || bruto === "banner") {
        return null;
    }

    if (bruto.includes("video")) return "video";
    if (
        bruto.includes("image")
        || bruto.includes("imagem")
        || bruto.includes("img")
    ) {
        return "imagem";
    }
    if (bruto.includes("arquivo") || bruto.includes("file") || bruto.includes("pdf")) {
        return "arquivo";
    }

    return bruto;
}


// ======================================================
// CRIAR MATERIAL
// POST /api/materiais
// Campos: campanha_id, nome, tipo, formato, url
// ======================================================

router.post("/", requireAuth, async (req, res) => {

    try {

        const {
            campanha_id,
            nome,
            tipo,
            formato,
            url
        } = req.body;

        const campanhaId = Number(campanha_id);

        if (!campanhaId) {

            return res.status(400).json({
                erro: "O campanha_id é obrigatório"
            });

        }


        if (!nome || !String(nome).trim()) {

            return res.status(400).json({
                erro: "O nome do material é obrigatório"
            });

        }


        const novoMaterial = {

            campanha_id: campanhaId,

            nome: String(nome).trim(),

            tipo: normalizarTipoArquivo(tipo),

            formato: normalizarFormato(formato),

            url:
                url?.trim() || null

        };


        const { data, error } = await supabase
            .from("materiais")
            .insert([novoMaterial])
            .select()
            .single();


        if (error) {

            return responderErroInterno(
                res,
                error,
                "Erro ao criar material"
            );

        }

        let validacao;

        try {
            validacao = await validarCampanha(campanhaId);
        } catch (erroValidacao) {
            return responderErroInterno(
                res,
                erroValidacao,
                "Erro ao validar campanha após criar material"
            );
        }

        return res.status(201).json({

            mensagem: "Material criado com sucesso",

            material: data,

            validacao

        });


    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao criar material"
        );

    }

});


// ======================================================
// BUSCAR MATERIAIS POR CAMPANHA
// GET /api/materiais/:campanha_id
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
            .from("materiais")
            .select("*")
            .eq("campanha_id", campanhaId)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            return responderErroInterno(
                res,
                error,
                "Erro ao buscar materiais"
            );

        }


        res.json(data);


    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro ao buscar materiais"
        );

    }

});


// ======================================================
// ATUALIZAR MATERIAL
// PUT /api/materiais/:id
// ======================================================

router.put("/:id", requireAuth, async (req, res) => {

    try {

        const materialId = Number(req.params.id);

        if (!materialId) {
            return res.status(400).json({
                erro: "id inválido"
            });
        }

        const { nome, tipo, formato, url } = req.body;

        if (!nome || !String(nome).trim()) {
            return res.status(400).json({
                erro: "O nome do material é obrigatório"
            });
        }

        const atualizacao = {
            nome: String(nome).trim(),
            tipo: normalizarTipoArquivo(tipo),
            formato: normalizarFormato(formato),
            url: url?.trim() || null
        };

        const { data, error } = await supabase
            .from("materiais")
            .update(atualizacao)
            .eq("id", materialId)
            .select()
            .single();

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao atualizar material"
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
                    "Erro ao validar campanha após atualizar material"
                );
            }
        }

        return res.json({
            mensagem: "Material atualizado com sucesso",
            material: data,
            validacao
        });

    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao atualizar material"
        );

    }

});


// ======================================================
// EXCLUIR MATERIAL
// DELETE /api/materiais/:id
// ======================================================

router.delete("/:id", requireAuth, async (req, res) => {

    try {

        const materialId = Number(req.params.id);

        if (!materialId) {
            return res.status(400).json({
                erro: "id inválido"
            });
        }

        const { data: material, error: erroBusca } = await supabase
            .from("materiais")
            .select("id, campanha_id")
            .eq("id", materialId)
            .single();

        if (erroBusca || !material) {
            return res.status(404).json({
                erro: "Material não encontrado"
            });
        }

        const { error } = await supabase
            .from("materiais")
            .delete()
            .eq("id", materialId);

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao excluir material"
            );
        }

        let validacao = null;

        if (material.campanha_id) {
            try {
                validacao = await validarCampanha(material.campanha_id);
            } catch (erroValidacao) {
                return responderErroInterno(
                    res,
                    erroValidacao,
                    "Erro ao validar campanha após excluir material"
                );
            }
        }

        return res.json({
            mensagem: "Material excluído com sucesso",
            validacao
        });

    } catch (error) {

        return responderErroInterno(
            res,
            error,
            "Erro interno ao excluir material"
        );

    }

});


module.exports = router;
