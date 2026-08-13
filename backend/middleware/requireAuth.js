const supabase = require("../config/supabase");

/**
 * Exige JWT válido do Supabase Auth (Bearer token).
 * Usar apenas em rotas de escrita (POST/PUT/DELETE).
 */
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ")
            ? header.slice(7).trim()
            : "";

        if (!token) {
            return res.status(401).json({
                erro: "Não autenticado"
            });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            return res.status(401).json({
                erro: "Sessão inválida ou expirada"
            });
        }

        req.user = data.user;
        return next();
    } catch (error) {
        console.error("Erro na autenticação:", error);
        return res.status(401).json({
            erro: "Não autenticado"
        });
    }
}

module.exports = requireAuth;
