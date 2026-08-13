const API = "http://localhost:3000";

// ======================================================
// PEGAR ID DA URL
// ======================================================

const params = new URLSearchParams(
    window.location.search
);

const campanhaId = params.get("id");
const veioDaBusca = params.get("from") === "search";

if (veioDaBusca) {
    document.body.classList.add("from-search");
}

console.log(
    "Campanha ID:",
    campanhaId
);


// ======================================================
// ELEMENTOS
// ======================================================

const detailImage =
    document.querySelector("#detail-image");

const detailCategory =
    document.querySelector("#detail-category");

const detailTitle =
    document.querySelector("#detail-title");

const detailDescription =
    document.querySelector("#detail-description");

const detailObjective =
    document.querySelector("#detail-objective");

const detailPrize =
    document.querySelector("#detail-prize");

const detailCoupon =
    document.querySelector("#detail-coupon");

const detailMinimum =
    document.querySelector("#detail-minimum");

const detailStart =
    document.querySelector("#detail-start");

const detailEnd =
    document.querySelector("#detail-end");

const detailStatus =
    document.querySelector("#detail-status");

const voltarBtn =
    document.querySelector("#voltarBtn");


// ======================================================
// VOLTAR
// ======================================================

if (voltarBtn) {

    voltarBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "campanhas.html";

        }
    );

}


// ======================================================
// VALIDAR ID
// ======================================================

if (!campanhaId) {

    console.error(
        "ID da campanha não informado."
    );

    alert(
        "ID da campanha não informado."
    );

    window.location.href =
        "campanhas.html";

}


// ======================================================
// FORMATAR DATA
// ======================================================

function formatarData(data) {

    if (!data) {
        return "-";
    }

    try {

        const dataLimpa =
            String(data).split("T")[0];

        const partes =
            dataLimpa.split("-");

        if (partes.length === 3) {

            const [ano, mes, dia] =
                partes;

            return `${dia}/${mes}/${ano}`;

        }

        return data;

    } catch (error) {

        console.error(
            "Erro ao formatar data:",
            error
        );

        return data;

    }

}


// ======================================================
// FORMATAR VALOR
// ======================================================

function formatarMoeda(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "-";
    }

    const numero =
        Number(valor);

    if (Number.isNaN(numero)) {
        return valor;
    }

    return numero.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ======================================================
// CARREGAR CAMPANHA
// ======================================================

async function carregarCampanha() {

    try {

        console.log(
            "Carregando campanha:",
            campanhaId
        );


        const resposta =
            await fetch(
                `${API}/api/campanhas/${campanhaId}`
            );


        const campanha =
            await resposta.json();


        console.log(
            "Resposta da campanha:",
            campanha
        );


        if (!resposta.ok) {

            throw new Error(
                campanha.erro ||
                campanha.error ||
                "Erro ao carregar campanha."
            );

        }


        // ==================================================
        // TÍTULO
        // ==================================================

        if (detailTitle) {

            detailTitle.textContent =
                campanha.titulo || "-";

        }


        // ==================================================
        // CATEGORIA
        // ==================================================

        if (detailCategory) {

            detailCategory.textContent =
                campanha.categoria || "-";

        }


        // ==================================================
        // DESCRIÇÃO
        // ==================================================

        if (detailDescription) {

            detailDescription.textContent =
                campanha.descricao || "-";

        }


        // ==================================================
        // OBJETIVO
        // ==================================================

        if (detailObjective) {

            detailObjective.textContent =
                campanha.objetivo || "-";

        }


        // ==================================================
        // PRÊMIO
        // ==================================================

        if (detailPrize) {

            detailPrize.textContent =
                campanha.premio || "-";

        }


        // ==================================================
        // CUPOM
        // ==================================================

        if (detailCoupon) {

            detailCoupon.textContent =
                campanha.cupom || "-";

        }


        // ==================================================
        // DEPÓSITO MÍNIMO
        // ==================================================

        if (detailMinimum) {

            detailMinimum.textContent =
                formatarMoeda(
                    campanha.deposito_minimo
                );

        }


        // ==================================================
        // DATA DE INÍCIO
        // ==================================================

        if (detailStart) {

            detailStart.textContent =
                formatarData(
                    campanha.data_inicio
                );

        }


        // ==================================================
        // DATA DE ENCERRAMENTO
        // ==================================================

        if (detailEnd) {

            detailEnd.textContent =
                formatarData(
                    campanha.data_fim
                );

        }


        // ==================================================
        // STATUS
        // ==================================================

        if (detailStatus) {

            detailStatus.textContent =
                campanha.status || "-";

        }


        // ==================================================
        // PRONTIDÃO PARA PUBLICAÇÃO
        // ==================================================

        renderProntidaoPublicacao(campanha);


        // ==================================================
        // IMAGEM
        // ==================================================

        if (detailImage) {

            const imagem =
                campanha.imagem_card ||
                campanha.banner;


            if (imagem) {

                detailImage.src =
                    imagem;

                detailImage.alt =
                    campanha.titulo ||
                    "Imagem da campanha";

                detailImage.style.display =
                    "block";


                detailImage.onerror =
                    () => {

                        console.error(
                            "Erro ao carregar imagem:",
                            imagem
                        );

                        detailImage.style.display =
                            "none";

                    };

            } else {

                detailImage.style.display =
                    "none";

            }

        }


    } catch (error) {

        console.error(
            "Erro ao carregar detalhes:",
            error
        );


        alert(
            error.message ||
            "Não foi possível carregar a campanha."
        );


        window.location.href =
            "campanhas.html";

    }

}


