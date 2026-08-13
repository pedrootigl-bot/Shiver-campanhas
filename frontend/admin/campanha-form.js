const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
    const session = await requireAdminSession();
    if (!session) return;

    const form = document.getElementById("campanhaForm");
    const copiesContainer = document.getElementById("copiesContainer");
    const adicionarCopyBtn = document.getElementById("adicionarCopyBtn");
    const regrasContainer = document.getElementById("regrasContainer");
    const adicionarRegraBtn = document.getElementById("adicionarRegraBtn");
    const materiaisContainer = document.getElementById("materiaisContainer");
    const adicionarMaterialBtn = document.getElementById("adicionarMaterialBtn");
    const adicionarMateriaisLoteBtn = document.getElementById("adicionarMateriaisLoteBtn");
    const materiaisBulkFile = document.getElementById("materiaisBulkFile");
    const mecanicaContainer = document.getElementById("mecanicaContainer");
    const adicionarMecanicaBtn = document.getElementById("adicionarMecanicaBtn");
    const angulosContainer = document.getElementById("angulosContainer");
    const adicionarAnguloBtn = document.getElementById("adicionarAnguloBtn");
    const voltarBtn = document.getElementById("voltarBtn");
    const cancelarBtn = document.getElementById("cancelarBtn");
    const salvarBtn = document.getElementById("salvarBtn");
    const pageTitle = document.getElementById("pageTitle");

    function aviso(mensagem, tipo = "warn") {
        if (window.ShiverUI) {
            if (tipo === "ok") window.ShiverUI.notifyOk(mensagem);
            else if (tipo === "error") window.ShiverUI.notifyError(mensagem);
            else window.ShiverUI.notifyWarn(mensagem);
            return;
        }
        window.alert(mensagem);
    }

    if (!form) {
        console.error("Formulário #campanhaForm não encontrado.");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const campanhaId = params.get("id");
    const isEditando = Boolean(campanhaId);

    let contadorCopies = 0;
    let contadorRegras = 0;
    let contadorMateriais = 0;
    let contadorAngulos = 0;
    let uploadImagemEmAndamento = false;
    let uploadMaterialEmAndamento = 0;

    function calcularStatusPorDatas(dataInicio, dataFim) {
        const hoje = new Date();
        const hojeISO = [
            hoje.getFullYear(),
            String(hoje.getMonth() + 1).padStart(2, "0"),
            String(hoje.getDate()).padStart(2, "0")
        ].join("-");

        const inicio = String(dataInicio || "").slice(0, 10);
        const fim = String(dataFim || "").slice(0, 10);

        if (inicio && hojeISO < inicio) return "agendada";
        if (fim && hojeISO >= fim) return "finalizada";
        return "ativa";
    }

    function sincronizarStatusComDatas() {
        const statusEl = document.getElementById("status");
        const inicio = document.getElementById("data_inicio")?.value || "";
        const fim = document.getElementById("data_fim")?.value || "";
        if (!statusEl || (!inicio && !fim)) return;
        statusEl.value = calcularStatusPorDatas(inicio, fim);
    }

    ["data_inicio", "data_fim"].forEach((id) => {
        document.getElementById(id)?.addEventListener("change", sincronizarStatusComDatas);
    });

    const TIPOS_IMAGEM_PERMITIDOS = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    ];
    const TAMANHO_MAX_IMAGEM = 5 * 1024 * 1024;
    const TAMANHO_MAX_MATERIAL = 50 * 1024 * 1024;

    if (isEditando && pageTitle) {
        pageTitle.textContent = "Editar Campanha";
    }

    if (salvarBtn) {
        salvarBtn.innerHTML = isEditando
            ? '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações'
            : '<i class="fa-solid fa-floppy-disk"></i> Salvar campanha';
    }

    function irParaCampanhas() {
        window.location.href = "campanhas.html";
    }

    if (voltarBtn) {
        voltarBtn.addEventListener("click", irParaCampanhas);
    }

    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", irParaCampanhas);
    }

    function escapeHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // ======================================================
    // UPLOAD IMAGEM DO CARD (Drag & Drop)
    // ======================================================

    const imagemCardInput = document.getElementById("imagem_card");
    const imagemCardFile = document.getElementById("imagem_card_file");
    const imagemCardDropzone = document.getElementById("imagemCardDropzone");
    const imagemCardEmpty = document.getElementById("imagemCardEmpty");
    const imagemCardPreview = document.getElementById("imagemCardPreview");
    const imagemCardPreviewImg = document.getElementById("imagemCardPreviewImg");
    const imagemCardFileName = document.getElementById("imagemCardFileName");
    const imagemCardStatus = document.getElementById("imagemCardStatus");
    const imagemCardSelectBtn = document.getElementById("imagemCardSelectBtn");
    const imagemCardReplaceBtn = document.getElementById("imagemCardReplaceBtn");
    const imagemCardRemoveBtn = document.getElementById("imagemCardRemoveBtn");

    function setStatusUpload(mensagem, tipo = "") {
        if (!imagemCardStatus) return;

        if (!mensagem) {
            imagemCardStatus.hidden = true;
            imagemCardStatus.textContent = "";
            imagemCardStatus.className = "upload-dropzone__status";
            return;
        }

        imagemCardStatus.hidden = false;
        imagemCardStatus.textContent = mensagem;
        imagemCardStatus.className = `upload-dropzone__status ${tipo}`.trim();
    }

    function nomeArquivoDeUrl(url) {
        try {
            const limpo = String(url).split("?")[0];
            return limpo.substring(limpo.lastIndexOf("/") + 1) || "imagem-card";
        } catch {
            return "imagem-card";
        }
    }

    function mostrarPreviewImagemCard(url, nomeArquivo = "") {
        if (!imagemCardInput || !url) {
            limparPreviewImagemCard();
            return;
        }

        imagemCardInput.value = url;

        if (imagemCardPreviewImg) {
            imagemCardPreviewImg.src = url;
            imagemCardPreviewImg.alt = nomeArquivo || "Preview da imagem do card";
        }

        if (imagemCardFileName) {
            imagemCardFileName.textContent = nomeArquivo || nomeArquivoDeUrl(url);
        }

        if (imagemCardEmpty) imagemCardEmpty.hidden = true;
        if (imagemCardPreview) imagemCardPreview.hidden = false;
        if (imagemCardDropzone) {
            imagemCardDropzone.classList.add("has-preview");
        }
    }

    function limparPreviewImagemCard() {
        if (imagemCardInput) imagemCardInput.value = "";

        if (imagemCardPreviewImg) {
            imagemCardPreviewImg.src = "";
            imagemCardPreviewImg.alt = "Preview da imagem do card";
        }

        if (imagemCardFileName) {
            imagemCardFileName.textContent = "imagem";
        }

        if (imagemCardFile) imagemCardFile.value = "";
        if (imagemCardEmpty) imagemCardEmpty.hidden = false;
        if (imagemCardPreview) imagemCardPreview.hidden = true;
        if (imagemCardDropzone) {
            imagemCardDropzone.classList.remove("has-preview", "is-dragover", "is-uploading");
        }

        setStatusUpload("");
    }

    function extensaoArquivo(file) {
        const nome = String(file?.name || "");
        const ext = nome.includes(".")
            ? nome.split(".").pop().toLowerCase()
            : "";

        if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") {
            return ext === "jpeg" ? "jpg" : ext;
        }

        if (file?.type === "image/png") return "png";
        if (file?.type === "image/webp") return "webp";
        return "jpg";
    }

    function validarArquivoImagem(file) {
        if (!file) {
            return "Selecione um arquivo de imagem.";
        }

        if (!TIPOS_IMAGEM_PERMITIDOS.includes(file.type)) {
            return "Formato inválido. Use PNG, JPG ou WEBP.";
        }

        if (file.size > TAMANHO_MAX_IMAGEM) {
            return "A imagem deve ter no máximo 5 MB.";
        }

        return null;
    }

    function gerarNomeUnicoArquivo(file) {
        const ext = extensaoArquivo(file);
        const uid =
            (typeof crypto !== "undefined" && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        return `imagens/cards/${Date.now()}-${uid}.${ext}`;
    }

   async function enviarImagemCard(file) {

    const erroValidacao = validarArquivoImagem(file);

    if (erroValidacao) {
        setStatusUpload(erroValidacao, "is-error");
        return;
    }

    const session = lerSessao();

    if (!session?.access_token) {
        setStatusUpload(
            "Faça login para enviar imagens.",
            "is-error"
        );
        return;
    }

    uploadImagemEmAndamento = true;

    if (imagemCardDropzone) {
        imagemCardDropzone.classList.add("is-uploading");
    }

    if (salvarBtn) {
        salvarBtn.disabled = true;
    }

    setStatusUpload("Enviando imagem...", "is-loading");

    try {

        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("tipo", "card");

        const headers = await getAuthHeaders();
        const resposta = await fetch(`${API}/api/upload`, {
            method: "POST",
            headers,
            body: formData
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.error || "Falha no upload da imagem."
            );
        }

        const publicUrl = dados.url;

        if (!publicUrl) {
            throw new Error(
                "Upload concluído, mas a URL pública não foi gerada."
            );
        }

        console.log("Imagem enviada:", publicUrl);

        // ==========================================
        // PREVIEW
        // ==========================================

        mostrarPreviewImagemCard(
            publicUrl,
            file.name
        );

        setStatusUpload(
            "Imagem enviada com sucesso.",
            "is-success"
        );

    } catch (error) {

        console.error(
            "Erro no upload da imagem:",
            error
        );

        setStatusUpload(
            error.message || "Erro ao enviar imagem.",
            "is-error"
        );

    } finally {

        uploadImagemEmAndamento = false;

        if (imagemCardDropzone) {
            imagemCardDropzone.classList.remove(
                "is-uploading",
                "is-dragover"
            );
        }

        if (salvarBtn) {
            salvarBtn.disabled = false;
        }
    }
}

    function iniciarUploadImagemCard() {
        if (!imagemCardDropzone || !imagemCardFile) return;

        const abrirSeletor = () => imagemCardFile.click();

        if (imagemCardSelectBtn) {
            imagemCardSelectBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                abrirSeletor();
            });
        }

        if (imagemCardReplaceBtn) {
            imagemCardReplaceBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                abrirSeletor();
            });
        }

        if (imagemCardRemoveBtn) {
            imagemCardRemoveBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                limparPreviewImagemCard();
            });
        }

        imagemCardFile.addEventListener("change", () => {
            const file = imagemCardFile.files?.[0];
            if (file) enviarImagemCard(file);
        });

        ["dragenter", "dragover"].forEach((evento) => {
            imagemCardDropzone.addEventListener(evento, (event) => {
                event.preventDefault();
                event.stopPropagation();
                imagemCardDropzone.classList.add("is-dragover");
            });
        });

        ["dragleave", "drop"].forEach((evento) => {
            imagemCardDropzone.addEventListener(evento, (event) => {
                event.preventDefault();
                event.stopPropagation();
                imagemCardDropzone.classList.remove("is-dragover");
            });
        });

        imagemCardDropzone.addEventListener("drop", (event) => {
            const file = event.dataTransfer?.files?.[0];
            if (file) enviarImagemCard(file);
        });

        imagemCardDropzone.addEventListener("click", (event) => {
            if (
                event.target.closest("button") ||
                event.target.closest(".upload-dropzone__preview")
            ) {
                return;
            }

            if (!imagemCardInput?.value) {
                abrirSeletor();
            }
        });
    }

    iniciarUploadImagemCard();

    function atualizarOrdens() {
        const copies = copiesContainer?.querySelectorAll(".copy-item") || [];

        copies.forEach((copy, index) => {
            const ordemInput = copy.querySelector(".copy-ordem");
            const badge = copy.querySelector(".copy-item__badge");
            const titulo = copy.querySelector("h3");

            if (ordemInput) ordemInput.value = index + 1;
            if (badge) badge.textContent = `COPY ${index + 1}`;
            if (titulo && !copy.querySelector(".copy-item__badge")) {
                titulo.textContent = `Copy ${index + 1}`;
            }
        });
    }

    function atualizarOrdensRegras() {
        const regras = regrasContainer?.querySelectorAll(".regra-item") || [];

        regras.forEach((regra, index) => {
            const ordemInput = regra.querySelector(".regra-ordem");
            const badge = regra.querySelector(".regra-item__badge");
            const titulo = regra.querySelector(".regra-item__header h3");

            if (ordemInput) ordemInput.value = index + 1;
            if (badge) badge.textContent = `REGRA ${index + 1}`;
            if (titulo) titulo.textContent = `Condição ${index + 1}`;
        });
    }

    function atualizarTitulosMateriais() {
        const materiais = materiaisContainer?.querySelectorAll(".material-item") || [];

        materiais.forEach((material, index) => {
            const titulo = material.querySelector("h3");
            if (titulo) titulo.textContent = `Material ${index + 1}`;
        });
    }

    function adicionarCopy(dados = {}) {
        if (!copiesContainer) {
            console.error("Container #copiesContainer não encontrado.");
            return;
        }

        contadorCopies += 1;

        const copyElement = document.createElement("div");
        copyElement.className = "copy-item";
        copyElement.dataset.copy = String(contadorCopies);

        if (dados.id) {
            copyElement.dataset.id = String(dados.id);
        }

        copyElement.innerHTML = `
            <div class="copy-item__header">
                <div>
                    <span class="copy-item__badge">COPY ${contadorCopies}</span>
                    <h3>Texto recomendado</h3>
                </div>
                <button type="button" class="remover-copy" aria-label="Remover copy">
                    <i class="fa-solid fa-trash"></i>
                    Remover
                </button>
            </div>

            <div class="copy-item__content">
                <div class="copy-field copy-field--full">
                    <label>Título</label>
                    <input
                        type="text"
                        class="copy-titulo"
                        placeholder="Ex: Urgência"
                        value="${escapeHtml(dados.titulo || "")}"
                    >
                </div>

                <div class="copy-field copy-field--full">
                    <label>Texto</label>
                    <textarea
                        class="copy-texto"
                        rows="5"
                        placeholder="Digite o texto da copy..."
                    >${escapeHtml(dados.texto || "")}</textarea>
                </div>

                <div class="copy-field">
                    <label>Canal</label>
                    <input
                        type="text"
                        class="copy-canal"
                        placeholder="Ex: Instagram"
                        value="${escapeHtml(dados.canal || "")}"
                    >
                </div>

                <div class="copy-field">
                    <label>Tipo</label>
                    <input
                        type="text"
                        class="copy-tipo"
                        placeholder="Ex: Story"
                        value="${escapeHtml(dados.tipo || "")}"
                    >
                </div>

                <div class="copy-field">
                    <label>Ordem</label>
                    <input
                        type="number"
                        class="copy-ordem"
                        value="${escapeHtml(dados.ordem || contadorCopies)}"
                        min="1"
                    >
                </div>
            </div>
        `;

        copiesContainer.appendChild(copyElement);
        atualizarOrdens();
    }

    function adicionarRegra(dados = {}) {
        if (!regrasContainer) {
            console.error("Container #regrasContainer não encontrado.");
            return;
        }

        contadorRegras += 1;

        const regraElement = document.createElement("div");
        regraElement.className = "regra-item";
        regraElement.dataset.regra = String(contadorRegras);

        if (dados.id) {
            regraElement.dataset.id = String(dados.id);
        }

        regraElement.innerHTML = `
            <div class="regra-item__header">
                <div>
                    <span class="regra-item__badge">REGRA ${contadorRegras}</span>
                    <h3>Condição ${contadorRegras}</h3>
                </div>
                <button type="button" class="remover-regra" aria-label="Remover regra">
                    <i class="fa-solid fa-trash"></i>
                    Remover
                </button>
            </div>

            <div class="regra-item__content">
                <div class="regra-field regra-field--titulo">
                    <label for="regra-titulo-${contadorRegras}">Título</label>
                    <input
                        id="regra-titulo-${contadorRegras}"
                        type="text"
                        class="regra-titulo"
                        placeholder="Ex: Depósito mínimo"
                        value="${escapeHtml(dados.titulo || "")}"
                    >
                </div>

                <div class="regra-field regra-field--ordem">
                    <label for="regra-ordem-${contadorRegras}">Ordem</label>
                    <input
                        id="regra-ordem-${contadorRegras}"
                        type="number"
                        class="regra-ordem"
                        value="${escapeHtml(dados.ordem || contadorRegras)}"
                        min="1"
                    >
                </div>

                <div class="regra-field regra-field--full">
                    <label for="regra-descricao-${contadorRegras}">Descrição</label>
                    <textarea
                        id="regra-descricao-${contadorRegras}"
                        class="regra-descricao"
                        rows="5"
                        placeholder="Descreva a regra e as condições..."
                    >${escapeHtml(dados.descricao || "")}</textarea>
                </div>
            </div>
        `;

        regrasContainer.appendChild(regraElement);
        atualizarOrdensRegras();
    }

    function pastaMaterialPorArquivo(file) {
        const tipo = String(file?.type || "").toLowerCase();

        if (tipo.startsWith("image/")) return "materiais/imagens";
        if (tipo.startsWith("video/")) return "materiais/videos";
        return "materiais/arquivos";
    }

    function tipoMaterialPorArquivo(file) {
        const tipo = String(file?.type || "").toLowerCase();

        if (tipo.startsWith("image/")) return "imagem";
        if (tipo.startsWith("video/")) return "video";
        return "arquivo";
    }

    function normalizarFormatoMaterial(valor) {
        const bruto = String(valor || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (!bruto) return "";

        if (["stories", "feed", "videos", "banners"].includes(bruto)) {
            return bruto;
        }

        if (bruto.includes("stor")) return "stories";
        if (bruto.includes("feed")) return "feed";
        if (bruto.includes("video")) return "videos";
        if (bruto.includes("banner")) return "banners";

        return "";
    }

    function inferirFormatoLegado(dados = {}) {
        const direto = normalizarFormatoMaterial(dados.formato);
        if (direto) return direto;

        // Materiais antigos gravavam a categoria em `tipo`
        return normalizarFormatoMaterial(dados.tipo);
    }

    function extensaoArquivoMaterial(file) {
        const nome = String(file?.name || "");
        if (nome.includes(".")) {
            return nome.split(".").pop().toLowerCase();
        }

        if (file?.type === "image/png") return "png";
        if (file?.type === "image/webp") return "webp";
        if (file?.type === "image/jpeg" || file?.type === "image/jpg") return "jpg";
        if (file?.type === "video/mp4") return "mp4";
        return "bin";
    }

    function gerarCaminhoMaterial(file) {
        const pasta = pastaMaterialPorArquivo(file);
        const ext = extensaoArquivoMaterial(file);
        const uid =
            (typeof crypto !== "undefined" && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        return `${pasta}/${Date.now()}-${uid}.${ext}`;
    }

    function validarArquivoMaterial(file) {
        if (!file) {
            return "Selecione um arquivo.";
        }

        if (file.size > TAMANHO_MAX_MATERIAL) {
            return "O arquivo deve ter no máximo 50 MB.";
        }

        return null;
    }

    function setStatusUploadMaterial(item, mensagem, tipo = "") {
        const status = item?.querySelector(".material-upload-status");
        if (!status) return;

        if (!mensagem) {
            status.hidden = true;
            status.textContent = "";
            status.className = "upload-dropzone__status material-upload-status";
            return;
        }

        status.hidden = false;
        status.textContent = mensagem;
        status.className = `upload-dropzone__status material-upload-status ${tipo}`.trim();
    }

    function mostrarPreviewMaterial(item, url, nomeArquivo = "") {
        const urlInput = item.querySelector(".material-url");
        const empty = item.querySelector(".material-upload-empty");
        const preview = item.querySelector(".material-upload-preview");
        const previewImg = item.querySelector(".material-upload-preview-img");
        const dropzone = item.querySelector(".material-upload-dropzone");

        if (urlInput) urlInput.value = url || "";

        if (previewImg) {
            const ehImagem = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url || "");
            if (ehImagem && url) {
                previewImg.hidden = false;
                previewImg.src = url;
                previewImg.alt = nomeArquivo || "Preview do material";
            } else {
                previewImg.hidden = true;
                previewImg.removeAttribute("src");
            }
        }

        if (empty) empty.hidden = Boolean(url);
        if (preview) preview.hidden = !url;
        if (dropzone) {
            dropzone.classList.toggle("has-preview", Boolean(url));
        }
    }

    function limparUploadMaterial(item) {
        const fileInput = item.querySelector(".material-upload-file");
        if (fileInput) fileInput.value = "";
        mostrarPreviewMaterial(item, "", "");
        setStatusUploadMaterial(item, "");
        item.querySelector(".material-upload-dropzone")?.classList.remove(
            "is-dragover",
            "is-uploading"
        );
    }

    async function enviarArquivoMaterial(item, file) {
        const erroValidacao = validarArquivoMaterial(file);

        if (erroValidacao) {
            setStatusUploadMaterial(item, erroValidacao, "is-error");
            return;
        }

        const session = lerSessao();

        if (!session?.access_token) {
            setStatusUploadMaterial(
                item,
                "Faça login para enviar arquivos.",
                "is-error"
            );
            return;
        }

        const dropzone = item.querySelector(".material-upload-dropzone");
        const tipoInput = item.querySelector(".material-tipo");
        const nomeInput = item.querySelector(".material-nome");

        uploadMaterialEmAndamento += 1;
        if (salvarBtn) salvarBtn.disabled = true;
        if (dropzone) dropzone.classList.add("is-uploading");

        setStatusUploadMaterial(item, "Enviando arquivo...", "is-loading");

        try {
            const formData = new FormData();
            formData.append("arquivo", file);
            formData.append("tipo", "material");

            const headers = await getAuthHeaders();
            const resposta = await fetch(`${API}/api/upload`, {
                method: "POST",
                headers,
                body: formData
            });

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || dados.error || "Falha no upload do material."
                );
            }

            const publicUrl = dados.url;

            if (!publicUrl) {
                throw new Error(
                    "Upload concluído, mas a URL pública não foi gerada."
                );
            }

            if (tipoInput) {
                tipoInput.value = tipoMaterialPorArquivo(file);
            }

            if (nomeInput && !nomeInput.value.trim()) {
                nomeInput.value = file.name.replace(/\.[^.]+$/, "");
            }

            mostrarPreviewMaterial(item, publicUrl, file.name);
            setStatusUploadMaterial(
                item,
                "Arquivo enviado com sucesso.",
                "is-success"
            );
        } catch (error) {
            console.error("Erro no upload do material:", error);
            setStatusUploadMaterial(
                item,
                error.message || "Erro ao enviar arquivo.",
                "is-error"
            );
        } finally {
            uploadMaterialEmAndamento = Math.max(
                0,
                uploadMaterialEmAndamento - 1
            );

            if (dropzone) {
                dropzone.classList.remove("is-uploading", "is-dragover");
            }

            if (
                salvarBtn &&
                !uploadImagemEmAndamento &&
                uploadMaterialEmAndamento === 0
            ) {
                salvarBtn.disabled = false;
            }
        }
    }

    /**
     * Processa um ou vários arquivos:
     * - 1º arquivo preenche o card atual (se estiver vazio)
     * - demais arquivos criam novos cards automaticamente
     */
    async function processarArquivosMateriais(materialBase, files, formatoPadrao = "stories") {
        const lista = Array.from(files || []).filter(Boolean);
        if (!lista.length) return;

        let indice = 0;
        const cardAtual = materialBase || null;
        const urlAtual = cardAtual?.querySelector(".material-url")?.value?.trim();

        if (cardAtual && !urlAtual) {
            await enviarArquivoMaterial(cardAtual, lista[0]);
            indice = 1;
        }

        for (; indice < lista.length; indice += 1) {
            const file = lista[indice];
            const novoCard = adicionarMaterial({
                nome: String(file.name || "").replace(/\.[^.]+$/, ""),
                formato: formatoPadrao
            });
            await enviarArquivoMaterial(novoCard, file);
        }

        atualizarTitulosMateriais();
    }

    function adicionarMaterial(dados = {}) {
        if (!materiaisContainer) {
            console.error("Container #materiaisContainer não encontrado.");
            return;
        }

        contadorMateriais += 1;

        const materialElement = document.createElement("div");
        materialElement.className = "material-item copy-item";
        materialElement.dataset.material = String(contadorMateriais);

        if (dados.id) {
            materialElement.dataset.id = String(dados.id);
        }

        const urlAtual = dados.url || "";
        const ehImagemUrl = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(urlAtual);

        materialElement.innerHTML = `
            <div class="copy-item__content">
                <h3>Material ${contadorMateriais}</h3>

                <label>Nome</label>
                <input
                    type="text"
                    class="material-nome"
                    placeholder="Ex: Banner Haval"
                    value="${escapeHtml(dados.nome || "")}"
                >

                <input
                    type="hidden"
                    class="material-tipo"
                    value="${escapeHtml(
                        ["imagem", "video", "arquivo"].includes(
                            String(dados.tipo || "").trim().toLowerCase()
                        )
                            ? String(dados.tipo).trim().toLowerCase()
                            : ""
                    )}"
                >

                <label>Arquivo do material</label>
                <input
                    type="hidden"
                    class="material-url"
                    value="${escapeHtml(urlAtual)}"
                >

                <input
                    type="file"
                    class="material-upload-file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,video/*,.pdf,.zip"
                    multiple
                    hidden
                >

                <div class="upload-dropzone material-upload-dropzone${urlAtual ? " has-preview" : ""}">
                    <div class="material-upload-main">
                        <div class="upload-dropzone__empty material-upload-empty"${urlAtual ? " hidden" : ""}>
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <p>Arraste seu arquivo aqui</p>
                            <span>ou clique para selecionar · imagens, vídeos ou arquivos · máx. 50 MB cada</span>
                            <button type="button" class="material-btn material-btn--secondary material-upload-select">
                                <i class="fa-solid fa-folder-open"></i>
                                Selecionar arquivo(s)
                            </button>
                        </div>

                        <div class="upload-dropzone__preview material-upload-preview"${urlAtual ? "" : " hidden"}>
                            <img
                                class="material-upload-preview-img"
                                alt="Preview do material"
                                ${ehImagemUrl && urlAtual ? `src="${escapeHtml(urlAtual)}"` : "hidden"}
                            >
                        </div>
                    </div>

                    <div class="material-upload-meta">
                        <div class="material-upload-formato">
                            <label for="material-formato-${contadorMateriais}">
                                Formato da postagem
                            </label>
                            <select
                                id="material-formato-${contadorMateriais}"
                                class="material-formato"
                            >
                                <option value="stories">Stories</option>
                                <option value="feed">Feed</option>
                                <option value="videos">Vídeos</option>
                                <option value="banners">Banners</option>
                            </select>
                        </div>

                        <div class="upload-dropzone__actions material-upload-actions">
                            <button type="button" class="material-btn material-btn--primary material-upload-replace">
                                <i class="fa-solid fa-arrows-rotate"></i>
                                Trocar
                            </button>
                            <button type="button" class="material-btn material-btn--danger material-upload-remove">
                                <i class="fa-solid fa-trash"></i>
                                Excluir
                            </button>
                        </div>
                    </div>

                    <div class="upload-dropzone__status material-upload-status" hidden></div>
                </div>
            </div>
        `;

        materiaisContainer.appendChild(materialElement);

        const formatoSelect = materialElement.querySelector(".material-formato");
        if (formatoSelect) {
            formatoSelect.value = inferirFormatoLegado(dados) || "stories";
        }

        // Se tipo legado era categoria, tenta inferir tipo pela URL
        const tipoInput = materialElement.querySelector(".material-tipo");
        if (tipoInput && !tipoInput.value) {
            if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(urlAtual)) {
                tipoInput.value = "video";
            } else if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(urlAtual)) {
                tipoInput.value = "imagem";
            }
        }

        atualizarTitulosMateriais();
        return materialElement;
    }

    function pegarCopies() {
        const elementos = copiesContainer?.querySelectorAll(".copy-item") || [];
        const copies = [];

        elementos.forEach((element, index) => {
            const titulo = element.querySelector(".copy-titulo")?.value.trim() || "";
            const texto = element.querySelector(".copy-texto")?.value.trim() || "";
            const canal = element.querySelector(".copy-canal")?.value.trim() || "";
            const tipo = element.querySelector(".copy-tipo")?.value.trim() || "";
            const ordem = Number(
                element.querySelector(".copy-ordem")?.value || index + 1
            );

            copies.push({
                id: element.dataset.id || null,
                titulo,
                texto,
                canal,
                tipo,
                ordem
            });
        });

        return copies;
    }

    function pegarRegras() {
        const elementos = regrasContainer?.querySelectorAll(".regra-item") || [];
        const regras = [];

        elementos.forEach((element, index) => {
            const titulo = element.querySelector(".regra-titulo")?.value.trim() || "";
            const descricao = element.querySelector(".regra-descricao")?.value.trim() || "";
            const ordem = Number(
                element.querySelector(".regra-ordem")?.value || index + 1
            );

            regras.push({
                id: element.dataset.id || null,
                titulo,
                descricao,
                ordem
            });
        });

        return regras;
    }

    function pegarMateriais() {
        const elementos = materiaisContainer?.querySelectorAll(".material-item") || [];
        const materiais = [];

        elementos.forEach((element) => {
            const nome = element.querySelector(".material-nome")?.value.trim() || "";
            const formato = normalizarFormatoMaterial(
                element.querySelector(".material-formato")?.value
            );
            let tipo = String(
                element.querySelector(".material-tipo")?.value || ""
            ).trim().toLowerCase();
            const url = element.querySelector(".material-url")?.value.trim() || "";

            if (!["imagem", "video", "arquivo"].includes(tipo)) {
                if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) tipo = "video";
                else if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url)) tipo = "imagem";
                else tipo = tipo || "arquivo";
            }

            materiais.push({
                id: element.dataset.id || null,
                nome,
                tipo,
                formato,
                url
            });
        });

        return materiais;
    }

    function pegarCategoriasSelecionadas() {
        const checks = document.querySelectorAll(
            '#categoriaGroup input[name="categoria"]:checked'
        );

        return Array.from(checks)
            .map((input) => input.value.trim())
            .filter(Boolean);
    }

    function preencherCategorias(categoriaValor) {
        const checks = document.querySelectorAll(
            '#categoriaGroup input[name="categoria"]'
        );

        const selecionadas = String(categoriaValor || "")
            .split(/[,·|]/)
            .map((item) => item.trim())
            .filter(Boolean);

        checks.forEach((input) => {
            input.checked = selecionadas.includes(input.value);
        });
    }

    function pegarObjetivosSelecionados() {
        const checks = document.querySelectorAll(
            '#objetivoGroup input[name="objetivo"]:checked'
        );

        return Array.from(checks)
            .map((input) => input.value.trim())
            .filter(Boolean);
    }

    function atualizarEstadoChipsObjetivo() {
        document.querySelectorAll("#objetivoGroup .objetivo-chip").forEach((chip) => {
            const input = chip.querySelector('input[name="objetivo"]');
            chip.classList.toggle("is-selected", Boolean(input?.checked));
        });
    }

    function preencherObjetivos(objetivoValor) {
        const checks = document.querySelectorAll(
            '#objetivoGroup input[name="objetivo"]'
        );

        const selecionados = String(objetivoValor || "")
            .split(/[,·|]/)
            .map((item) => item.trim())
            .filter(Boolean);

        checks.forEach((input) => {
            input.checked = selecionados.includes(input.value);
        });

        atualizarEstadoChipsObjetivo();
    }

    const objetivoGroup = document.getElementById("objetivoGroup");
    if (objetivoGroup) {
        objetivoGroup.addEventListener("change", atualizarEstadoChipsObjetivo);
        atualizarEstadoChipsObjetivo();
    }

    function adicionarPassoMecanica(texto = "") {
        if (!mecanicaContainer) return;

        const item = document.createElement("li");
        item.className = "mecanica-item";
        item.innerHTML = `
            <span class="mecanica-item__index" aria-hidden="true"></span>
            <textarea
                class="mecanica-texto"
                rows="2"
                placeholder="Descreva o passo da mecânica..."
            >${escapeHtml(texto || "")}</textarea>
            <button type="button" class="mecanica-item__remove" aria-label="Remover passo">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        mecanicaContainer.appendChild(item);
    }

    function pegarMecanica() {
        const itens = mecanicaContainer?.querySelectorAll(".mecanica-texto") || [];

        return Array.from(itens)
            .map((el) => el.value.trim())
            .filter(Boolean);
    }

    function preencherMecanica(valor) {
        if (!mecanicaContainer) return;

        mecanicaContainer.innerHTML = "";

        let lista = [];

        if (Array.isArray(valor)) {
            lista = valor;
        } else if (typeof valor === "string" && valor.trim()) {
            try {
                const parsed = JSON.parse(valor);
                lista = Array.isArray(parsed) ? parsed : [valor];
            } catch {
                lista = valor
                    .split(/\n+/)
                    .map((item) => item.replace(/^\d+[\).\s-]*/, "").trim())
                    .filter(Boolean);
            }
        }

        if (lista.length === 0) {
            return;
        }

        lista.forEach((passo) => {
            adicionarPassoMecanica(
                typeof passo === "string" ? passo : String(passo?.texto || passo || "")
            );
        });
    }

    function adicionarAngulo(dados = {}) {
        if (!angulosContainer) return;

        contadorAngulos += 1;

        const item = document.createElement("div");
        item.className = "angulo-item";
        item.dataset.angulo = String(contadorAngulos);

        if (dados.id) {
            item.dataset.id = String(dados.id);
        }

        item.innerHTML = `
            <div class="angulo-item__top">
                <div class="angulo-item__fields">
                    <input
                        type="text"
                        class="angulo-titulo"
                        placeholder="Ex: Operou, acelerou"
                        value="${escapeHtml(dados.titulo || "")}"
                    >
                    <textarea
                        class="angulo-descricao"
                        rows="3"
                        placeholder="Descreva quando usar este ângulo..."
                    >${escapeHtml(dados.descricao || "")}</textarea>
                </div>
                <button type="button" class="angulo-item__remove" aria-label="Remover ângulo">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        angulosContainer.appendChild(item);
    }

    function pegarAngulos() {
        const itens = angulosContainer?.querySelectorAll(".angulo-item") || [];
        const angulos = [];

        itens.forEach((element, index) => {
            const titulo = element.querySelector(".angulo-titulo")?.value.trim() || "";
            const descricao = element.querySelector(".angulo-descricao")?.value.trim() || "";
            const id = element.dataset.id ? Number(element.dataset.id) : null;

            angulos.push({
                id,
                titulo,
                descricao,
                ordem: index + 1
            });
        });

        return angulos;
    }

    function pegarDadosCampanha() {
        return {
            titulo: document.getElementById("titulo")?.value.trim() || "",
            texto_header: document.getElementById("texto_header")?.value.trim() || "",
            descricao: document.getElementById("descricao")?.value.trim() || "",
            resumo: document.getElementById("resumo")?.value.trim() || "",
            // Mantém o campo string no banco; múltiplas categorias separadas por vírgula
            categoria: pegarCategoriasSelecionadas().join(", "),
            publico_recomendado:
                document.getElementById("publico_recomendado")?.value.trim() || "",
            objetivo: pegarObjetivosSelecionados().join(" · "),
            mecanica: pegarMecanica(),
            premio: document.getElementById("premio")?.value.trim() || "",
            cupom: document.getElementById("cupom")?.value.trim() || "",
            deposito_minimo: document.getElementById("deposito_minimo")?.value || "",
            data_inicio: document.getElementById("data_inicio")?.value || "",
            data_fim: document.getElementById("data_fim")?.value || "",
            status: calcularStatusPorDatas(
                document.getElementById("data_inicio")?.value || "",
                document.getElementById("data_fim")?.value || ""
            ),
            imagem_card: document.getElementById("imagem_card")?.value.trim() || ""
        };
    }

    function preencherFormulario(campanha) {
        const campos = [
            "titulo",
            "texto_header",
            "descricao",
            "resumo",
            "publico_recomendado",
            "premio",
            "cupom",
            "deposito_minimo",
            "data_inicio",
            "data_fim",
            "status",
            "imagem_card"
        ];

        campos.forEach((campo) => {
            const el = document.getElementById(campo);
            if (!el || campanha[campo] == null) return;
            el.value = campanha[campo];
        });

        sincronizarStatusComDatas();

        preencherCategorias(campanha.categoria);
        preencherObjetivos(campanha.objetivo);
        preencherMecanica(campanha.mecanica);

        if (campanha.imagem_card) {
            mostrarPreviewImagemCard(campanha.imagem_card);
        } else {
            limparPreviewImagemCard();
        }
    }

    function validarCampanha(dados) {
        if (!dados.titulo) {
            aviso("Digite o título da campanha.");
            return false;
        }

        if (!dados.data_inicio) {
            aviso("Informe a data de início.");
            return false;
        }

        if (!dados.data_fim) {
            aviso("Informe a data de fim.");
            return false;
        }

        if (dados.data_fim < dados.data_inicio) {
            aviso("A data de fim não pode ser anterior à data de início.");
            return false;
        }

        return true;
    }

    function validarCopies(copies) {
        for (let i = 0; i < copies.length; i += 1) {
            const copy = copies[i];
            const n = i + 1;

            if (!copy.titulo) {
                aviso(`Digite o título do Copy ${n}.`);
                return false;
            }

            if (!copy.texto) {
                aviso(`Digite o texto do Copy ${n}.`);
                return false;
            }
        }

        return true;
    }

    function validarRegras(regras) {
        for (let i = 0; i < regras.length; i += 1) {
            const regra = regras[i];
            const n = i + 1;

            if (!regra.titulo && !regra.descricao) {
                aviso(`Preencha a Regra ${n}.`);
                return false;
            }

            // Garante título para o banco
            if (!regra.titulo) {
                regra.titulo = `Regra ${n}`;
            }
        }

        return true;
    }

    function validarMateriais(materiais) {
        for (let i = 0; i < materiais.length; i += 1) {
            const material = materiais[i];
            const n = i + 1;

            if (!material.nome) {
                aviso(`Digite o nome do Material ${n}.`);
                return false;
            }

            if (!material.formato) {
                aviso(`Selecione o formato da postagem do Material ${n}.`);
                return false;
            }
        }

        return true;
    }

    async function sincronizarCopies(campanhaCriadaId, copies) {
        const resposta = await fetch(
            `${API}/api/copies/por-campanha/${Number(campanhaCriadaId)}`,
            {
                method: "PUT",
                headers: await getAuthHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({ copies })
            }
        );

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                resultado.error ||
                resultado.detalhe ||
                "Erro ao salvar as copies."
            );
        }

        return resultado.copies || [];
    }

    async function sincronizarRegras(campanhaCriadaId, regras) {
        const lista = (Array.isArray(regras) ? regras : []).map((regra, index) => ({
            titulo: String(regra.titulo || "").trim() || `Regra ${index + 1}`,
            descricao: String(regra.descricao || "").trim() || null,
            ordem: Number(regra.ordem) > 0 ? Number(regra.ordem) : index + 1
        }));

        const resposta = await fetch(
            `${API}/api/regras/por-campanha/${Number(campanhaCriadaId)}`,
            {
                method: "PUT",
                headers: await getAuthHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({ regras: lista })
            }
        );

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                resultado.detalhe ||
                resultado.erro ||
                resultado.error ||
                "Erro ao salvar as regras."
            );
        }

        return resultado.regras || [];
    }

    async function criarMateriais(campanhaCriadaId, materiais) {
        for (let i = 0; i < materiais.length; i += 1) {
            const material = materiais[i];

            const resposta = await fetch(`${API}/api/materiais`, {
                method: "POST",
                headers: await getAuthHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({
                    campanha_id: Number(campanhaCriadaId),
                    nome: material.nome,
                    tipo: material.tipo,
                    formato: material.formato,
                    url: material.url
                })
            });

            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro ||
                    resultado.error ||
                    `Erro ao criar o Material ${i + 1}.`
                );
            }
        }
    }

    async function atualizarMaterialExistente(material) {
        const resposta = await fetch(`${API}/api/materiais/${material.id}`, {
            method: "PUT",
            headers: await getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                nome: material.nome,
                tipo: material.tipo,
                formato: material.formato,
                url: material.url
            })
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                resultado.error ||
                `Erro ao atualizar o material ${material.nome || material.id}.`
            );
        }

        return resultado.material;
    }

    async function sincronizarMateriais(campanhaCriadaId, materiais) {
        const lista = Array.isArray(materiais) ? materiais : [];

        for (let i = 0; i < lista.length; i += 1) {
            const material = lista[i];

            if (material.id) {
                await atualizarMaterialExistente(material);
            } else {
                await criarMateriais(campanhaCriadaId, [material]);
            }
        }
    }

    async function sincronizarAngulos(campanhaCriadaId, angulos) {
        const resposta = await fetch(
            `${API}/api/angulos/${Number(campanhaCriadaId)}`,
            {
                method: "PUT",
                headers: await getAuthHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({ angulos })
            }
        );

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                resultado.error ||
                resultado.detalhe ||
                "Erro ao salvar os ângulos de divulgação."
            );
        }

        return resultado.angulos || [];
    }

    async function carregarCampanhaParaEdicao() {
        const resposta = await fetch(`${API}/api/campanhas/${campanhaId}`);
        const campanha = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                campanha.erro || "Não foi possível carregar a campanha."
            );
        }

        preencherFormulario(campanha);

        if (copiesContainer) copiesContainer.innerHTML = "";
        if (regrasContainer) regrasContainer.innerHTML = "";
        if (materiaisContainer) materiaisContainer.innerHTML = "";
        if (angulosContainer) angulosContainer.innerHTML = "";
        contadorCopies = 0;
        contadorRegras = 0;
        contadorMateriais = 0;
        contadorAngulos = 0;

        const copiesResposta = await fetch(`${API}/api/copies/${campanhaId}`);
        const copies = await copiesResposta.json();

        if (copiesResposta.ok && Array.isArray(copies)) {
            copies
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .forEach((copy) => adicionarCopy(copy));
        }

        const regrasResposta = await fetch(`${API}/api/regras/${campanhaId}`);
        const regras = await regrasResposta.json();

        if (regrasResposta.ok && Array.isArray(regras) && regras.length > 0) {
            regras
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .forEach((regra) => adicionarRegra(regra));
        }

        const materiaisResposta = await fetch(`${API}/api/materiais/${campanhaId}`);
        const materiaisDados = await materiaisResposta.json();
        const materiais = Array.isArray(materiaisDados)
            ? materiaisDados
            : (materiaisDados ? [materiaisDados] : []);

        if (materiaisResposta.ok) {
            materiais.forEach((material) => adicionarMaterial(material));
        }

        const angulosResposta = await fetch(`${API}/api/angulos/${campanhaId}`);
        const angulos = await angulosResposta.json();

        if (angulosResposta.ok && Array.isArray(angulos)) {
            angulos
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .forEach((angulo) => adicionarAngulo(angulo));
        }
    }

    if (adicionarCopyBtn) {
        adicionarCopyBtn.addEventListener("click", () => adicionarCopy());
    }

    if (adicionarRegraBtn) {
        adicionarRegraBtn.addEventListener("click", () => adicionarRegra());
    }

    if (adicionarMaterialBtn) {
        adicionarMaterialBtn.addEventListener("click", () => adicionarMaterial());
    }

    if (adicionarMateriaisLoteBtn && materiaisBulkFile) {
        adicionarMateriaisLoteBtn.addEventListener("click", () => {
            materiaisBulkFile.value = "";
            materiaisBulkFile.click();
        });

        materiaisBulkFile.addEventListener("change", async () => {
            const files = Array.from(materiaisBulkFile.files || []);
            if (!files.length) return;

            const cardVazio = Array.from(
                materiaisContainer?.querySelectorAll(".material-item") || []
            ).find((item) => !item.querySelector(".material-url")?.value?.trim());

            await processarArquivosMateriais(
                cardVazio || null,
                files,
                "stories"
            );

            materiaisBulkFile.value = "";
        });
    }

    if (adicionarMecanicaBtn) {
        adicionarMecanicaBtn.addEventListener("click", () => adicionarPassoMecanica());
    }

    if (adicionarAnguloBtn) {
        adicionarAnguloBtn.addEventListener("click", () => adicionarAngulo());
    }

    if (mecanicaContainer) {
        mecanicaContainer.addEventListener("click", (event) => {
            const removerBtn = event.target.closest(".mecanica-item__remove");
            if (!removerBtn) return;

            const item = removerBtn.closest(".mecanica-item");
            if (!item) return;

            item.remove();
        });
    }

    if (angulosContainer) {
        angulosContainer.addEventListener("click", (event) => {
            const removerBtn = event.target.closest(".angulo-item__remove");
            if (!removerBtn) return;

            const item = removerBtn.closest(".angulo-item");
            if (!item) return;

            item.remove();
        });
    }

    if (copiesContainer) {
        copiesContainer.addEventListener("click", (event) => {
            const removerBtn = event.target.closest(".remover-copy");
            if (!removerBtn) return;

            const copy = removerBtn.closest(".copy-item");
            if (!copy) return;

            copy.remove();
            atualizarOrdens();
        });
    }

    if (regrasContainer) {
        regrasContainer.addEventListener("click", (event) => {
            const removerBtn = event.target.closest(".remover-regra");
            if (!removerBtn) return;

            const regra = removerBtn.closest(".regra-item");
            if (!regra) return;

            regra.remove();
            atualizarOrdensRegras();
        });
    }

    if (materiaisContainer) {
        materiaisContainer.addEventListener("click", (event) => {
            const material = event.target.closest(".material-item");
            if (!material) return;

            const selectBtn = event.target.closest(
                ".material-upload-select, .material-upload-replace"
            );
            if (selectBtn) {
                event.preventDefault();
                event.stopPropagation();
                material.querySelector(".material-upload-file")?.click();
                return;
            }

            const excluirBtn = event.target.closest(".material-upload-remove");
            if (excluirBtn) {
                event.preventDefault();
                event.stopPropagation();
                material.remove();
                atualizarTitulosMateriais();
                return;
            }

            const clearBtn = event.target.closest(".material-upload-clear");
            if (clearBtn) {
                event.preventDefault();
                event.stopPropagation();
                limparUploadMaterial(material);
                return;
            }

            const dropzone = event.target.closest(".material-upload-dropzone");
            if (
                dropzone &&
                !event.target.closest("button") &&
                !event.target.closest("select") &&
                !event.target.closest("label") &&
                !event.target.closest(".material-upload-preview") &&
                !event.target.closest(".material-upload-meta")
            ) {
                const urlAtual = material.querySelector(".material-url")?.value;
                if (!urlAtual) {
                    material.querySelector(".material-upload-file")?.click();
                }
            }
        });

        materiaisContainer.addEventListener("change", async (event) => {
            const fileInput = event.target.closest(".material-upload-file");
            if (!fileInput) return;

            const material = fileInput.closest(".material-item");
            const files = Array.from(fileInput.files || []);
            if (!material || !files.length) return;

            const formato =
                material.querySelector(".material-formato")?.value || "stories";

            await processarArquivosMateriais(material, files, formato);
            fileInput.value = "";
        });

        ["dragenter", "dragover"].forEach((evento) => {
            materiaisContainer.addEventListener(evento, (event) => {
                const dropzone = event.target.closest(".material-upload-dropzone");
                if (!dropzone) return;
                event.preventDefault();
                event.stopPropagation();
                dropzone.classList.add("is-dragover");
            });
        });

        ["dragleave", "drop"].forEach((evento) => {
            materiaisContainer.addEventListener(evento, (event) => {
                const dropzone = event.target.closest(".material-upload-dropzone");
                if (!dropzone) return;
                event.preventDefault();
                event.stopPropagation();
                dropzone.classList.remove("is-dragover");
            });
        });

        materiaisContainer.addEventListener("drop", async (event) => {
            const dropzone = event.target.closest(".material-upload-dropzone");
            if (!dropzone) return;

            const material = dropzone.closest(".material-item");
            const files = Array.from(event.dataTransfer?.files || []);
            if (!material || !files.length) return;

            const formato =
                material.querySelector(".material-formato")?.value || "stories";

            await processarArquivosMateriais(material, files, formato);
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const textoOriginal = submitButton?.innerHTML;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = isEditando ? "Salvando..." : "Criando...";
        }

        let salvou = false;

        try {
            if (uploadImagemEmAndamento || uploadMaterialEmAndamento > 0) {
                aviso("Aguarde o envio dos arquivos terminar.");
                return;
            }

            const dados = pegarDadosCampanha();
            const copies = pegarCopies().filter(
                (copy) => copy.titulo || copy.texto || copy.canal || copy.tipo
            );
            const regras = pegarRegras().filter(
                (regra) => regra.titulo || regra.descricao
            );
            const materiais = pegarMateriais().filter(
                (material) => material.nome || material.url
            );
            const angulos = pegarAngulos().filter(
                (angulo) => angulo.titulo || angulo.descricao
            );

            if (
                !validarCampanha(dados) ||
                !validarCopies(copies) ||
                !validarRegras(regras) ||
                !validarMateriais(materiais)
            ) {
                return;
            }

            const url = isEditando
                ? `${API}/api/campanhas/${campanhaId}`
                : `${API}/api/campanhas`;

            const method = isEditando ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: await getAuthHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify(dados)
            });

            const resultado = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    resultado.erro ||
                    resultado.error ||
                    (isEditando
                        ? "Erro ao atualizar campanha."
                        : "Erro ao criar campanha.")
                );
            }

            const campanha = resultado.campanha || resultado;
            const idCriado =
                campanha?.id ||
                resultado.campanha_id ||
                resultado.id ||
                campanhaId;

            // Em criação/edição: sincroniza copies, regras, ângulos e materiais
            // (POST novos + PUT existentes, incluindo formato).
            if (idCriado) {
                await sincronizarCopies(idCriado, copies);
                await sincronizarRegras(idCriado, regras);
                await sincronizarAngulos(idCriado, angulos);
                await sincronizarMateriais(idCriado, materiais);
            }

            salvou = true;
            aviso(
                isEditando
                    ? "✓ Alterações salvas"
                    : "✓ Campanha publicada",
                "ok"
            );

            if (submitButton) {
                submitButton.innerHTML = "✓ Alterações salvas";
            }

            await new Promise((resolve) => window.setTimeout(resolve, 650));
            irParaCampanhas();
        } catch (error) {
            console.error("Erro ao salvar campanha:", error);
            aviso(error.message || "Erro ao salvar campanha.", "error");
        } finally {
            if (!salvou && submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML =
                    textoOriginal ||
                    '<i class="fa-solid fa-floppy-disk"></i> Salvar campanha';
            }
        }
    });

    // Modo edição: carrega dados existentes.
    // Modo criação: seções vazias — o usuário adiciona campos sob demanda.
    if (isEditando) {
        carregarCampanhaParaEdicao().catch((error) => {
            console.error(error);
            aviso(error.message || "Erro ao carregar campanha.", "error");
            irParaCampanhas();
        });
    } else {
        preencherMecanica([]);
    }
});
