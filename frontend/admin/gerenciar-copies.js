const API = "http://localhost:3000";

const viewCampanhas = document.querySelector("#viewCampanhas");
const viewCopies = document.querySelector("#viewCopies");
const campanhasGrid = document.querySelector("#campanhasGrid");
const campanhasState = document.querySelector("#campanhasState");
const copiesLista = document.querySelector("#copiesLista");
const copiesState = document.querySelector("#copiesState");
const copiesTitulo = document.querySelector("#copiesTitulo");
const copiesSubtitulo = document.querySelector("#copiesSubtitulo");
const adicionarCopyBtn = document.querySelector("#adicionarCopyBtn");

const copyModal = document.querySelector("#copyModal");
const copyForm = document.querySelector("#copyForm");
const copyIdInput = document.querySelector("#copyId");
const copyTituloInput = document.querySelector("#copyTitulo");
const copyTextoInput = document.querySelector("#copyTexto");
const copyCanalInput = document.querySelector("#copyCanal");
const copyTipoInput = document.querySelector("#copyTipo");
const copyOrdemInput = document.querySelector("#copyOrdem");
const copyModalTitle = document.querySelector("#copyModalTitle");
const copySalvarBtn = document.querySelector("#copySalvarBtn");
const copyFormStatus = document.querySelector("#copyFormStatus");

const copyViewModal = document.querySelector("#copyViewModal");
const copyViewTitle = document.querySelector("#copyViewTitle");
const copyViewMeta = document.querySelector("#copyViewMeta");
const copyViewTexto = document.querySelector("#copyViewTexto");

let campanhaSelecionada = null;
let campanhasCache = [];
let copiesCache = [];
let copyVisualizada = null;

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

function mostrarEstado(el, mensagem, tipo = "") {
    if (!el) return;
    el.hidden = !mensagem;
    el.textContent = mensagem || "";
    el.className = `gm-state${tipo ? ` ${tipo}` : ""}`;
}

function setFormStatus(mensagem, tipo = "") {
    if (!copyFormStatus) return;

    if (!mensagem) {
        copyFormStatus.hidden = true;
        copyFormStatus.textContent = "";
        copyFormStatus.className = "gc-form-status";
        return;
    }

    copyFormStatus.hidden = false;
    copyFormStatus.textContent = mensagem;
    copyFormStatus.className = `gc-form-status ${tipo}`.trim();
}

async function contarCopies(campanhaId) {
    try {
        const resposta = await fetch(`${API}/api/copies/${campanhaId}`);
        if (!resposta.ok) return 0;
        const dados = await resposta.json();
        return Array.isArray(dados) ? dados.length : 0;
    } catch {
        return 0;
    }
}