// ======================================================
// INDICADOR DE PRONTIDÃO PARA PUBLICAÇÃO
// Fonte de verdade: campanha.pronta_publicacao (backend)
// ======================================================

const PRONTIDAO_ITENS = [
    { id: "informacoes", label: "Informações" },
    { id: "visao_geral", label: "Visão geral" },
    { id: "copies", label: "Copies" },
    { id: "regras", label: "Regras" },
    { id: "materiais", label: "Materiais" },
    { id: "angulos", label: "Ângulos" }
];

function escaparHtmlProntidao(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Normaliza o flag vindo da API.
 * true / false → boolean
 * ausente / null / undefined → null (status indisponível)
 */
function normalizarProntaPublicacao(valor) {
    if (valor === true || valor === false) {
        return valor;
    }

    if (valor === "true" || valor === 1 || valor === "1") {
        return true;
    }

    if (valor === "false" || valor === 0 || valor === "0") {
        return false;
    }

    return null;
}

/**
 * Pendências individuais só se a API já enviar.
 * Não inventa validação no frontend.
 */
function extrairPendenciasProntidao(campanha) {
    const origem =
        campanha?.pendencias_publicacao
        || campanha?.pendencias
        || campanha?.validacao?.pendencias
        || null;

    if (!Array.isArray(origem)) {
        return [];
    }

    return origem
        .map((item) => String(item || "").trim())
        .filter(Boolean);
}

function renderProntidaoPublicacao(campanha) {
    const root = document.querySelector("#campanhaProntidao");
    const titleEl = document.querySelector("#prontidaoTitle");
    const badgeEl = document.querySelector("#prontidaoBadge");
    const messageEl = document.querySelector("#prontidaoMessage");
    const checklistEl = document.querySelector("#prontidaoChecklist");
    const pendenciasBox = document.querySelector("#prontidaoPendencias");
    const pendenciasText = document.querySelector("#prontidaoPendenciasText");
    const pendenciasList = document.querySelector("#prontidaoPendenciasList");

    if (!root || !titleEl || !badgeEl) {
        return;
    }

    const pronta = normalizarProntaPublicacao(
        campanha?.pronta_publicacao
    );

    root.classList.remove(
        "campanha-prontidao--pronta",
        "campanha-prontidao--pendente",
        "campanha-prontidao--indisponivel"
    );

    if (pronta === true) {
        root.classList.add("campanha-prontidao--pronta");
        titleEl.textContent = "PRONTA PARA PUBLICAÇÃO";
        badgeEl.textContent = "PRONTA";

        if (messageEl) {
            messageEl.hidden = true;
            messageEl.textContent = "";
        }

        if (checklistEl) {
            checklistEl.hidden = false;
            checklistEl.innerHTML = PRONTIDAO_ITENS.map((item) => `
                <div class="prontidao-item prontidao-item--ok" data-item="${escaparHtmlProntidao(item.id)}">
                    <span class="prontidao-item__icon" aria-hidden="true">
                        <i class="fa-solid fa-check"></i>
                    </span>
                    <span class="prontidao-item__label">${escaparHtmlProntidao(item.label)}</span>
                </div>
            `).join("");
        }

        if (pendenciasBox) pendenciasBox.hidden = true;
        if (pendenciasList) {
            pendenciasList.hidden = true;
            pendenciasList.innerHTML = "";
        }
        return;
    }

    if (pronta === false) {
        root.classList.add("campanha-prontidao--pendente");
        titleEl.textContent = "CAMPANHA INCOMPLETA";
        badgeEl.textContent = "PENDENTE";

        if (messageEl) {
            messageEl.hidden = false;
            messageEl.textContent =
                "Existem itens que precisam ser preenchidos antes da publicação.";
        }

        // Sem estados individuais da API: checklist preparado, estado geral "a revisar"
        if (checklistEl) {
            checklistEl.hidden = false;
            checklistEl.innerHTML = PRONTIDAO_ITENS.map((item) => `
                <div class="prontidao-item prontidao-item--pending" data-item="${escaparHtmlProntidao(item.id)}">
                    <span class="prontidao-item__icon" aria-hidden="true">
                        <i class="fa-solid fa-exclamation"></i>
                    </span>
                    <span class="prontidao-item__label">${escaparHtmlProntidao(item.label)}</span>
                </div>
            `).join("");
        }

        const pendencias = extrairPendenciasProntidao(campanha);

        if (pendenciasBox) {
            pendenciasBox.hidden = false;

            if (pendencias.length > 0) {
                if (pendenciasText) {
                    pendenciasText.textContent = "Itens reportados pela API:";
                }
                if (pendenciasList) {
                    pendenciasList.hidden = false;
                    pendenciasList.innerHTML = pendencias.map((p) =>
                        `<li>${escaparHtmlProntidao(p)}</li>`
                    ).join("");
                }
            } else {
                if (pendenciasText) {
                    pendenciasText.textContent =
                        "A campanha possui informações pendentes. Revise os módulos da campanha antes de publicar.";
                }
                if (pendenciasList) {
                    pendenciasList.hidden = true;
                    pendenciasList.innerHTML = "";
                }
            }
        }
        return;
    }

    // Campo ausente / campanhas antigas
    root.classList.add("campanha-prontidao--indisponivel");
    titleEl.textContent = "Status indisponível";
    badgeEl.textContent = "—";

    if (messageEl) {
        messageEl.hidden = false;
        messageEl.textContent =
            "O status de publicação ainda não está disponível para esta campanha.";
    }

    if (checklistEl) {
        checklistEl.hidden = true;
        checklistEl.innerHTML = "";
    }

    if (pendenciasBox) pendenciasBox.hidden = true;
}


// ======================================================
// CARREGAR REGRAS DA CAMPANHA
// ======================================================

async function carregarRegras() {

    const rulesContainer =
        document.querySelector("#rulesContainer");

    if (!rulesContainer) {

        console.error(
            "Container #rulesContainer não encontrado."
        );

        return;
    }


    try {

        console.log(
            "Carregando regras da campanha:",
            campanhaId
        );


        rulesContainer.innerHTML = `
            <p class="loading-rules">
                Carregando regras...
            </p>
        `;


        const resposta =
            await fetch(
                `${API}/api/regras/${campanhaId}`
            );


        const regras =
            await resposta.json();


        console.log(
            "Regras recebidas:",
            regras
        );


        if (!resposta.ok) {

            throw new Error(
                regras.erro ||
                regras.error ||
                "Erro ao carregar regras."
            );

        }


        if (
            !Array.isArray(regras) ||
            regras.length === 0
        ) {

            rulesContainer.innerHTML = `
                <p class="empty-rules">
                    Nenhuma regra cadastrada para esta campanha.
                </p>
            `;

            return;
        }


        // ==========================================
        // ORDENAR REGRAS
        // ==========================================

        regras.sort(
            (a, b) =>
                (a.ordem ?? 0) -
                (b.ordem ?? 0)
        );


        rulesContainer.innerHTML = "";


        // ==========================================
        // CRIAR REGRAS
        // ==========================================

        regras.forEach((regra) => {

            const regraElement =
                document.createElement("div");


            regraElement.classList.add(
                "rule-item"
            );


            regraElement.innerHTML = `

                <div class="rule-number">
                    ${regra.ordem}
                </div>


                <div class="rule-content">

                    <h3>
                        ${regra.titulo || "-"}
                    </h3>

                    <p>
                        ${regra.descricao || "-"}
                    </p>

                </div>

            `;


            rulesContainer.appendChild(
                regraElement
            );

        });

    } catch (error) {

        console.error(
            "Erro ao carregar regras:",
            error
        );


        rulesContainer.innerHTML = `
            <p class="error-rules">
                Não foi possível carregar as regras.
            </p>
        `;

    }

}


async function carregarMateriais() {

    const materialsContainer =
        document.querySelector("#materialsContainer");

    if (!materialsContainer) {

        console.error(
            "Container #materialsContainer não encontrado."
        );

        return;
    }


    try {

        console.log(
            "Carregando materiais da campanha:",
            campanhaId
        );


        materialsContainer.innerHTML = `
            <p class="loading-materials">
                Carregando materiais...
            </p>
        `;


        const resposta =
            await fetch(
                `${API}/api/materiais/${campanhaId}`
            );


        const materiais =
            await resposta.json();


        console.log(
            "Materiais recebidos:",
            materiais
        );


        if (!resposta.ok) {

            throw new Error(
                materiais.erro ||
                materiais.error ||
                "Erro ao carregar materiais."
            );

        }


        if (
            !Array.isArray(materiais) ||
            materiais.length === 0
        ) {

            materialsContainer.innerHTML = `
                <p class="empty-materials">
                    Nenhum material cadastrado para esta campanha.
                </p>
            `;

            return;
        }


        materialsContainer.innerHTML = "";


        materiais.forEach((material) => {

            const materialCard =
                document.createElement("div");


            materialCard.classList.add(
                "material-card"
            );


            const nome =
                material.nome || "Material";


            const tipo =
                material.tipo || "Material";


            const url =
                material.url || "";


            materialCard.innerHTML = `

                <div class="material-preview">

                    ${
                        url
                            ? `
                                <img
                                    src="${url}"
                                    alt="${nome}"
                                    class="material-image"
                                >
                            `
                            : `
                                <div class="material-no-image">
                                    Sem imagem
                                </div>
                            `
                    }

                </div>


                <div class="material-content">

                    <h3>
                        ${nome}
                    </h3>


                    <span class="material-type">
                        ${tipo}
                    </span>


                    ${
                        url
                            ? `
                                <a
                                    href="${url}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="btn-material"
                                >
                                    Abrir material
                                </a>
                            `
                            : ""
                    }

                </div>

            `;


            materialsContainer.appendChild(
                materialCard
            );

        });


    } catch (error) {

        console.error(
            "Erro ao carregar materiais:",
            error
        );


        materialsContainer.innerHTML = `
            <p class="error-materials">
                Não foi possível carregar os materiais.
            </p>
        `;

    }

}


// ======================================================
// CARREGAR ANGULOS
// ======================================================
async function carregarAngulos() {

    const anglesContainer =
        document.querySelector("#anglesContainer");

    if (!anglesContainer) {
        console.error(
            "Container #anglesContainer não encontrado."
        );
        return;
    }

    try {

        anglesContainer.innerHTML = `
            <p class="loading-angles">
                Carregando ângulos...
            </p>
        `;

        const resposta = await fetch(
            `${API}/api/angulos/${campanhaId}`
        );

        const angulos = await resposta.json();

        console.log(
            "Ângulos recebidos:",
            angulos
        );

        if (!resposta.ok) {

            throw new Error(
                angulos.erro ||
                angulos.error ||
                "Erro ao carregar ângulos."
            );

        }

        if (
            !Array.isArray(angulos) ||
            angulos.length === 0
        ) {

            anglesContainer.innerHTML = `
                <p class="empty-angles">
                    Nenhum ângulo de divulgação cadastrado.
                </p>
            `;

            return;
        }

        // Ordenar pela ordem cadastrada
        angulos.sort(
            (a, b) =>
                (a.ordem ?? 0) -
                (b.ordem ?? 0)
        );

        anglesContainer.innerHTML = "";

        angulos.forEach((angulo) => {

            const card =
                document.createElement("article");

            card.classList.add(
                "angle-card"
            );

            card.innerHTML = `

                <div class="angle-card__number">
                    ${angulo.ordem ?? "-"}
                </div>

                <div class="angle-card__content">

                    <h3>
                        ${angulo.titulo || "Sem título"}
                    </h3>

                    <p>
                        ${angulo.descricao || "Sem descrição"}
                    </p>

                </div>

            `;

            anglesContainer.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Erro ao carregar ângulos:",
            error
        );

        anglesContainer.innerHTML = `
            <p class="error-angles">
                Não foi possível carregar os ângulos de divulgação.
            </p>
        `;

    }
}


function escaparHtmlDetalhe(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}


async function carregarCopies() {
    const copiesContainer =
        document.querySelector("#copiesContainer");

    if (!copiesContainer) return;

    try {
        copiesContainer.innerHTML = `
            <p class="detail-empty">Carregando copies...</p>
        `;

        const resposta = await fetch(
            `${API}/api/copies/${campanhaId}`
        );
        const copies = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                copies.erro || copies.error || "Erro ao carregar copies."
            );
        }

        if (!Array.isArray(copies) || copies.length === 0) {
            copiesContainer.innerHTML = `
                <p class="detail-empty">
                    Nenhuma copy cadastrada para esta campanha.
                </p>
            `;
            return;
        }

        copies.sort(
            (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
        );

        copiesContainer.innerHTML = "";

        copies.forEach((copy) => {
            const card = document.createElement("article");
            card.className = "copy-card";
            card.innerHTML = `
                <div class="copy-card__body">
                    <h3>${escaparHtmlDetalhe(copy.titulo || "Copy")}</h3>
                    <p>${escaparHtmlDetalhe(copy.texto || "")}</p>
                    <div class="copy-card__meta">
                        <span>Canal: ${escaparHtmlDetalhe(copy.canal || "—")}</span>
                        <span>Tipo: ${escaparHtmlDetalhe(copy.tipo || "—")}</span>
                        <span>Ordem: ${escaparHtmlDetalhe(copy.ordem ?? "—")}</span>
                    </div>
                </div>
            `;
            copiesContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar copies:", error);
        copiesContainer.innerHTML = `
            <p class="detail-empty error-materials">
                Não foi possível carregar as copies.
            </p>
        `;
    }
}


async function carregarKit() {
    const kitContainer =
        document.querySelector("#kitContainer");
    const btnDownloadKit =
        document.querySelector("#btnDownloadKit");

    if (btnDownloadKit) {
        btnDownloadKit.href =
            `${API}/api/download/kit/${campanhaId}`;
    }

    if (!kitContainer) return;

    try {
        kitContainer.innerHTML = `
            <p class="detail-empty">Carregando kit...</p>
        `;

        const resposta = await fetch(
            `${API}/api/kits/${campanhaId}`
        );
        const kits = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                kits.error || kits.erro || "Erro ao carregar kit."
            );
        }

        if (!Array.isArray(kits) || kits.length === 0) {
            kitContainer.innerHTML = `
                <p class="detail-empty">
                    Nenhum item de kit cadastrado. Você ainda pode baixar o pacote completo.
                </p>
            `;
            return;
        }

        kitContainer.innerHTML = "";

        kits.forEach((item) => {
            const card = document.createElement("article");
            card.className = "kit-item";
            const nome =
                item.nome || item.titulo || item.arquivo || "Arquivo do kit";
            card.innerHTML = `
                <div class="kit-item__icon">
                    <i class="fa-solid fa-file-zipper"></i>
                </div>
                <div class="kit-item__body">
                    <h3>${escaparHtmlDetalhe(nome)}</h3>
                    <p>${escaparHtmlDetalhe(item.tipo || item.descricao || "Item do kit")}</p>
                </div>
            `;
            kitContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar kit:", error);
        kitContainer.innerHTML = `
            <p class="detail-empty">
                Não foi possível listar o kit. Tente baixar o pacote completo.
            </p>
        `;
    }
}


// ======================================================
// MODAL DE MATERIAIS
// ======================================================

const materialsModal =
    document.querySelector("#materialsModal");

const btnAbrirMateriais =
    document.querySelector("#btnAbrirMateriais");

const btnFecharMateriais =
    document.querySelector("#btnFecharMateriais");

const materialsModalOverlay =
    document.querySelector("#materialsModalOverlay");


// ======================================================
// ABRIR MODAL
// ======================================================

if (btnAbrirMateriais) {

    btnAbrirMateriais.addEventListener(
        "click",
        () => {

            if (!materialsModal) {
                return;
            }

            materialsModal.hidden = false;

            document.body.classList.add(
                "modal-open"
            );

        }
    );

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharMateriaisModal() {

    if (!materialsModal) {
        return;
    }

    materialsModal.hidden = true;

    document.body.classList.remove(
        "modal-open"
    );

}


if (btnFecharMateriais) {

    btnFecharMateriais.addEventListener(
        "click",
        fecharMateriaisModal
    );

}


if (materialsModalOverlay) {

    materialsModalOverlay.addEventListener(
        "click",
        fecharMateriaisModal
    );

}


// ======================================================
// ESC
// ======================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            materialsModal &&
            !materialsModal.hidden
        ) {

            fecharMateriaisModal();

        }

    }
);
// ======================================================
// INICIAR
// ======================================================

if (campanhaId) {

    carregarCampanha();

    carregarRegras();

    carregarMateriais();

    carregarAngulos();

    carregarCopies();

    carregarKit();

}