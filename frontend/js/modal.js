/* ==================================================
   MODAL — Materiais da campanha
   Estrutura pronta para integração com banco/API
================================================== */

const modal = document.getElementById("modalMateriais");
const openModalBtn = document.getElementById("openModal");
const modalLoading = document.getElementById("modalLoading");
const modalError = document.getElementById("modalError");
const modalErrorMessage = document.getElementById("modalErrorMessage");
const modalBody = document.getElementById("modalBody");
const modalRetry = document.getElementById("modalRetry");
let campanhaModalAtualId = null;
let materiaisModalCache = [];
let kitsModalCache = [];

/**
 * Resolve o ID da campanha do destaque ("O que divulgar hoje").
 * Prioridade: id informado → campanhaDestaqueAtual → obterCampanhaParaDestaque → campanhaExibida
 */
async function resolverCampanhaModalId(idOpcional) {
    const idDireto = Number(idOpcional);
    if (Number.isFinite(idDireto) && idDireto > 0) {
        return idDireto;
    }

    const idDestaque = Number(window.campanhaDestaqueAtual?.id);
    if (Number.isFinite(idDestaque) && idDestaque > 0) {
        return idDestaque;
    }

    if (typeof obterCampanhaParaDestaque === "function") {
        try {
            const campanha = await obterCampanhaParaDestaque();
            if (campanha?.id != null) {
                window.campanhaDestaqueAtual = campanha;
                return Number(campanha.id);
            }
        } catch (error) {
            console.error("Erro ao obter campanha do destaque:", error);
        }
    }

    if (
        typeof campanhaExibida !== "undefined"
        && campanhaExibida
        && campanhaExibida.id != null
    ) {
        return Number(campanhaExibida.id);
    }

    return null;
}

function formatarPeriodoCampanha(campanha) {
    const inicio = String(campanha?.data_inicio || "").slice(0, 10);
    const fim = String(campanha?.data_fim || "").slice(0, 10);

    const formatar = (valor) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor || "";
        const [, mes, dia] = valor.split("-");
        return `${dia}/${mes}`;
    };

    const ini = formatar(inicio);
    const end = formatar(fim);

    if (ini && end) return `${ini} — ${end}`;
    return ini || end || "";
}

async function fetchJsonLista(url) {
    try {
        const resposta = await fetch(url);
        if (!resposta.ok) return [];
        const dados = await resposta.json();
        return Array.isArray(dados) ? dados : [];
    } catch (error) {
        console.error(`Erro ao buscar ${url}:`, error);
        return [];
    }
}

/**
 * Busca campanha + materiais + copies + regras da campanha ativa do destaque.
 */
async function obterCampanha(id) {
    const campanhaId = await resolverCampanhaModalId(id);

    if (!campanhaId) {
        throw new Error("Nenhuma campanha disponível para o destaque.");
    }

    const resposta = await fetch(
        `http://localhost:3000/api/campanhas/${campanhaId}`
    );

    if (!resposta.ok) {
        throw new Error("Campanha não encontrada.");
    }

    const campanha = await resposta.json();

    const [materiais, copies, regras, angulos] = await Promise.all([
        fetchJsonLista(`http://localhost:3000/api/materiais/${campanhaId}`),
        fetchJsonLista(`http://localhost:3000/api/copies/${campanhaId}`),
        fetchJsonLista(`http://localhost:3000/api/regras/${campanhaId}`),
        fetchJsonLista(`http://localhost:3000/api/angulos/${campanhaId}`)
    ]);

    return {
        id: campanha.id,
        status: campanha.status || "",
        titulo: campanha.titulo || "",
        descricao: campanha.descricao || "",
        periodo: formatarPeriodoCampanha(campanha),
        subtitulo: "Materiais organizados por formato para acelerar sua divulgação.",
        banner: campanha.imagem_card || campanha.banner || "",
        abas: [
            { id: "visao-geral", label: "Visão geral" },
            { id: "materiais", label: "Materiais" },
            { id: "copies", label: "Copies" },
            { id: "regras", label: "Regras" }
        ],
        materiais,
        copies: copies
            .slice()
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
        regras: regras
            .slice()
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
        visaoGeral: {
            resumo:
                campanha.resumo
                || campanha.visao_geral
                || "",
            publicoRecomendado: campanha.publico_recomendado || "",
            objetivo: campanha.objetivo || "",
            mecanica: normalizarListaMecanica(campanha.mecanica),
            angulos: (Array.isArray(angulos) ? angulos : [])
                .slice()
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        }
    };
}

