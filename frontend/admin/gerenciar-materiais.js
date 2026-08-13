const API = "http://localhost:3000";

const viewCampanhas = document.querySelector("#viewCampanhas");
const viewMateriais = document.querySelector("#viewMateriais");
const campanhasGrid = document.querySelector("#campanhasGrid");
const campanhasState = document.querySelector("#campanhasState");
const materiaisLista = document.querySelector("#materiaisLista");
const materiaisState = document.querySelector("#materiaisState");
const materiaisTitulo = document.querySelector("#materiaisTitulo");
const materiaisSubtitulo = document.querySelector("#materiaisSubtitulo");
const adicionarMaterialBtn = document.querySelector("#adicionarMaterialBtn");

const materialModal = document.querySelector("#materialModal");
const materialForm = document.querySelector("#materialForm");
const materialIdInput = document.querySelector("#materialId");
const materialNomeInput = document.querySelector("#materialNome");
const materialTipoInput = document.querySelector("#materialTipo");
const materialFormatoInput = document.querySelector("#materialFormato");
const materialUrlInput = document.querySelector("#materialUrl");
const materialFileInput = document.querySelector("#materialFile");
const materialDropzone = document.querySelector("#materialDropzone");
const materialPreviewImg = document.querySelector("#materialPreviewImg");
const materialFileName = document.querySelector("#materialFileName");
const materialUploadStatus = document.querySelector("#materialUploadStatus");
const materialModalTitle = document.querySelector("#materialModalTitle");
const materialSalvarBtn = document.querySelector("#materialSalvarBtn");

let campanhaSelecionada = null;
let campanhasCache = [];
let materiaisCache = [];
let filtroFormato = "todos";
let uploadEmAndamento = false;

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function formatarData(valor) {
    if (!valor) return "—";
    const raw = String(valor).slice(0, 10);
    const [ano, mes, dia] = raw.split("-");
    if (!ano || !mes || !dia) return escaparHtml(valor);
    return `${dia}/${mes}/${ano}`;
}

function normalizarStatus(status) {
    return String(status || "").trim().toLowerCase();
}

function ehCampanhaAtiva(campanha) {
    const status = normalizarStatus(campanha?.status);
    if (status === "ativa") return true;
    if (status !== "agendada") return false;
    const pronta = campanha?.pronta_publicacao;
    return (
        pronta === true
        || pronta === "true"
        || pronta === 1
        || pronta === "1"
    );
}

function imagemCampanha(campanha) {
    return (
        campanha?.imagem_card
        || campanha?.banner
        || campanha?.imagem
        || campanha?.story_url
        || "../images/post.png"
    );
}

function nomeArquivoDeUrl(url) {
    if (!url) return "";
    try {
        const path = String(url).split("?")[0];
        return decodeURIComponent(path.substring(path.lastIndexOf("/") + 1));
    } catch {
        return "arquivo";
    }
}

function ehUrlImagem(url) {
    return /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(String(url || ""));
}

function tipoPorArquivo(file) {
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
    if (["stories", "feed", "videos", "banners"].includes(bruto)) return bruto;
    if (bruto.includes("stor")) return "stories";
    if (bruto.includes("feed")) return "feed";
    if (bruto.includes("video")) return "videos";
    if (bruto.includes("banner")) return "banners";
    return "";
}

function inferirFormatoLegado(material = {}) {
    return (
        normalizarFormatoMaterial(material.formato)
        || normalizarFormatoMaterial(material.tipo)
        || "stories"
    );
}

function labelFormato(formato) {
    const mapa = {
        stories: "Stories",
        feed: "Feed",
        videos: "Vídeos",
        banners: "Banners"
    };
    return mapa[formato] || "Outros";
}

function inferirTipoArquivo(material = {}) {
    const tipo = String(material.tipo || "").trim().toLowerCase();
    if (["imagem", "video", "arquivo"].includes(tipo)) return tipo;

    const url = String(material.url || material.arquivo || "");
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return "video";
    if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url)) return "imagem";
    return "arquivo";
}

