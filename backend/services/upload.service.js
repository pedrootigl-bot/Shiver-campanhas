const supabase = require("../config/supabase");
const { validarUpload } = require("../utils/uploadValidation");

/**
 * Valida e envia arquivo para o Supabase Storage.
 * @param {{ tipo: string, file: Express.Multer.File }} params
 */
async function enviarArquivoStorage({ tipo, file }) {
    const validacao = validarUpload({ tipo, file });

    if (!validacao.ok) {
        const erro = new Error(validacao.erro);
        erro.status = 400;
        throw erro;
    }

    const { config, caminho, nomeOriginal, mime, tamanho } = validacao;

    const { error } = await supabase.storage
        .from(config.bucket)
        .upload(caminho, file.buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: mime
        });

    if (error) {
        console.error("Erro no upload Storage:", error);
        const erro = new Error(
            error.message || "Falha ao enviar arquivo para o Storage."
        );
        erro.status = 500;
        throw erro;
    }

    const { data } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(caminho);

    const url = data?.publicUrl;

    if (!url) {
        const erro = new Error(
            "Upload concluído, mas a URL pública não foi gerada."
        );
        erro.status = 500;
        throw erro;
    }

    return {
        url,
        path: caminho,
        bucket: config.bucket,
        tipo: validacao.tipo,
        mime,
        tamanho,
        nomeOriginal
    };
}

module.exports = {
    enviarArquivoStorage
};