function setModalState({ loading = false, error = null, ready = false } = {}) {
    modalLoading.hidden = !loading;
    modalError.hidden = !error;
    modalBody.hidden = !ready;

    if (error) {
        modalErrorMessage.textContent = error;
    }
}

let modalAbaInicial = "materiais";

function abrirModal(campanhaId, opcoes = {}) {
    if (!modal) return;

    modalAbaInicial =
        opcoes.abaInicial
        || opcoes.aba
        || "materiais";

    modal.hidden = false;
    requestAnimationFrame(() => {
        modal.classList.add("is-open", "active");
    });
    document.body.style.overflow = "hidden";
    carregarCampanhaNoModal(campanhaId);
}

function fecharModal() {
    modal.classList.remove("is-open", "active");
    document.body.style.overflow = "";

    const onEnd = () => {
        modal.hidden = true;
        modal.removeEventListener("transitionend", onEnd);
    };

    modal.addEventListener("transitionend", onEnd);

    // Fallback caso a transição não dispare
    setTimeout(() => {
        if (!modal.classList.contains("is-open")) {
            modal.hidden = true;
        }
    }, 400);
}

async function carregarCampanhaNoModal(campanhaId) {
    setModalState({ loading: true });

    try {
        const campanha = await obterCampanha(
            campanhaId ?? campanhaModalAtualId
        );
        campanhaModalAtualId = campanha.id;
        popularCampanha(campanha);

        setModalState({ ready: true });
    } catch (err) {
        console.error(err);
        setModalState({
            error: err.message || "Não foi possível carregar os materiais."
        });
    }
}

function popularCampanha(campanha) {
    const banner = document.getElementById("campaignBanner");
    banner.src = campanha.banner || "";
    banner.alt = campanha.titulo || "Campanha";

    const statusEl = document.getElementById("campaignStatus");
    if (statusEl) {
        const status = String(campanha.status || "").trim();
        statusEl.textContent = status ? status.toUpperCase() : "";
        statusEl.hidden = !status;
    }

    document.getElementById("campaignTitle").textContent = campanha.titulo || "";

    const descricaoEl = document.getElementById("campaignDescription");
    if (descricaoEl) {
        const descricao = String(campanha.descricao || "").trim();
        descricaoEl.textContent = descricao;
        descricaoEl.hidden = !descricao;
    }

    const periodoEl = document.getElementById("campaignPeriod");
    if (periodoEl) {
        const periodo = String(campanha.periodo || "").trim();
        periodoEl.textContent = periodo;
        periodoEl.hidden = !periodo;
    }

    document.getElementById("campaignSubtitle").textContent =
        campanha.subtitulo
        || "Materiais organizados por formato para acelerar sua divulgação.";

    const downloadKit = document.getElementById("downloadKit");
    if (downloadKit) {
        const idNumerico = Number(campanha.id);

        // Só configura se for ID numérico válido (evita slug tipo "bullcar")
        if (Number.isFinite(idNumerico) && idNumerico > 0) {
            downloadKit.href =
                `http://localhost:3000/api/download/kit/${idNumerico}`;
            downloadKit.removeAttribute("aria-disabled");
            downloadKit.classList.remove("is-disabled");
        } else {
            downloadKit.href = "#";
            downloadKit.setAttribute("aria-disabled", "true");
            downloadKit.classList.add("is-disabled");
        }

        downloadKit.removeAttribute("target");
        downloadKit.removeAttribute("rel");
        downloadKit.setAttribute("download", `kit-${idNumerico || "campanha"}.zip`);
    }

    renderizarAbas(campanha.abas || []);
    renderizarVisaoGeral(campanha.visaoGeral);
    renderizarCopies(campanha.copies || []);
    renderizarRegras(campanha.regras || []);

    // Materiais + kit na mesma lista agrupada
    materiaisModalCache = Array.isArray(campanha.materiais) ? campanha.materiais.slice() : [];
    renderizarMateriais(materiaisModalCache);

    if (campanha.id != null) {
        carregarKit(campanha.id);
    }

    ativarAba(modalAbaInicial || "visao-geral");
    modalAbaInicial = "visao-geral";
}