function formatarTamanhoArquivo(valor) {
    const n = Number(valor);
    if (!n || n < 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function aviso(mensagem, tipo = "ok") {
    if (tipo === "error") window.ShiverUI?.notifyError(mensagem);
    else if (tipo === "warn") window.ShiverUI?.notifyWarn(mensagem);
    else window.ShiverUI?.notifyOk(mensagem);
}

function mostrarEstado(el, mensagem, tipo = "") {
    if (!el) return;
    el.hidden = !mensagem;
    el.textContent = mensagem || "";
    el.className = `gm-state${tipo ? ` ${tipo}` : ""}`;
}

function setStatusUpload(mensagem, tipo = "") {
    if (!materialUploadStatus) return;

    if (!mensagem) {
        materialUploadStatus.hidden = true;
        materialUploadStatus.textContent = "";
        materialUploadStatus.className = "upload-dropzone__status material-upload-status";
        return;
    }

    materialUploadStatus.hidden = false;
    materialUploadStatus.textContent = mensagem;
    materialUploadStatus.className =
        `upload-dropzone__status material-upload-status ${tipo}`.trim();
}

function mostrarPreviewArquivo(url, nomeArquivo = "") {
    const empty = materialDropzone?.querySelector(".material-upload-empty");
    const preview = materialDropzone?.querySelector(".material-upload-preview");

    if (materialUrlInput) materialUrlInput.value = url || "";

    if (materialPreviewImg) {
        if (ehUrlImagem(url) && url) {
            materialPreviewImg.hidden = false;
            materialPreviewImg.src = url;
            materialPreviewImg.alt = nomeArquivo || "Preview do material";
        } else {
            materialPreviewImg.hidden = true;
            materialPreviewImg.removeAttribute("src");
        }
    }

    if (materialFileName) {
        materialFileName.textContent =
            nomeArquivo || nomeArquivoDeUrl(url) || "arquivo";
    }

    const sizeEl = document.querySelector("#materialFileSize");
    if (sizeEl) sizeEl.textContent = "";

    if (empty) empty.hidden = Boolean(url);
    if (preview) preview.hidden = !url;
    materialDropzone?.classList.toggle("has-preview", Boolean(url));
}

function limparUpload() {
    if (materialFileInput) materialFileInput.value = "";
    mostrarPreviewArquivo("", "");
    setStatusUpload("");
    materialDropzone?.classList.remove("is-dragover", "is-uploading");
}

async function contarMateriais(campanhaId) {
    try {
        const resposta = await fetch(`${API}/api/materiais/${campanhaId}`);
        if (!resposta.ok) return 0;
        const dados = await resposta.json();
        return Array.isArray(dados) ? dados.length : 0;
    } catch {
        return 0;
    }
}

function renderCampanhaCard(campanha, qtdMateriais) {
    const card = document.createElement("article");
    card.className = "gm-campaign-card";
    card.dataset.id = String(campanha.id);

    const titulo =
        campanha.titulo || campanha.nome || `Campanha #${campanha.id}`;

    card.innerHTML = `
        <div class="gm-campaign-card__media">
            <img src="${escaparHtml(imagemCampanha(campanha))}" alt="${escaparHtml(titulo)}">
        </div>
        <h3>${escaparHtml(titulo)}</h3>
        <div class="gm-campaign-card__meta">
            <span>${formatarData(campanha.data_inicio)} — ${formatarData(campanha.data_fim)}</span>
            <span class="gm-status">Ativa</span>
            <span class="gm-campaign-card__count">
                ${qtdMateriais} ${qtdMateriais === 1 ? "material" : "materiais"}
            </span>
        </div>
        <button type="button" class="gm-btn gm-btn--primary gm-btn--block" data-action="abrir-materiais">
            <i class="fa-regular fa-images"></i>
            Gerenciar materiais
        </button>
    `;

    return card;
}

async function carregarCampanhasAtivas() {
    if (!campanhasGrid || !campanhasState) return;

    campanhasGrid.innerHTML = "";
    mostrarEstado(campanhasState, "Carregando campanhas...", "is-loading");

    try {
        const resposta = await fetch(`${API}/api/campanhas`);

        if (!resposta.ok) {
            throw new Error("Falha ao buscar campanhas");
        }

        const campanhas = await resposta.json();
        const ativas = (Array.isArray(campanhas) ? campanhas : [])
            .filter(ehCampanhaAtiva);

        campanhasCache = ativas;

        if (ativas.length === 0) {
            campanhasGrid.innerHTML = "";
            mostrarEstado(
                campanhasState,
                "Não existem campanhas ativas ainda. Crie sua primeira campanha para começar."
            );
            return;
        }

        mostrarEstado(campanhasState, "");

        const contagens = await Promise.all(
            ativas.map((c) => contarMateriais(c.id))
        );

        ativas.forEach((campanha, index) => {
            campanhasGrid.appendChild(
                renderCampanhaCard(campanha, contagens[index])
            );
        });
    } catch (error) {
        console.error("Erro ao carregar campanhas ativas:", error);
        campanhasGrid.innerHTML = "";
        mostrarEstado(
            campanhasState,
            "Não foi possível carregar as campanhas. Tente novamente.",
            "is-error"
        );
    }
}

function renderMaterialCard(material) {
    const card = document.createElement("article");
    card.className = "gm-material-card";
    card.dataset.id = String(material.id);

    const nome = material.nome || "Material";
    const formato = inferirFormatoLegado(material);
    const tipo = inferirTipoArquivo(material);
    const url = material.url || "";
    const descricao = material.descricao || material.descricao_material || "";
    const tamanho = formatarTamanhoArquivo(
        material.tamanho || material.size || material.tamanho_arquivo
    );
    const preview = ehUrlImagem(url)
        ? `<img src="${escaparHtml(url)}" alt="${escaparHtml(nome)}">`
        : `<i class="fa-regular fa-file"></i>`;

    card.innerHTML = `
        <div class="gm-material-card__preview">${preview}</div>
        <div class="gm-material-card__body">
            <h3>${escaparHtml(nome)}</h3>
            ${descricao ? `<p>${escaparHtml(descricao)}</p>` : ""}
            <p>Arquivo: ${escaparHtml(nomeArquivoDeUrl(url) || "—")}</p>
            <span class="gm-material-card__type">${escaparHtml(labelFormato(formato))} · ${escaparHtml(tipo)}${tamanho ? ` · ${escaparHtml(tamanho)}` : ""}</span>
        </div>
        <div class="gm-material-card__actions">
            <button type="button" class="gm-btn gm-btn--sm gm-btn--view" data-action="visualizar" ${url ? "" : "disabled"}>
                <i class="fa-solid fa-eye"></i>
                Visualizar
            </button>
            <button type="button" class="gm-btn gm-btn--sm gm-btn--download" data-action="baixar" ${url ? "" : "disabled"}>
                <i class="fa-solid fa-download"></i>
                Baixar
            </button>
            <button type="button" class="gm-btn gm-btn--sm gm-btn--edit" data-action="editar">
                <i class="fa-solid fa-pen"></i>
                Editar
            </button>
            <button type="button" class="gm-btn gm-btn--sm gm-btn--danger" data-action="excluir">
                <i class="fa-solid fa-trash"></i>
                Excluir
            </button>
        </div>
    `;

    return card;
}

async function carregarMateriaisCampanha(campanha) {
    if (!materiaisLista || !materiaisState || !campanha?.id) return;

    campanhaSelecionada = campanha;
    materiaisLista.innerHTML = "";
    mostrarEstado(materiaisState, "Carregando materiais...", "is-loading");

    const titulo =
        campanha.titulo || campanha.nome || `Campanha #${campanha.id}`;

    if (materiaisTitulo) {
        materiaisTitulo.textContent = `Materiais — ${titulo}`;
    }
    if (materiaisSubtitulo) {
        materiaisSubtitulo.textContent =
            `${formatarData(campanha.data_inicio)} — ${formatarData(campanha.data_fim)}`;
    }

    try {
        const resposta = await fetch(`${API}/api/materiais/${campanha.id}`);

        if (!resposta.ok) {
            throw new Error("Falha ao buscar materiais");
        }

        const dados = await resposta.json();
        materiaisCache = Array.isArray(dados) ? dados : [];

        if (materiaisCache.length === 0) {
            materiaisLista.innerHTML = "";
            materiaisState.hidden = false;
            materiaisState.className = "gm-state";
            materiaisState.innerHTML = `
                <p>Esta campanha ainda não possui materiais cadastrados.</p>
                <small>Adicione o primeiro material para começar.</small>
                <div class="gm-empty-actions">
                    <button type="button" class="gm-btn gm-btn--primary" id="emptyAddMaterialBtn">
                        <i class="fa-solid fa-plus"></i>
                        Adicionar material
                    </button>
                </div>
            `;
            document
                .querySelector("#emptyAddMaterialBtn")
                ?.addEventListener("click", () => abrirModalMaterial());
            return;
        }

        mostrarEstado(materiaisState, "");
        renderListaMateriais();
    } catch (error) {
        console.error("Erro ao carregar materiais:", error);
        materiaisLista.innerHTML = "";
        mostrarEstado(
            materiaisState,
            "Não foi possível carregar os materiais. Tente novamente.",
            "is-error"
        );
    }
}

function renderListaMateriais() {
    if (!materiaisLista) return;

    const lista = filtroFormato === "todos"
        ? materiaisCache
        : materiaisCache.filter((item) => inferirFormatoLegado(item) === filtroFormato);

    materiaisLista.innerHTML = "";

    if (!lista.length) {
        materiaisState.hidden = false;
        materiaisState.className = "gm-state";
        materiaisState.innerHTML = `
            <p>Não existem materiais neste formato ainda.</p>
            <small>Altere o filtro ou adicione um novo material.</small>
        `;
        return;
    }

    mostrarEstado(materiaisState, "");
    lista.forEach((material) => {
        materiaisLista.appendChild(renderMaterialCard(material));
    });
}

function mostrarViewCampanhas() {
    campanhaSelecionada = null;
    if (viewCampanhas) viewCampanhas.hidden = false;
    if (viewMateriais) viewMateriais.hidden = true;
    carregarCampanhasAtivas();
}

function mostrarViewMateriais(campanha) {
    if (viewCampanhas) viewCampanhas.hidden = true;
    if (viewMateriais) viewMateriais.hidden = false;
    carregarMateriaisCampanha(campanha);
}

function abrirModalMaterial(material = null) {
    if (!materialModal || !campanhaSelecionada) return;

    materialForm?.reset();
    limparUpload();

    if (material) {
        if (materialModalTitle) {
            materialModalTitle.textContent = "Editar material";
        }
        if (materialIdInput) materialIdInput.value = String(material.id || "");
        if (materialNomeInput) materialNomeInput.value = material.nome || "";
        if (materialFormatoInput) {
            materialFormatoInput.value = inferirFormatoLegado(material);
        }
        if (materialTipoInput) {
            materialTipoInput.value = inferirTipoArquivo(material);
        }
        mostrarPreviewArquivo(material.url || "", nomeArquivoDeUrl(material.url));
    } else {
        if (materialModalTitle) {
            materialModalTitle.textContent = "Adicionar material";
        }
        if (materialIdInput) materialIdInput.value = "";
        if (materialFormatoInput) materialFormatoInput.value = "stories";
        if (materialTipoInput) materialTipoInput.value = "";
    }

    materialModal.hidden = false;
}

function fecharModalMaterial() {
    if (!materialModal) return;
    materialModal.hidden = true;
    limparUpload();
    materialForm?.reset();
}

async function enviarArquivoViaApi(file) {
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

    return dados;
}

async function processarUploadArquivo(file) {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        setStatusUpload("O arquivo deve ter no máximo 50 MB.", "is-error");
        return;
    }

    uploadEmAndamento = true;
    if (materialSalvarBtn) materialSalvarBtn.disabled = true;
    materialDropzone?.classList.add("is-uploading");
    setStatusUpload("Enviando arquivo...", "is-loading");

    try {
        const resultado = await enviarArquivoViaApi(file);
        const url = resultado.url;

        if (!url) {
            throw new Error("Upload concluído, mas a URL não foi retornada.");
        }

        if (materialTipoInput) {
            materialTipoInput.value = tipoPorArquivo(file);
        }

        if (materialNomeInput && !materialNomeInput.value.trim()) {
            materialNomeInput.value = file.name.replace(/\.[^.]+$/, "");
        }

        mostrarPreviewArquivo(url, file.name || resultado.nomeOriginal);
        const sizeEl = document.querySelector("#materialFileSize");
        if (sizeEl) sizeEl.textContent = formatarTamanhoArquivo(file.size);
        setStatusUpload("Arquivo enviado com sucesso.", "is-success");
    } catch (error) {
        console.error("Erro no upload:", error);
        setStatusUpload(
            error.message || "Erro ao enviar arquivo.",
            "is-error"
        );
    } finally {
        uploadEmAndamento = false;
        if (materialSalvarBtn) materialSalvarBtn.disabled = false;
        materialDropzone?.classList.remove("is-uploading");
        if (materialFileInput) materialFileInput.value = "";
    }
}

async function salvarMaterial(event) {
    event.preventDefault();

    if (!campanhaSelecionada?.id) return;

    if (uploadEmAndamento) {
        setStatusUpload("Aguarde o upload terminar.", "is-error");
        return;
    }

    const nome = materialNomeInput?.value.trim() || "";
    const formato = normalizarFormatoMaterial(materialFormatoInput?.value);
    let tipo = String(materialTipoInput?.value || "").trim().toLowerCase();
    const url = materialUrlInput?.value.trim() || "";
    const materialId = materialIdInput?.value.trim() || "";

    if (!nome) {
        setStatusUpload("Informe o nome do material.", "is-error");
        return;
    }

    if (!formato) {
        setStatusUpload("Selecione o formato da postagem.", "is-error");
        return;
    }

    if (!["imagem", "video", "arquivo"].includes(tipo)) {
        tipo = inferirTipoArquivo({ url, tipo });
    }

    if (materialSalvarBtn) materialSalvarBtn.disabled = true;

    try {
        const headers = await getAuthHeaders({
            "Content-Type": "application/json"
        });

        const payload = { nome, tipo, formato, url };
        let resposta;

        if (materialId) {
            resposta = await fetch(`${API}/api/materiais/${materialId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload)
            });
        } else {
            resposta = await fetch(`${API}/api/materiais`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    ...payload,
                    campanha_id: campanhaSelecionada.id
                })
            });
        }

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.error || "Não foi possível salvar o material."
            );
        }

        fecharModalMaterial();
        aviso("✓ Alterações salvas");
        await carregarMateriaisCampanha(campanhaSelecionada);
    } catch (error) {
        console.error("Erro ao salvar material:", error);
        setStatusUpload(
            error.message || "Erro ao salvar material.",
            "is-error"
        );
    } finally {
        if (materialSalvarBtn) materialSalvarBtn.disabled = false;
    }
}

async function excluirMaterial(material) {
    if (!material?.id) return;

    const ok = window.confirm(
        `Excluir o material "${material.nome || material.id}"?`
    );
    if (!ok) return;

    try {
        const headers = await getAuthHeaders();
        const resposta = await fetch(`${API}/api/materiais/${material.id}`, {
            method: "DELETE",
            headers
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.error || "Não foi possível excluir."
            );
        }

        await carregarMateriaisCampanha(campanhaSelecionada);
        aviso("Item removido");
    } catch (error) {
        console.error("Erro ao excluir material:", error);
        aviso(error.message || "Erro ao excluir material.", "error");
    }
}

function extensaoDeUrl(url) {
    const nome = nomeArquivoDeUrl(url);
    if (!nome.includes(".")) return "";
    const ext = nome.split(".").pop().toLowerCase();
    return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

function nomeDownloadMaterial(material) {
    const daUrl = nomeArquivoDeUrl(material?.url);
    if (daUrl) return daUrl;

    const base = String(material?.nome || "material")
        .trim()
        .replace(/[^\w.\-]+/g, "_")
        .replace(/_{2,}/g, "_")
        || "material";

    const ext = extensaoDeUrl(material?.url);
    if (ext && !base.toLowerCase().endsWith(`.${ext}`)) {
        return `${base}.${ext}`;
    }

    return base;
}

async function baixarArquivo(material, botao) {
    const url = material?.url;
    if (!url) return;

    const nomeArquivo = nomeDownloadMaterial(material);
    const labelOriginal = botao?.innerHTML;

    if (botao) {
        botao.classList.add("is-loading");
        botao.disabled = true;
        botao.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Baixando...`;
    }

    try {
        // Preferência: endpoint do backend (Content-Disposition: attachment)
        const endpoint =
            `${API}/api/download/file`
            + `?url=${encodeURIComponent(url)}`
            + `&nome=${encodeURIComponent(nomeArquivo)}`;

        const resposta = await fetch(endpoint);

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        const blob = await resposta.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (error) {
        console.error("Erro ao baixar via API, tentando URL direta:", error);

        try {
            const resposta = await fetch(url, { mode: "cors" });
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

            const blob = await resposta.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        } catch (fallbackError) {
            console.error("Erro ao baixar arquivo:", fallbackError);
        window.ShiverUI?.notifyError("Não foi possível baixar o arquivo. Tente novamente.");
        }
    } finally {
        if (botao) {
            botao.classList.remove("is-loading");
            botao.disabled = false;
            botao.innerHTML =
                labelOriginal || `<i class="fa-solid fa-download"></i> Baixar`;
        }
    }
}

function visualizarArquivo(material) {
    if (!material?.url) return;
    window.open(material.url, "_blank", "noopener,noreferrer");
}

/* Eventos */
document.querySelector("#voltarDashboardBtn")?.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

document.querySelector("#voltarCampanhasBtn")?.addEventListener("click", () => {
    mostrarViewCampanhas();
});

adicionarMaterialBtn?.addEventListener("click", () => abrirModalMaterial());

campanhasGrid?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action='abrir-materiais']");
    if (!btn) return;

    const card = btn.closest(".gm-campaign-card");
    const id = Number(card?.dataset.id);
    if (!id) return;

    const campanha = campanhasCache.find((item) => Number(item.id) === id);
    if (!campanha) {
        window.ShiverUI?.notifyError("Não foi possível abrir a campanha.");
        return;
    }

    mostrarViewMateriais(campanha);
});

materiaisLista?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;

    const card = btn.closest(".gm-material-card");
    const id = Number(card?.dataset.id);
    const material = materiaisCache.find((item) => Number(item.id) === id);
    if (!material) return;

    const action = btn.dataset.action;

    if (action === "visualizar") visualizarArquivo(material);
    if (action === "baixar") baixarArquivo(material, btn);
    if (action === "editar") abrirModalMaterial(material);
    if (action === "excluir") excluirMaterial(material);
});

