const express = require("express");
const multer = require("multer");

const requireAuth = require("../middleware/requireAuth");
const { responderErroInterno } = require("../utils/httpErrors");
const { limiteMaximoGeral } = require("../utils/uploadValidation");
const { enviarArquivoStorage } = require("../services/upload.service");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: limiteMaximoGeral(),
        files: 1
    }
});

/**
 * POST /api/upload
 * multipart/form-data:
 *  - arquivo: File
 *  - tipo: card | banner | material | video | kit
 */
router.post(
    "/",
    requireAuth,
    (req, res, next) => {
        upload.single("arquivo")(req, res, (error) => {
            if (!error) return next();

            if (error instanceof multer.MulterError) {
                if (error.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        erro: "Arquivo excede o tamanho máximo permitido."
                    });
                }

                return res.status(400).json({
                    erro: "Falha no envio do arquivo."
                });
            }

            return responderErroInterno(
                res,
                error,
                "Erro no middleware de upload"
            );
        });
    },
    async (req, res) => {
        try {
            const tipo = req.body?.tipo;
            const file = req.file;

            const resultado = await enviarArquivoStorage({
                tipo,
                file
            });

            return res.status(201).json({
                mensagem: "Upload realizado com sucesso",
                ...resultado
            });
        } catch (error) {
            const status = Number(error.status) || 500;

            if (status < 500) {
                return res.status(status).json({
                    erro: error.message || "Upload inválido"
                });
            }

            return responderErroInterno(
                res,
                error,
                "Erro ao processar upload"
            );
        }
    }
);

module.exports = router;