function renderizarAbas(abas) {
    const container = document.getElementById("campaignTabs");
    container.innerHTML = "";

    abas.forEach((aba, index) => {
        const id = typeof aba === "string" ? slugify(aba) : aba.id;
        const label = typeof aba === "string" ? aba : aba.label;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.dataset.tab = id;
        button.classList.toggle("active", index === 0);
        button.addEventListener("click", () => ativarAba(id));
        container.appendChild(button);
    });
}

function ativarAba(abaId) {
    document.querySelectorAll(".modal__tabs button").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === abaId);
    });

    document.querySelectorAll(".modal__panel").forEach((panel) => {
        const ativo = panel.dataset.panel === abaId;
        panel.classList.toggle("is-active", ativo);
        panel.hidden = !ativo;
    });
}

const GRUPOS_MATERIAIS_MODAL = [
    { id: "stories", label: "Stories" },
    { id: "feed", label: "Feed" },
    { id: "videos", label: "Vídeos" },
    { id: "banners", label: "Banners" }
];

const FORMATOS_VALIDOS_MODAL = new Set([
    "stories",
    "feed",
    "videos",
    "banners"
]);

function ehVideoMaterial(material) {
    const tipo = String(material?.tipo || "").toLowerCase();
    const url = String(material?.url || material?.arquivo || "").toLowerCase();
    return (
        tipo === "video"
        || tipo.includes("video")
        || tipo.includes("vídeo")
        || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
    );
}

function normalizarFormatoModal(valor) {
    const bruto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (!bruto) return null;
    if (FORMATOS_VALIDOS_MODAL.has(bruto)) return bruto;
    if (bruto.includes("stor")) return "stories";
    if (bruto.includes("feed")) return "feed";
    if (bruto.includes("video")) return "videos";
    if (bruto.includes("banner")) return "banners";
    return null;
}

/**
 * Agrupa por `formato` (stories|feed|videos|banners).
 * Sem formato: tenta legado em tipo/nome (só se for categoria de postagem),
 * senão cai em "outros". Não usa tipo=imagem|video como categoria.
 */
function classificarGrupoMaterial(material) {
    const porFormato = normalizarFormatoModal(material?.formato);
    if (porFormato) return porFormato;

    const legado = String(
        material?.categoria
        || material?.tipo
        || material?.nome
        || material?.titulo
        || ""
    )
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (
        legado === "imagem"
        || legado === "image"
        || legado === "video"
        || legado === "arquivo"
    ) {
        return "outros";
    }

    const porLegado = normalizarFormatoModal(legado);
    if (porLegado) return porLegado;

    if (legado.includes("1080x1920")) return "stories";
    if (legado.includes("1080x1080")) return "feed";

    return "outros";
}

function agruparMateriaisModal(materiais = []) {
    const mapa = {
        stories: [],
        feed: [],
        videos: [],
        banners: [],
        outros: []
    };

    materiais.forEach((item) => {
        const grupo = classificarGrupoMaterial(item);
        (mapa[grupo] || mapa.outros).push(item);
    });

    const ordem = [...GRUPOS_MATERIAIS_MODAL, { id: "outros", label: "Outros" }];

    return ordem
        .map((grupo) => ({
            id: grupo.id,
            label: grupo.label,
            items: mapa[grupo.id] || []
        }))
        .filter((grupo) => grupo.items.length > 0);
}