document.querySelector("#materialModalClose")?.addEventListener("click", fecharModalMaterial);
document.querySelector("#materialCancelBtn")?.addEventListener("click", fecharModalMaterial);
document.querySelector("#materialModalOverlay")?.addEventListener("click", fecharModalMaterial);

materialForm?.addEventListener("submit", salvarMaterial);

materialDropzone?.addEventListener("click", (event) => {
    if (
        event.target.closest(".material-upload-select")
        || event.target.closest(".material-upload-replace")
    ) {
        materialFileInput?.click();
        return;
    }

    if (event.target.closest(".material-upload-clear")) {
        limparUpload();
        return;
    }

    if (
        event.target.closest(".material-upload-dropzone")
        && !event.target.closest(".material-upload-preview")
        && !materialUrlInput?.value
    ) {
        materialFileInput?.click();
    }
});

materialFileInput?.addEventListener("change", () => {
    const file = materialFileInput.files?.[0];
    if (file) processarUploadArquivo(file);
});

["dragenter", "dragover"].forEach((evento) => {
    materialDropzone?.addEventListener(evento, (event) => {
        event.preventDefault();
        materialDropzone.classList.add("is-dragover");
    });
});

["dragleave", "drop"].forEach((evento) => {
    materialDropzone?.addEventListener(evento, (event) => {
        event.preventDefault();
        materialDropzone.classList.remove("is-dragover");
    });
});

materialDropzone?.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) processarUploadArquivo(file);
});

async function iniciar() {
    const session = await requireAdminSession();
    if (!session) return;
    await carregarCampanhasAtivas();

    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;

    let campanha = campanhasCache.find((item) => String(item.id) === String(id));
    if (!campanha) {
        try {
            const resposta = await fetch(`${API}/api/campanhas/${id}`);
            if (resposta.ok) campanha = await resposta.json();
        } catch (error) {
            console.error("Erro ao abrir campanha pelos materiais:", error);
        }
    }

    if (campanha?.id) mostrarViewMateriais(campanha);
}

document.querySelector("#materiaisFiltros")?.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-formato]");
    if (!botao) return;

    filtroFormato = botao.dataset.formato || "todos";
    document.querySelectorAll("#materiaisFiltros .saas-filter").forEach((item) => {
        item.classList.toggle("is-active", item === botao);
    });

    if (campanhaSelecionada) renderListaMateriais();
});

iniciar();