function renderCampanhaCard(campanha, qtdCopies) {
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
                ${qtdCopies} ${qtdCopies === 1 ? "copy" : "copies"}
            </span>
        </div>
        <button type="button" class="gm-btn gm-btn--primary gm-btn--block" data-action="abrir-copies">
            <i class="fa-regular fa-file-lines"></i>
            Gerenciar copies
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
                "Nenhuma campanha ativa no momento."
            );
            return;
        }

        mostrarEstado(campanhasState, "");

        const contagens = await Promise.all(
            ativas.map((c) => contarCopies(c.id))
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

function renderCopyCard(copy, index) {
    const card = document.createElement("article");
    card.className = "gc-copy-card";
    card.dataset.id = String(copy.id);

    const titulo = copy.titulo || "Copy";
    const texto = copy.texto || "";
    const canal = copy.canal || "—";
    const tipo = copy.tipo || "—";
    const ordem = copy.ordem ?? index + 1;

    card.innerHTML = `
        <div class="gc-copy-card__body">
            <span class="gc-copy-card__badge">COPY ${escaparHtml(ordem)}</span>
            <h3>${escaparHtml(titulo)}</h3>
            <p class="gc-copy-card__texto">${escaparHtml(texto)}</p>
            <div class="gc-copy-card__tags">
                <span>Canal: ${escaparHtml(canal)}</span>
                <span>Tipo: ${escaparHtml(tipo)}</span>
                <span>Ordem: ${escaparHtml(ordem)}</span>
            </div>
        </div>
        <div class="gc-copy-card__actions">
            <button type="button" class="gm-btn gm-btn--sm gm-btn--view" data-action="visualizar">
                <i class="fa-solid fa-eye"></i>
                Visualizar
            </button>
            <button type="button" class="gm-btn gm-btn--sm gm-btn--download" data-action="copiar">
                <i class="fa-regular fa-copy"></i>
                Copiar
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

async function carregarCopiesCampanha(campanha) {
    if (!copiesLista || !copiesState || !campanha?.id) return;

    campanhaSelecionada = campanha;
    copiesLista.innerHTML = "";
    mostrarEstado(copiesState, "Carregando copies...", "is-loading");

    const titulo =
        campanha.titulo || campanha.nome || `Campanha #${campanha.id}`;

    if (copiesTitulo) {
        copiesTitulo.textContent = `Copies — ${titulo}`;
    }
    if (copiesSubtitulo) {
        copiesSubtitulo.textContent =
            `${formatarData(campanha.data_inicio)} — ${formatarData(campanha.data_fim)}`;
    }

    try {
        const resposta = await fetch(`${API}/api/copies/${campanha.id}`);

        if (!resposta.ok) {
            throw new Error("Falha ao buscar copies");
        }

        const dados = await resposta.json();
        copiesCache = Array.isArray(dados) ? dados : [];

        if (copiesCache.length === 0) {
            copiesLista.innerHTML = "";
            copiesState.hidden = false;
            copiesState.className = "gm-state";
            copiesState.innerHTML = `
                <p>Esta campanha ainda não possui copies cadastradas.</p>
                <div class="gm-empty-actions">
                    <button type="button" class="gm-btn gm-btn--primary" id="emptyAddCopyBtn">
                        <i class="fa-solid fa-plus"></i>
                        Adicionar copy
                    </button>
                </div>
            `;
            document
                .querySelector("#emptyAddCopyBtn")
                ?.addEventListener("click", () => abrirModalCopy());
            return;
        }

        mostrarEstado(copiesState, "");
        copiesCache.forEach((copy, index) => {
            copiesLista.appendChild(renderCopyCard(copy, index));
        });
    } catch (error) {
        console.error("Erro ao carregar copies:", error);
        copiesLista.innerHTML = "";
        mostrarEstado(
            copiesState,
            "Não foi possível carregar as copies. Tente novamente.",
            "is-error"
        );
    }
}

function mostrarViewCampanhas() {
    campanhaSelecionada = null;
    if (viewCampanhas) viewCampanhas.hidden = false;
    if (viewCopies) viewCopies.hidden = true;
    carregarCampanhasAtivas();
}

function mostrarViewCopies(campanha) {
    if (viewCampanhas) viewCampanhas.hidden = true;
    if (viewCopies) viewCopies.hidden = false;
    carregarCopiesCampanha(campanha);
}

function proximaOrdem() {
    if (!copiesCache.length) return 1;
    const max = Math.max(
        ...copiesCache.map((item) => Number(item.ordem) || 0)
    );
    return max + 1;
}

function abrirModalCopy(copy = null) {
    if (!copyModal || !campanhaSelecionada) return;

    copyForm?.reset();
    setFormStatus("");

    if (copy) {
        if (copyModalTitle) copyModalTitle.textContent = "Editar copy";
        if (copyIdInput) copyIdInput.value = String(copy.id || "");
        if (copyTituloInput) copyTituloInput.value = copy.titulo || "";
        if (copyTextoInput) copyTextoInput.value = copy.texto || "";
        if (copyCanalInput) copyCanalInput.value = copy.canal || "";
        if (copyTipoInput) copyTipoInput.value = copy.tipo || "";
        if (copyOrdemInput) copyOrdemInput.value = String(copy.ordem || 1);
    } else {
        if (copyModalTitle) copyModalTitle.textContent = "Adicionar copy";
        if (copyIdInput) copyIdInput.value = "";
        if (copyOrdemInput) copyOrdemInput.value = String(proximaOrdem());
    }

    copyModal.hidden = false;
}

function fecharModalCopy() {
    if (!copyModal) return;
    copyModal.hidden = true;
    copyForm?.reset();
    setFormStatus("");
}

function abrirVisualizarCopy(copy) {
    if (!copyViewModal || !copy) return;

    copyVisualizada = copy;

    if (copyViewTitle) {
        copyViewTitle.textContent = copy.titulo || "Copy";
    }

    if (copyViewMeta) {
        copyViewMeta.innerHTML = `
            <span>Canal: ${escaparHtml(copy.canal || "—")}</span>
            <span>Tipo: ${escaparHtml(copy.tipo || "—")}</span>
            <span>Ordem: ${escaparHtml(copy.ordem ?? "—")}</span>
        `;
    }

    if (copyViewTexto) {
        copyViewTexto.textContent = copy.texto || "";
    }

    copyViewModal.hidden = false;
}

function fecharVisualizarCopy() {
    if (!copyViewModal) return;
    copyViewModal.hidden = true;
    copyVisualizada = null;
}

async function copiarTexto(texto, botao) {
    const conteudo = String(texto || "");
    if (!conteudo) {
        window.alert("Esta copy não possui texto.");
        return;
    }

    const labelOriginal = botao?.innerHTML;

    try {
        await navigator.clipboard.writeText(conteudo);
        if (botao) {
            botao.innerHTML = `<i class="fa-solid fa-check"></i> Copiado`;
            setTimeout(() => {
                if (botao) botao.innerHTML = labelOriginal;
            }, 1500);
        }
    } catch (error) {
        console.error("Erro ao copiar texto:", error);
        window.alert("Não foi possível copiar o texto.");
    }
}

async function salvarCopy(event) {
    event.preventDefault();

    if (!campanhaSelecionada?.id) return;

    const titulo = copyTituloInput?.value.trim() || "";
    const texto = copyTextoInput?.value.trim() || "";
    const canal = copyCanalInput?.value.trim() || "";
    const tipo = copyTipoInput?.value.trim() || "";
    const ordem = Number(copyOrdemInput?.value || 1);
    const copyId = copyIdInput?.value.trim() || "";

    if (!titulo) {
        setFormStatus("Informe o título da copy.", "is-error");
        return;
    }

    if (!texto) {
        setFormStatus("Informe o texto da copy.", "is-error");
        return;
    }

    if (copySalvarBtn) copySalvarBtn.disabled = true;
    setFormStatus("");

    try {
        const headers = await getAuthHeaders({
            "Content-Type": "application/json"
        });

        const payload = { titulo, texto, canal, tipo, ordem };
        let resposta;

        if (copyId) {
            resposta = await fetch(`${API}/api/copies/${copyId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload)
            });
        } else {
            resposta = await fetch(`${API}/api/copies`, {
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
                dados.erro || dados.error || "Não foi possível salvar a copy."
            );
        }

        fecharModalCopy();
        await carregarCopiesCampanha(campanhaSelecionada);
    } catch (error) {
        console.error("Erro ao salvar copy:", error);
        setFormStatus(
            error.message || "Erro ao salvar copy.",
            "is-error"
        );
    } finally {
        if (copySalvarBtn) copySalvarBtn.disabled = false;
    }
}

async function excluirCopy(copy) {
    if (!copy?.id) return;

    const ok = window.confirm(
        `Excluir a copy "${copy.titulo || copy.id}"?`
    );
    if (!ok) return;

    try {
        const headers = await getAuthHeaders();
        const resposta = await fetch(`${API}/api/copies/${copy.id}`, {
            method: "DELETE",
            headers
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.error || "Não foi possível excluir."
            );
        }

        await carregarCopiesCampanha(campanhaSelecionada);
    } catch (error) {
        console.error("Erro ao excluir copy:", error);
        window.alert(error.message || "Erro ao excluir copy.");
    }
}

document.querySelector("#voltarDashboardBtn")?.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

document.querySelector("#voltarCampanhasBtn")?.addEventListener("click", () => {
    mostrarViewCampanhas();
});

adicionarCopyBtn?.addEventListener("click", () => abrirModalCopy());

campanhasGrid?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action='abrir-copies']");
    if (!btn) return;

    const card = btn.closest(".gm-campaign-card");
    const id = Number(card?.dataset.id);
    if (!id) return;

    const campanha = campanhasCache.find((item) => Number(item.id) === id);
    if (!campanha) {
        window.alert("Não foi possível abrir a campanha.");
        return;
    }

    mostrarViewCopies(campanha);
});

copiesLista?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;

    const card = btn.closest(".gc-copy-card");
    const id = Number(card?.dataset.id);
    const copy = copiesCache.find((item) => Number(item.id) === id);
    if (!copy) return;

    const action = btn.dataset.action;

    if (action === "visualizar") abrirVisualizarCopy(copy);
    if (action === "copiar") copiarTexto(copy.texto, btn);
    if (action === "editar") abrirModalCopy(copy);
    if (action === "excluir") excluirCopy(copy);
});

document.querySelector("#copyModalClose")?.addEventListener("click", fecharModalCopy);
document.querySelector("#copyCancelBtn")?.addEventListener("click", fecharModalCopy);
document.querySelector("#copyModalOverlay")?.addEventListener("click", fecharModalCopy);
copyForm?.addEventListener("submit", salvarCopy);

document.querySelector("#copyViewModalClose")?.addEventListener("click", fecharVisualizarCopy);
document.querySelector("#copyViewFecharBtn")?.addEventListener("click", fecharVisualizarCopy);
document.querySelector("#copyViewModalOverlay")?.addEventListener("click", fecharVisualizarCopy);
document.querySelector("#copyViewCopiarBtn")?.addEventListener("click", (event) => {
    copiarTexto(copyVisualizada?.texto, event.currentTarget);
});

async function iniciar() {
    const session = await requireAdminSession();
    if (!session) return;
    await carregarCampanhasAtivas();
}

iniciar();