function tituloMaterialModal(material) {
    const nome = String(material?.nome || material?.titulo || "Material").trim();
    const grupo = GRUPOS_MATERIAIS_MODAL.find(
        (item) => item.id === classificarGrupoMaterial(material)
    );

    if (!grupo) return nome;
    if (nome.toLowerCase().includes(grupo.label.toLowerCase().slice(0, 4))) {
        return nome;
    }

    return `${grupo.label.replace(/s$/i, "").replace("Vídeo", "Video")} — ${nome}`;
}

function metaMaterialModal(material) {
    return (
        material?.resolucao
        || material?.dimensoes
        || material?.tamanho
        || material?.tipo
        || ""
    );
}

function urlMaterialModal(material) {
    return resolverCaminhoKit(
        material?.preview
        || material?.arquivo
        || material?.url
        || material?.imagem
        || ""
    );
}

function renderizarMateriais(materiais) {
    const container = document.getElementById("materialsContainer");

    if (!container) {
        console.error("Elemento #materialsContainer não encontrado");
        return;
    }

    const lista = Array.isArray(materiais) ? materiais : [];
    const grupos = agruparMateriaisModal(lista);

    if (!grupos.length) {
        container.innerHTML = `
            <p class="modal__visao-geral__empty">
                Nenhum material disponível no momento.
            </p>
        `;
        return;
    }

    container.innerHTML = `
        <div class="modal__materials-list">
            ${grupos.map((grupo) => `
                <section class="modal__materials-group" data-grupo="${escapeHtml(grupo.id)}">
                    <p class="modal__materials-group__label">${escapeHtml(grupo.label)}</p>
                    <div class="modal__materials-group__items">
                        ${grupo.items.map((material, index) => {
                            const titulo = tituloMaterialModal(material);
                            const meta = metaMaterialModal(material);
                            const url = urlMaterialModal(material);
                            const thumb = url && !ehVideoMaterial(material)
                                ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(titulo)}" loading="lazy">`
                                : `<div class="modal__material-thumb-fallback" aria-hidden="true">
                                    <i class="fa-solid ${ehVideoMaterial(material) ? "fa-film" : "fa-image"}"></i>
                                   </div>`;

                            return `
                                <article
                                    class="modal__material-row"
                                    data-grupo="${escapeHtml(grupo.id)}"
                                    data-index="${index}"
                                >
                                    <div class="modal__material-thumb">
                                        ${thumb}
                                    </div>
                                    <div class="modal__material-info">
                                        <h3>${escapeHtml(titulo)}</h3>
                                        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
                                    </div>
                                    <div class="modal__material-actions">
                                        <button type="button" class="btn btn--outline" data-action="preview">
                                            <i class="fa-regular fa-eye"></i>
                                            Visualizar
                                        </button>
                                        <a href="${escapeHtml(url || "#")}" class="btn modal__material-download" download>
                                            <i class="fa-solid fa-download"></i>
                                            Baixar
                                        </a>
                                    </div>
                                </article>
                            `;
                        }).join("")}
                    </div>
                </section>
            `).join("")}
        </div>
    `;

    container.querySelectorAll(".modal__material-row").forEach((row) => {
        const grupoId = row.dataset.grupo;
        const index = Number(row.dataset.index);
        const grupo = grupos.find((item) => item.id === grupoId);
        const material = grupo?.items?.[index];
        if (!material) return;

        const url = urlMaterialModal(material);
        const titulo = tituloMaterialModal(material);

        row.querySelector('[data-action="preview"]')?.addEventListener("click", () => {
            if (ehVideoMaterial(material)) {
                if (typeof abrirVideoPreview === "function") {
                    abrirVideoPreview(url, titulo);
                } else {
                    window.open(url, "_blank", "noopener");
                }
                return;
            }

            if (typeof abrirImagePreview === "function") {
                abrirImagePreview(url, titulo);
            } else if (url) {
                window.open(url, "_blank", "noopener");
            }
        });

        row.querySelector(".modal__material-download")?.addEventListener("click", (event) => {
            forcarDownloadArquivo(event, url, titulo);
        });
    });
}

