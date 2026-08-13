const express = require("express");
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        const password = String(req.body?.password || "");

        if (!email || !password) {
            return res.status(400).json({
                erro: "Email e senha são obrigatórios"
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error || !data?.session || !data?.user) {
            return res.status(401).json({
                erro: "Login inválido"
            });
        }

        return res.json({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at || null
            },
            user: {
                id: data.user.id,
                email: data.user.email
            }
        });
    } catch (error) {
        console.error("Erro no login admin:", error);
        return res.status(500).json({
            erro: "Erro ao autenticar"
        });
    }
});

router.get("/me", requireAuth, async (req, res) => {
    return res.json({
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

module.exports = router;
