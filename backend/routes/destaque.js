const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");


router.get("/", async (req, res) => {

    try {


        const { data, error } = await supabase
            .from("destaques")
            .select("*")
            .eq("ativo", true)
            .order("created_at", {
                ascending: false
            })
            .limit(1);



        if (error) {

            throw error;

        }



        res.json(data[0] || null);



    } catch (error) {


        console.error(
            "Erro ao buscar destaque:",
            error
        );


        res.status(500).json({

            erro: "Erro interno do servidor"

        });


    }

});


module.exports = router;