function normalizarKitComoMaterial(item) {
    return {
        id: item?.id ? `kit-${item.id}` : undefined,
        nome: item?.nome || item?.titulo || "Item do kit",
        titulo: item?.titulo || item?.nome || "Item do kit",
        tipo: item?.tipo || "arquivo",
        formato: item?.formato || null,
        url: item?.arquivo || item?.url || item?.imagem || "",
        arquivo: item?.arquivo || item?.url || item?.imagem || "",
        resolucao: item?.descricao || item?.resolucao || "",
        origem: "kit"
    };
}

function mesclarMateriaisEKits() {
    const mapa = new Map();

    [...materiaisModalCache, ...kitsModalCache].forEach((item) => {
        const url = String(item?.url || item?.arquivo || "").trim();
        const chave = url || `${item?.nome || item?.titulo || ""}-${item?.id || Math.random()}`;
        if (!mapa.has(chave)) {
            mapa.set(chave, item);
        }
    });

    renderizarMateriais(Array.from(mapa.values()));
}
function normalizarListaMecanica(valor) {
    if (Array.isArray(valor)) {
        return valor
            .map((item) => {
                if (typeof item === "string") return item.trim();
                if (item && typeof item === "object") {
                    return String(item.texto || item.titulo || "").trim();
                }
                return String(item || "").trim();
            })
            .filter(Boolean);
    }

    if (typeof valor === "string" && valor.trim()) {
        try {
            const parsed = JSON.parse(valor);
            if (Array.isArray(parsed)) {
                return normalizarListaMecanica(parsed);
            }
        } catch {
            // texto simples / multilinha
        }

        return valor
            .split(/\n+/)
            .map((item) => item.replace(/^\d+[\).\s-]*/, "").trim())
            .filter(Boolean);
    }

    return [];
}

function parseObjetivosModal(valor) {
    const opcoes = ["Retenção", "Redepósito", "Aquisição", "Volume"];
    const selecionados = String(valor || "")
        .split(/[,·|]/)
        .map((item) => item.trim())
        .filter(Boolean);

    const selecionadosLower = new Set(
        selecionados.map((item) => item.toLowerCase())
    );

    return opcoes.map((opcao) => ({
        label: opcao,
        ativo: selecionadosLower.has(opcao.toLowerCase())
    }));
}

