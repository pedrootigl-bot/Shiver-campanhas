const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");


function inicioDoDia(data = new Date()) {
    return new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );
}


function parseDataCampanha(valor) {
    if (!valor) return null;

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
        const [ano, mes, dia] = valor.slice(0, 10).split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return inicioDoDia(data);
}


/**
 * Stats do Partner Hub: só campanhas ativas (em andamento).
 */
function campanhaContaNosStats(campanha) {
    const status = String(campanha?.status || "")
        .toLowerCase()
        .trim();

    return status === "ativa";
}


router.get("/", async (req, res) => {

    try {

        const { data: campanhas, error: erroCampanhas } = await supabase
            .from("campanhas")
            .select("id,status,data_fim,pronta_publicacao");


        const { data: materiais, error: erroMateriais } = await supabase
            .from("materiais")
            .select("id,tipo,campanha_id");


        const { data: kits, error: erroKits } = await supabase
            .from("kits")
            .select("id,tipo,campanha_id");


        const { data: copies, error: erroCopies } = await supabase
            .from("copies")
            .select("id,campanha_id");


        if (
            erroCampanhas ||
            erroMateriais ||
            erroKits ||
            erroCopies
        ) {

            console.log("Erro campanhas:", erroCampanhas);
            console.log("Erro materiais:", erroMateriais);
            console.log("Erro kits:", erroKits);
            console.log("Erro copies:", erroCopies);

            throw new Error(
                "Erro ao buscar estatísticas"
            );

        }


        const campanhasValidas = (campanhas || [])
            .filter(campanhaContaNosStats);

        const idsValidos = new Set(
            campanhasValidas.map((campanha) => Number(campanha.id))
        );

        const listaMateriais = (materiais || []).filter((item) =>
            idsValidos.has(Number(item.campanha_id))
        );

        const listaKits = (kits || []).filter((item) =>
            idsValidos.has(Number(item.campanha_id))
        );

        const listaCopies = (copies || []).filter((item) =>
            idsValidos.has(Number(item.campanha_id))
        );


        const totalVideosMateriais = listaMateriais.filter(
            (item) => item.tipo?.trim().toLowerCase() === "video"
        ).length;


        const totalVideosKits = listaKits.filter(
            (item) => item.tipo?.trim().toLowerCase() === "video"
        ).length;


        const videos = totalVideosMateriais + totalVideosKits;


        console.log("Campanhas válidas (stats):", campanhasValidas.length);
        console.log("Materiais encontrados:", listaMateriais.length);
        console.log("Kits encontrados:", listaKits.length);
        console.log("Total de vídeos:", videos);


        res.json({

            campanhas: campanhasValidas.length,

            materiais: listaMateriais.length,

            copies: listaCopies.length,

            videos

        });


    } catch (error) {


        console.error(
            "Erro stats:",
            error
        );


        res.status(500).json({

            erro: "Erro interno do servidor"

        });


    }

});


module.exports = router;
