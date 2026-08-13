/**
 * Resposta 500 sem expor detalhes internos do Supabase/Postgres.
 */
function responderErroInterno(res, error, contexto = "Erro interno") {
    console.error(contexto + ":", error);
    return res.status(500).json({
        erro: "Erro interno do servidor"
    });
}

module.exports = {
    responderErroInterno
};