function renderizarVisaoGeral(visaoGeral = {}) {
    const container = document.getElementById("visaoGeralContent");
    if (!container) return;

    const resumo = String(visaoGeral.resumo || visaoGeral.texto || "").trim();
    const publico = String(visaoGeral.publicoRecomendado || "").trim();
    const objetivos = parseObjetivosModal(visaoGeral.objetivo);
    const temObjetivoAtivo = objetivos.some((item) => item.ativo);
    const mecanica = Array.isArray(visaoGeral.mecanica) ? visaoGeral.mecanica : [];
    const angulos = Array.isArray(visaoGeral.angulos) ? visaoGeral.angulos : [];

    const blocoResumo = resumo
        ? `
            <section class="modal__visao-bloco">
                <p class="modal__visao-geral__label">Resumo</p>
                <p class="modal__visao-geral__texto">${escapeHtml(resumo)}</p>
            </section>
        `
        : "";

    const blocoPublico = publico
        ? `
            <section class="modal__visao-bloco">
                <p class="modal__visao-geral__label">Público recomendado</p>
                <p class="modal__visao-publico">${escapeHtml(publico)}</p>
            </section>
        `
        : "";

    const blocoObjetivo = `
        <section class="modal__visao-bloco">
            <p class="modal__visao-geral__label">Objetivo</p>
            ${
                temObjetivoAtivo
                    ? `<div class="modal__objetivo-chips">
                        ${objetivos.map((item) => `
                            <span class="modal__objetivo-chip${item.ativo ? " is-active" : ""}">
                                ${escapeHtml(item.label)}
                            </span>
                        `).join("")}
                    </div>`
                    : `<p class="modal__visao-geral__empty">Nenhum objetivo cadastrado.</p>`
            }
        </section>
    `;

    const blocoMecanica = `
        <section class="modal__visao-bloco">
            <p class="modal__visao-geral__label">Mecânica</p>
            ${
                mecanica.length
                    ? `<ol class="modal__mecanica-list">
                        ${mecanica.map((passo) => `
                            <li class="modal__mecanica-item">
                                <span class="modal__mecanica-index" aria-hidden="true"></span>
                                <p>${escapeHtml(passo)}</p>
                            </li>
                        `).join("")}
                    </ol>`
                    : `<p class="modal__visao-geral__empty">A mecânica ainda não foi cadastrada.</p>`
            }
        </section>
    `;

    const blocoAngulos = `
        <section class="modal__visao-bloco">
            <p class="modal__visao-geral__label">Ângulos de divulgação</p>
            ${
                angulos.length
                    ? `<div class="modal__angulos-list">
                        ${angulos.map((angulo) => `
                            <article class="modal__angulo-card">
                                <h4>${escapeHtml(angulo.titulo || "Ângulo")}</h4>
                                <p>${escapeHtml(angulo.descricao || "")}</p>
                            </article>
                        `).join("")}
                    </div>`
                    : `<p class="modal__visao-geral__empty">Nenhum ângulo cadastrado.</p>`
            }
        </section>
    `;

    if (!resumo && !publico && !temObjetivoAtivo && !mecanica.length && !angulos.length) {
        container.innerHTML = `
            <div class="modal__visao-geral">
                <p class="modal__visao-geral__empty">
                    As informações de visão geral ainda não foram cadastradas.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="modal__visao-geral">
            ${blocoResumo}
            ${blocoPublico}
            ${blocoObjetivo}
            ${blocoMecanica}
            ${blocoAngulos}
        </div>
    `;
}

function agruparCopiesPorCanal(copies = []) {
    const grupos = new Map();

    copies.forEach((copy) => {
        const canal = String(copy.canal || copy.tipo || "Geral").trim() || "Geral";
        const chave = canal.toUpperCase();

        if (!grupos.has(chave)) {
            grupos.set(chave, {
                label: chave,
                items: []
            });
        }

        grupos.get(chave).items.push(copy);
    });

    return Array.from(grupos.values());
}

function tituloCopyCard(copy) {
    const titulo = String(copy.titulo || "").trim();
    if (titulo) return titulo;

    const canal = String(copy.canal || "").trim();
    const tipo = String(copy.tipo || "").trim();

    if (canal && tipo) return `${canal} — ${tipo}`;
    return canal || tipo || "Copy";
}

function renderizarCopies(copies) {
    const container = document.getElementById("copiesContent");
    if (!container) return;

    const lista = Array.isArray(copies) ? copies : [];

    if (!lista.length) {
        container.innerHTML = `
            <div class="modal__copies">
                <p class="modal__visao-geral__empty">Nenhuma copy disponível no momento.</p>
            </div>
        `;
        return;
    }

    const grupos = agruparCopiesPorCanal(lista);

    container.innerHTML = `
        <div class="modal__copies">
            ${grupos.map((grupo) => `
                <section class="modal__copies-group">
                    <p class="modal__copies-group__label">${escapeHtml(grupo.label)}</p>
                    <div class="modal__copies-group__list">
                        ${grupo.items.map((copy, index) => `
                            <article class="modal__copy-card" data-copy-group="${escapeHtml(grupo.label)}" data-copy-index="${index}">
                                <div class="modal__copy-card__top">
                                    <h3>${escapeHtml(tituloCopyCard(copy))}</h3>
                                    <button type="button" class="modal__copy-btn" data-action="copy">
                                        <i class="fa-regular fa-copy"></i>
                                        Copiar
                                    </button>
                                </div>
                                <p class="modal__copy-card__text">${escapeHtml(copy.texto || "")}</p>
                            </article>
                        `).join("")}
                    </div>
                </section>
            `).join("")}
        </div>
    `;

    container.querySelectorAll(".modal__copy-card").forEach((card) => {
        const btn = card.querySelector('[data-action="copy"]');
        const texto = card.querySelector(".modal__copy-card__text")?.textContent || "";

        if (!btn) return;

        btn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(texto);
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
                btn.classList.add("is-copied");
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.classList.remove("is-copied");
                }, 1600);
            } catch {
                alert("Não foi possível copiar o texto.");
            }
        });
    });
}

