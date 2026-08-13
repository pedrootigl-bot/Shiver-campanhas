const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");


router.get("/:campanha_id", async (req, res)=>{

    const { campanha_id } = req.params;
    const campanhaId = Number(campanha_id);

    if (!campanhaId) {
        return res.status(400).json({
            error: "campanha_id inválido"
        });
    }

    const { data, error } = await supabase
        .from("kits")
        .select("*")
        .eq("campanha_id", campanhaId);


    if(error){

        return res.status(500).json({
            error: error.message
        });

    }


    res.json(data);

});


module.exports = router;