const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");
const { responderErroInterno } = require("../utils/httpErrors");
const {
    sincronizarStatusComConfirmacaoData
} = require("../utils/campanhaStatus");

function campanhaPublica(campanha) {
    const status = String(campanha?.status || "")
        .toLowerCase()
        .trim();

    return status === "ativa";
}

function agruparPorCampanha(lista) {
    const mapa = new Map();

    for (const item of lista || []) {
        const id = Number(item.campanha_id);
        if (!Number.isFinite(id) || id <= 0) continue;
        if (!mapa.has(id)) mapa.set(id, []);
        mapa.get(id).push(item);
    }

    return mapa;
}

/**
 * GET /api/partner-hub/campanhas
 * Campanhas ativas com materiais, copies, regras, ângulos, kits e destaque.
 */
router.get("/campanhas", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("campanhas")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao buscar campanhas do partner hub"
            );
        }

        const sincronizadas = await sincronizarStatusComConfirmacaoData(
            supabase,
            data || []
        );
        const publicas = sincronizadas.filter(campanhaPublica);
        const ids = publicas.map((campanha) => Number(campanha.id));

        if (ids.length === 0) {
            return res.json([]);
        }

        const [
            materiaisRes,
            copiesRes,
            regrasRes,
            angulosRes,
            kitsRes,
            destaqueRes
        ] = await Promise.all([
            supabase.from("materiais").select("*").in("campanha_id", ids),
            supabase.from("copies").select("*").in("campanha_id", ids),
            supabase.from("regras").select("*").in("campanha_id", ids),
            supabase.from("angulos_divulgacao").select("*").in("campanha_id", ids),
            supabase.from("kits").select("*").in("campanha_id", ids),
            supabase
                .from("destaques")
                .select("*")
                .eq("ativo", true)
                .order("created_at", { ascending: false })
                .limit(1)
        ]);

        if (materiaisRes.error) {
            return responderErroInterno(
                res,
                materiaisRes.error,
                "Erro ao buscar materiais do partner hub"
            );
        }
        if (copiesRes.error) {
            return responderErroInterno(
                res,
                copiesRes.error,
                "Erro ao buscar copies do partner hub"
            );
        }
        if (regrasRes.error) {
            return responderErroInterno(
                res,
                regrasRes.error,
                "Erro ao buscar regras do partner hub"
            );
        }
        if (angulosRes.error) {
            return responderErroInterno(
                res,
                angulosRes.error,
                "Erro ao buscar angulos do partner hub"
            );
        }
        if (kitsRes.error) {
            return responderErroInterno(
                res,
                kitsRes.error,
                "Erro ao buscar kits do partner hub"
            );
        }

        const materiaisPorId = agruparPorCampanha(materiaisRes.data);
        const copiesPorId = agruparPorCampanha(copiesRes.data);
        const regrasPorId = agruparPorCampanha(regrasRes.data);
        const angulosPorId = agruparPorCampanha(angulosRes.data);
        const kitsPorId = agruparPorCampanha(kitsRes.data);
        const destaqueBanco = destaqueRes.error
            ? null
            : (Array.isArray(destaqueRes.data)
                ? destaqueRes.data[0]
                : destaqueRes.data);

        const destaqueAlvoId = Number(destaqueBanco?.campanha_id);
        const temDestaqueNaLista = publicas.some(
            (campanha) => Number(campanha.id) === destaqueAlvoId
        );

        const destaqueFallback = temDestaqueNaLista
            ? null
            : publicas.slice().sort((a, b) => {
                const statusA = String(a.status || "").toLowerCase();
                const statusB = String(b.status || "").toLowerCase();
                if (statusA === "ativa" && statusB !== "ativa") return -1;
                if (statusB === "ativa" && statusA !== "ativa") return 1;
                return Number(a.id) - Number(b.id);
            })[0];

        const payload = publicas.map((campanha) => {
            const campanhaId = Number(campanha.id);
            const copies = copiesPorId.get(campanhaId) || [];
            const ehDestaque = temDestaqueNaLista
                ? campanhaId === destaqueAlvoId
                : Number(destaqueFallback?.id) === campanhaId;

            return {
                ...campanha,
                materiais: materiaisPorId.get(campanhaId) || [],
                copies,
                regras: regrasPorId.get(campanhaId) || [],
                angulos: angulosPorId.get(campanhaId) || [],
                kits: kitsPorId.get(campanhaId) || [],
                destaque: ehDestaque
                    ? (destaqueBanco || {
                        campanha_id: campanhaId,
                        titulo: campanha.titulo,
                        descricao: campanha.resumo || campanha.descricao,
                        copy: copies[0]?.texto || null,
                        ativo: true
                    })
                    : null
            };
        });

        return res.json(payload);
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno no partner hub"
        );
    }
});

module.exports = router;