function renderizarRegras(regras) {
    // Modal unificado (home / campanhas ativas)
    const container = document.getElementById("regrasContent");

    if (!container) {
        console.warn("Container #regrasContent não encontrado");
        return;
    }

    const lista = Array.isArray(regras) ? regras : [];

    if (!lista.length) {
        container.innerHTML = `
            <div class="modal__regras">
                <p class="modal__visao-geral__empty">Nenhuma regra cadastrada.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="modal__regras">
            <p class="modal__visao-geral__label">Regras</p>
            <ol class="modal__regras-list">
                ${lista.map((regra) => {
                    if (typeof regra === "string") {
                        return `
                            <li class="modal__regra-item">
                                <span class="modal__regra-index" aria-hidden="true"></span>
                                <div>
                                    <p>${escapeHtml(regra)}</p>
                                </div>
                            </li>
                        `;
                    }

                    return `
                        <li class="modal__regra-item">
                            <span class="modal__regra-index" aria-hidden="true"></span>
                            <div>
                                <strong>${escapeHtml(regra.titulo || "Regra")}</strong>
                                ${
                                    regra.descricao
                                        ? `<p>${escapeHtml(regra.descricao)}</p>`
                                        : ""
                                }
                            </div>
                        </li>
                    `;
                }).join("")}
            </ol>
        </div>
    `;
}

function slugify(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* ==========================
   Eventos do modal
========================== */

if (openModalBtn) {
    openModalBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const idDestaque =
            openModalBtn.dataset.campanhaId
            || window.campanhaDestaqueAtual?.id
            || null;
        abrirModal(idDestaque, { abaInicial: "materiais" });
    });
}

const openEntenderCampanhaBtn =
    document.getElementById("openEntenderCampanha");

if (openEntenderCampanhaBtn) {
    openEntenderCampanhaBtn.addEventListener("click", (event) => {
        event.preventDefault();

        const idDestaque =
            openEntenderCampanhaBtn.dataset.campanhaId
            || openModalBtn?.dataset.campanhaId
            || window.campanhaDestaqueAtual?.id
            || null;

        abrirModal(idDestaque, { abaInicial: "visao-geral" });
    });
}

if (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach((el) => {
        el.addEventListener("click", fecharModal);
    });
}

if (modalRetry) {
    modalRetry.addEventListener("click", carregarCampanhaNoModal);
}


document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("is-open")) {

        // Se o preview de imagem estiver aberto, fecha só ele
        if(
            imagePreviewModal
            && !imagePreviewModal.hidden
            && imagePreviewModal.classList.contains("is-open")
        ){
            fecharImagePreview();
            return;
        }

        fecharModal();
    }
});


/* ==================================================
MODAL — Kit completo da campanha
================================================== */


const kitModal = document.getElementById("kitModal");
const openKitModalBtn = document.getElementById("openKitModal");
const closeKitModalBtn = document.getElementById("closeKitModal");


function abrirKitModal(){

    // Usa o modal de materiais existente quando #kitModal não existe
    if(!kitModal){
        abrirModal();
        return;
    }


    kitModal.hidden = false;


    requestAnimationFrame(()=>{

        kitModal.classList.add("is-open", "active");

    });


    document.body.style.overflow = "hidden";

}



function fecharKitModal(){

    if(!kitModal){
        fecharModal();
        return;
    }


    kitModal.classList.remove("is-open", "active");


    document.body.style.overflow = "";


    setTimeout(()=>{

        kitModal.hidden = true;

    },300);

}




if(openKitModalBtn){

    openKitModalBtn.addEventListener("click", async (event)=>{

        event.preventDefault();

        // Sempre usa a campanha ativa em "O que divulgar hoje"
        const idDestaque =
            openKitModalBtn.dataset.campanhaId
            || window.campanhaDestaqueAtual?.id
            || null;

        abrirModal(idDestaque);

    });

}



if(closeKitModalBtn){

    closeKitModalBtn.addEventListener("click",()=>{

        fecharKitModal();

    });

}



