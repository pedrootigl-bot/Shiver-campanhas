/**
 * Seção "O que divulgar hoje"
 * Esperado do banco/API:
 * {
 *   tag, titulo, descricao, copy,
 *   storyUrl, imagem, mediaLabel, mediaCaption
 * }
 */

function atualizarDestaque(destaque = {}) {
    const tag = document.getElementById("highlightTag");
    const titulo = document.getElementById("highlightTitle");
    const descricao = document.getElementById("highlightDescription");
    const copy = document.getElementById("highlightCopy");
    const imagem = document.getElementById("highlightImage");
    const mediaLabel = document.getElementById("highlightMediaLabel");
    const mediaCaption = document.getElementById("highlightMediaCaption");
    const downloadStory = document.getElementById("highlightDownloadStory");

    if (tag) tag.textContent = destaque.tag || "";
    if (titulo) titulo.textContent = destaque.titulo || "";
    if (descricao) descricao.textContent = destaque.descricao || "";
    if (copy) copy.textContent = destaque.copy || "";

    if (imagem) {
        imagem.src = destaque.imagem || "";
        imagem.alt = destaque.titulo || destaque.tag || "Material recomendado";
    }

    if (mediaLabel) mediaLabel.textContent = destaque.mediaLabel || destaque.tag || "";
    if (mediaCaption) mediaCaption.textContent = destaque.mediaCaption || "";

    if (downloadStory) {
        downloadStory.href = destaque.storyUrl || destaque.imagem || "#";
    }

    // Guarda a copy atual para o botão de copiar
    const copyBtn = document.getElementById("highlightCopyBtn");
    if (copyBtn) {
        copyBtn.dataset.copyText = destaque.copy || "";
    }
}

async function carregarDestaque() {
    try {
        const destaque = await obterDestaque();
        atualizarDestaque(destaque);
    } catch (err) {
        console.error("Erro ao carregar destaque:", err);
    }
}

function iniciarAcoesDestaque() {
    const copyBtn = document.getElementById("highlightCopyBtn");
    const openKitBtn = document.getElementById("highlightOpenKit");

    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            const texto = copyBtn.dataset.copyText || "";
            if (!texto) return;

            try {
                await navigator.clipboard.writeText(texto);
                const original = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
                setTimeout(() => {
                    copyBtn.innerHTML = original;
                }, 1600);
            } catch {
                alert("Não foi possível copiar o texto.");
            }
        });
    }

    if (openKitBtn) {
        openKitBtn.addEventListener("click", () => {
            if (typeof abrirModal === "function") {
                abrirModal();
            }
        });
    }
}