if(kitModal){

    kitModal.addEventListener("click",(event)=>{


        if(event.target === kitModal){

            fecharKitModal();

        }


    });

}

async function carregarKit(campanhaId){

    try{

        const response = await fetch(
            `http://localhost:3000/api/kits/${campanhaId}`
        );

        if(!response.ok){
            throw new Error(`HTTP ${response.status}`);
        }

        const dados = await response.json();
        const lista = Array.isArray(dados)
            ? dados
            : (dados?.kits ?? []);

        kitsModalCache = lista.map(normalizarKitComoMaterial);
        mesclarMateriaisEKits();

    }catch(error){

        console.error("Erro ao carregar kit:", error);
        kitsModalCache = [];
        mesclarMateriaisEKits();

    }

}


function resolverCaminhoKit(caminho){

    if(!caminho) return "";

    if(/^https?:\/\//i.test(caminho)){
        return caminho;
    }

    // Remove barra inicial para caminho relativo a partir do frontend/
    const limpo = String(caminho).replace(/^\/+/, "");

    // Ajuste: arquivos estão em /downloads, não em /images
    if(limpo.startsWith("images/")){
        return "downloads/" + limpo.slice("images/".length);
    }

    return limpo;

}


function nomeArquivoDeUrl(caminho, fallback = "material"){

    try{
        const limpo = String(caminho).split("?")[0];
        const nome = limpo.substring(limpo.lastIndexOf("/") + 1);
        return nome || fallback;
    }catch{
        return fallback;
    }

}


async function forcarDownloadArquivo(event, url, nomeBase){

    if(!url || url === "#"){
        event.preventDefault();
        return;
    }

    // Força download do arquivo local em vez de só abrir em nova aba
    event.preventDefault();

    try{

        const resposta = await fetch(url);

        if(!resposta.ok){
            throw new Error(`HTTP ${resposta.status}`);
        }

        const blob = await resposta.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = nomeArquivoDeUrl(url, nomeBase);
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);

    }catch(error){

        console.error("Erro ao baixar arquivo:", error);

        // Fallback: navega para o arquivo
        window.location.href = url;

    }

}


function renderizarKit(itens){
    const lista = Array.isArray(itens)
        ? itens
        : (itens?.kits ?? []);

    kitsModalCache = lista.map(normalizarKitComoMaterial);
    mesclarMateriaisEKits();
}

const imagePreviewModal = document.getElementById("imagePreviewModal");
const imagePreview = document.getElementById("imagePreview");
const closeImagePreviewBtn = document.getElementById("closeImagePreview");

function abrirImagePreview(src, alt = "Visualização do material"){

    if(!imagePreviewModal || !imagePreview || !src) return;

    imagePreview.src = src;
    imagePreview.alt = alt || "Visualização do material";

    imagePreviewModal.hidden = false;

    requestAnimationFrame(() => {
        imagePreviewModal.classList.add("is-open", "active");
    });

}


function fecharImagePreview(){

    if(!imagePreviewModal) return;

    imagePreviewModal.classList.remove("is-open", "active");

    setTimeout(() => {
        imagePreviewModal.hidden = true;
        if(imagePreview){
            imagePreview.src = "";
        }
    }, 250);

}


if(closeImagePreviewBtn){
    closeImagePreviewBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        fecharImagePreview();
    });
}


if(imagePreviewModal){

    imagePreviewModal.addEventListener("click", (event) => {

        if(
            event.target === imagePreviewModal
            || event.target.closest("[data-image-preview-close]")
        ){
            fecharImagePreview();
        }

    });

}


// Clique na imagem do kit/material abre o preview
if(modal){

    modal.addEventListener("click", (event) => {

        const img = event.target.closest(
            "#materialsContainer img, .modal__material-thumb img, .kit-card img, .material-card img"
        );

        if(!img) return;
        if(img.id === "campaignBanner") return;

        event.preventDefault();

        abrirImagePreview(
            img.currentSrc || img.src,
            img.alt || "Visualização do material"
        );

    });

}
