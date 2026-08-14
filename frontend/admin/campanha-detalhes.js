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

const btnPublicarCampanha = document.querySelector("#btnPublicarCampanha");
if (btnPublicarCampanha) {
    btnPublicarCampanha.addEventListener("click", () => {
        void publicarCampanha();
    });
}


// ======================================================
// VALIDAR ID
// ======================================================

const wsEditar = document.querySelector("#wsEditar");
const wsMateriais = document.querySelector("#wsMateriais");

if (wsEditar && campanhaId) {
    wsEditar.href = `campanha-form.html?id=${encodeURIComponent(campanhaId)}`;
}

if (wsMateriais && campanhaId) {
    wsMateriais.href = `gerenciar-materiais.html?id=${encodeURIComponent(campanhaId)}`;
}

const linkCopies = document.querySelector("#linkCopies");
const linkMateriais = document.querySelector("#linkMateriais");
if (linkCopies && campanhaId) {
    linkCopies.href = `gerenciar-copies.html?id=${encodeURIComponent(campanhaId)}`;
}
if (linkMateriais && campanhaId) {
    linkMateriais.href = `gerenciar-materiais.html?id=${encodeURIComponent(campanhaId)}`;
}

if (!campanhaId) {

    console.error(
        "ID da campanha não informado."
    );

    window.ShiverUI?.notifyError("ID da campanha não informado.");

    window.location.href =
        "campanhas.html";

}

function setConteudoCount(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    const n = Number(valor) || 0;
    el.textContent = String(n).padStart(2, "0");
}

function rotuloStatusCampanha(status) {
    const valor = String(status || "").trim().toLowerCase();
    if (valor === "ativa") return "Ativa";
    if (valor === "agendada") return "Em preparação";
    if (valor === "finalizada") return "Encerrada";
    return status || "—";
}

function formatarTamanhoArquivo(valor) {
    const n = Number(valor);
    if (!n || n < 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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
                rotuloStatusCampanha(campanha.status);

        }

        const workspaceMeta = document.querySelector("#workspaceMeta");
        if (workspaceMeta) {
            const categoria = campanha.categoria || "Sem categoria";
            const periodo = `${formatarData(campanha.data_inicio)} — ${formatarData(campanha.data_fim)}`;
            const status = rotuloStatusCampanha(campanha.status);
            workspaceMeta.textContent = `${categoria} · ${periodo} · ${status}`;
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


        window.ShiverUI?.notifyError(
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
    { id: "informacoes", label: "Informações básicas", match: /título|data de início|data de fim/i },
    { id: "banner", label: "Banner", match: /banner/i },
    { id: "visao_geral", label: "Visão geral", match: /visão geral/i },
    { id: "copies", label: "Copies", match: /copies/i },
    { id: "regras", label: "Regras", match: /regras/i },
    { id: "materiais", label: "Materiais", match: /materiais/i }
];

function escaparHtmlProntidao(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function atualizarAcoesPublicacao(campanha) {
    const acoesEl = document.querySelector("#prontidaoAcoes");
    const hintEl = document.querySelector("#prontidaoHint");
    const btnEl = document.querySelector("#btnPublicarCampanha");

    if (!acoesEl) return;

    const pronta = normalizarProntaPublicacao(campanha?.pronta_publicacao);
    const status = String(campanha?.status || "").trim().toLowerCase();
    const pendenteData =
        campanha?.confirmacao_data_pendente === true
        || campanha?.confirmacao_data_pendente === "true";

    if (status === "ativa") {
        acoesEl.hidden = false;
        if (hintEl) {
            hintEl.textContent = "Campanha ativa no Partner Hub.";
        }
        if (btnEl) btnEl.hidden = true;
        return;
    }

    if (pronta !== true || status === "finalizada" || !pendenteData) {
        acoesEl.hidden = true;
        if (hintEl) hintEl.textContent = "";
        if (btnEl) btnEl.hidden = true;
        return;
    }

    const dataAntes = formatarData(campanha.data_inicio_anterior);
    const dataNova = formatarData(
        campanha.data_inicio_nova || campanha.data_inicio
    );

    acoesEl.hidden = false;
    if (hintEl) {
        hintEl.textContent =
            `A data de início mudou de ${dataAntes} para ${dataNova}. Confirme se essa alteração está correta para a campanha aparecer no Partner Hub.`;
    }
    if (btnEl) {
        btnEl.hidden = false;
        btnEl.disabled = false;
        btnEl.textContent = "Confirmar nova data e ativar";
    }
}

async function publicarCampanha() {
    const btnEl = document.querySelector("#btnPublicarCampanha");
    if (!campanhaId) return;

    const confirmar = window.confirm(
        "Confirmar que a mudança de data está correta e ativar a campanha no Partner Hub?"
    );
    if (!confirmar) return;

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = "Ativando...";
    }

    try {
        const headers = typeof getAuthHeaders === "function"
            ? await getAuthHeaders({
                "Content-Type": "application/json"
            })
            : { "Content-Type": "application/json" };

        const resposta = await fetch(
            `${API}/api/campanhas/${campanhaId}/publicar`,
            {
                method: "POST",
                headers
            }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (resposta.status === 401) {
            throw new Error("Faça login no admin para ativar a campanha.");
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.error || "Não foi possível ativar a campanha."
            );
        }

        window.ShiverUI?.notifyOk(
            dados.mensagem || "Campanha ativada com sucesso."
        );
        window.location.reload();
    } catch (error) {
        window.ShiverUI?.notifyError(
            error.message || "Não foi possível ativar a campanha."
        );
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = "Confirmar nova data e ativar";
        }
    }
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
        titleEl.textContent = "100% pronta para publicação";
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
        atualizarAcoesPublicacao(campanha);
        return;
    }

    if (pronta === false) {
        root.classList.add("campanha-prontidao--pendente");
        titleEl.textContent = "Campanha incompleta";
        badgeEl.textContent = "PENDENTE";

        if (messageEl) {
            messageEl.hidden = false;
            messageEl.textContent =
                "Existem itens que precisam ser preenchidos antes da publicação.";
        }

        // Checklist visual a partir das pendências da API (sem nova regra).
        if (checklistEl) {
            const pendenciasChecklist = extrairPendenciasProntidao(campanha);
            const textoPendencias = pendenciasChecklist.join(" ").toLowerCase();
            checklistEl.hidden = false;
            checklistEl.innerHTML = PRONTIDAO_ITENS.map((item) => {
                const ok = pendenciasChecklist.length
                    ? !item.match.test(textoPendencias)
                    : false;
                const estado = ok ? "ok" : "pending";
                const icone = ok ? "fa-check" : "fa-exclamation";
                return `
                <div class="prontidao-item prontidao-item--${estado}" data-item="${escaparHtmlProntidao(item.id)}">
                    <span class="prontidao-item__icon" aria-hidden="true">
                        <i class="fa-solid ${icone}"></i>
                    </span>
                    <span class="prontidao-item__label">${escaparHtmlProntidao(item.label)}</span>
                </div>
            `;
            }).join("");
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
        atualizarAcoesPublicacao(campanha);
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
    atualizarAcoesPublicacao(campanha);
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
            setConteudoCount("countRegras", 0);

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

        setConteudoCount("countRegras", regras.length);

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
            setConteudoCount("countMateriais", 0);

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

            const formato =
                material.formato || "";

            const tamanho =
                formatarTamanhoArquivo(
                    material.tamanho
                    || material.size
                    || material.tamanho_arquivo
                );


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
                        ${[formato, tipo, tamanho].filter(Boolean).join(" · ")}
                    </span>


                    ${
                        url
                            ? `
                                <a
                                    href="${url}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="btn-material"
                                    download
                                >
                                    Baixar
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

        setConteudoCount("countMateriais", materiais.length);

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
            setConteudoCount("countCopies", 0);
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

        setConteudoCount("countCopies", copies.length);
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
            setConteudoCount("countKits", 0);
            return;
        }

        kitContainer.innerHTML = "";

        kits.forEach((item) => {
            const card = document.createElement("article");
            card.className = "kit-item";
            const nome =
                item.nome || item.titulo || item.arquivo || "Arquivo do kit";
            const descricao =
                item.descricao || item.tipo || "Item do kit";
            const formato =
                item.formato || item.tipo || item.extensao || "";
            const tamanho = formatarTamanhoArquivo(
                item.tamanho || item.size || item.tamanho_arquivo
            );
            const url = item.url || item.arquivo_url || "";
            card.innerHTML = `
                <div class="kit-item__icon">
                    <i class="fa-solid fa-file-zipper"></i>
                </div>
                <div class="kit-item__body">
                    <h3>${escaparHtmlDetalhe(nome)}</h3>
                    <p>${escaparHtmlDetalhe(descricao)}</p>
                    <small>${escaparHtmlDetalhe([formato, tamanho].filter(Boolean).join(" · ") || "Arquivo do kit")}</small>
                </div>
                <div class="kit-item__actions">
                    ${url ? `<a class="btn-kit-file" href="${escaparHtmlDetalhe(url)}" download>Baixar arquivo individual</a>` : ""}
                </div>
            `;
            kitContainer.appendChild(card);
        });

        setConteudoCount("countKits", kits.length);
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
// HISTÓRICO / AUDITORIA
// ======================================================

const LABELS_HISTORICO = {
    titulo: "Título",
    nome: "Nome",
    texto_header: "Texto do header",
    descricao: "Descrição",
    resumo: "Visão geral",
    visao_geral: "Visão geral",
    categoria: "Categoria",
    objetivo: "Objetivo",
    publico_recomendado: "Público recomendado",
    mecanica: "Mecânica",
    premio: "Prêmio",
    cupom: "Cupom",
    deposito_minimo: "Depósito mínimo",
    data_inicio: "Data de início",
    data_fim: "Data de encerramento",
    status: "Status",
    imagem_card: "Imagem do card",
    banner: "Banner",
    angulos_divulgacao: "Ângulos de divulgação"
};

const STATUS_HISTORICO = {
    rascunho: "Rascunho",
    agendada: "Agendada",
    ativa: "Ativa",
    finalizada: "Finalizada",
    inativa: "Inativa"
};

function labelCampoHistorico(campo) {
    if (LABELS_HISTORICO[campo]) {
        return LABELS_HISTORICO[campo];
    }

    return String(campo || "")
        .replace(/_/g, " ")
        .replace(/^\w/, (letra) => letra.toUpperCase()) || "Campo";
}

function rotuloAcaoHistorico(acao, quantidade) {
    const valor = String(acao || "").trim();
    const chave = valor.toUpperCase();
    const qtd = Number(quantidade) || 0;

    if (chave === "UPDATE" || valor.toLowerCase() === "atualizada") {
        if (qtd === 1) return "Alterou 1 informação da campanha";
        if (qtd > 1) return `Alterou ${qtd} informações da campanha`;
        return "Informações da campanha alteradas";
    }

    if (chave === "CREATE" || valor.toLowerCase() === "criada") {
        return "Campanha criada";
    }

    if (
        chave === "DELETE"
        || valor.toLowerCase() === "excluída"
        || valor.toLowerCase() === "excluida"
    ) {
        return "Campanha excluída";
    }

    if (chave === "PUBLISH" || chave === "ACTIVATE") {
        return "Campanha ativada";
    }

    if (chave === "PAUSE") return "Campanha pausada";
    if (chave === "FINISH") return "Campanha encerrada";
    if (chave === "DUPLICATE") return "Campanha duplicada";

    return valor || "Evento";
}

function formatarDataHoraHistorico(valor) {
    if (!valor) return "—";

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return String(valor);

    const dataFmt = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Sao_Paulo"
    }).format(data);

    const horaFmt = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo"
    }).format(data);

    return `${dataFmt} às ${horaFmt}`;
}

function formatarValorHistorico(valor, campo) {
    if (valor === null || valor === undefined || valor === "") {
        return "—";
    }

    if (typeof valor === "boolean") {
        return valor ? "Sim" : "Não";
    }

    if (typeof valor === "number" && Number.isFinite(valor)) {
        return String(valor);
    }

    if (Array.isArray(valor)) {
        const itens = valor
            .map((item) => formatarValorHistorico(item, campo))
            .filter((item) => item && item !== "—");
        return itens.join(", ") || "—";
    }

    if (typeof valor === "object") {
        try {
            return JSON.stringify(valor);
        } catch {
            return String(valor);
        }
    }

    const texto = String(valor).trim();
    if (!texto) return "—";

    if (campo === "status") {
        const chave = texto.toLowerCase();
        if (STATUS_HISTORICO[chave]) {
            return STATUS_HISTORICO[chave];
        }
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        const [ano, mes, dia] = texto.slice(0, 10).split("-");
        return `${dia}/${mes}/${ano}`;
    }

    if (texto === "true") return "Sim";
    if (texto === "false") return "Não";

    return texto;
}

function nomeDoEventoHistorico(evento) {
    const usuario = evento?.usuario && typeof evento.usuario === "object"
        ? evento.usuario
        : {};
    const meta = evento?.metadata && typeof evento.metadata === "object"
        ? evento.metadata
        : {};

    return (
        String(usuario.nome || "").trim()
        || String(usuario.email || "").trim()
        || String(meta.usuario_nome || "").trim()
        || String(meta.usuario_email || meta.email || "").trim()
        || (evento?.usuario_id ? "Administrador" : "Sistema")
    );
}

function camposDoEventoHistorico(evento) {
    if (Array.isArray(evento?.campos) && evento.campos.length) {
        return evento.campos;
    }

    const meta = evento?.metadata && typeof evento.metadata === "object"
        ? evento.metadata
        : {};

    if (Array.isArray(meta.campos) && meta.campos.length) {
        return meta.campos;
    }

    if (meta.alteracoes && typeof meta.alteracoes === "object") {
        return Object.entries(meta.alteracoes).map(([campo, delta]) => {
            const mudanca =
                delta && typeof delta === "object" && !Array.isArray(delta)
                    ? delta
                    : { antes: null, depois: delta };

            return {
                campo,
                label: labelCampoHistorico(campo),
                antes: mudanca.antes ?? null,
                depois: mudanca.depois ?? null
            };
        });
    }

    return [];
}

function htmlCampoHistorico(item, acao) {
    const campo = item.campo || "";
    const label = item.label || labelCampoHistorico(campo);
    const chave = String(acao || "").toUpperCase();
    const soDepois =
        chave === "CREATE"
        || chave === "DELETE"
        || String(acao || "").toLowerCase() === "criada"
        || String(acao || "").toLowerCase() === "excluída"
        || String(acao || "").toLowerCase() === "excluida";

    if (soDepois) {
        const valor = formatarValorHistorico(item.depois, campo);
        if (valor === "—") return "";

        return `
            <div class="historico-campo">
                <strong>${escaparHtmlDetalhe(label)}</strong>
                <p class="historico-campo__depois">${escaparHtmlDetalhe(valor)}</p>
            </div>
        `;
    }

    return `
        <div class="historico-campo">
            <strong>${escaparHtmlDetalhe(label)}</strong>
            <p class="historico-campo__valores">
                <span class="historico-campo__antes">${escaparHtmlDetalhe(formatarValorHistorico(item.antes, campo))}</span>
                <span class="historico-campo__seta" aria-hidden="true">→</span>
                <span class="historico-campo__depois">${escaparHtmlDetalhe(formatarValorHistorico(item.depois, campo))}</span>
            </p>
        </div>
    `;
}

async function carregarHistorico() {
    const container = document.querySelector("#historicoContainer");
    if (!container || !campanhaId) return;

    container.innerHTML = `
        <p class="detail-empty">Carregando histórico...</p>
    `;

    try {
        const headers = typeof getAuthHeaders === "function"
            ? await getAuthHeaders()
            : {};

        const resposta = await fetch(
            `${API}/api/campanhas/${campanhaId}/historico`,
            { headers }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (resposta.status === 401) {
            container.innerHTML = `
                <p class="detail-empty error-materials">
                    Faça login no admin para consultar o histórico.
                </p>
            `;
            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.error || "Erro ao carregar histórico."
            );
        }

        const lista = Array.isArray(dados.historico) ? dados.historico : [];

        if (!lista.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <strong>Nenhum evento registrado ainda.</strong>
                    As alterações desta campanha aparecerão aqui.
                </div>
            `;
            return;
        }

        container.innerHTML = lista.map((evento) => {
            const campos = camposDoEventoHistorico(evento);
            const nome = nomeDoEventoHistorico(evento);
            const camposHtml = campos
                .map((item) => htmlCampoHistorico(item, evento.acao))
                .join("");

            return `
                <article class="historico-item">
                    <header class="historico-item__header">
                        <h3>${escaparHtmlDetalhe(nome)}</h3>
                        <p class="historico-item__meta">
                            ${escaparHtmlDetalhe(formatarDataHoraHistorico(evento.created_at))}
                        </p>
                    </header>
                    <p class="historico-item__acao">
                        ${escaparHtmlDetalhe(
                            String(evento.acao || "").toUpperCase() === "UPDATE"
                            || String(evento.acao || "").toLowerCase() === "atualizada"
                                ? rotuloAcaoHistorico(evento.acao, campos.length)
                                : (evento.descricao || rotuloAcaoHistorico(evento.acao, campos.length))
                        )}
                    </p>
                    ${camposHtml}
                </article>
            `;
        }).join("");
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        container.innerHTML = `
            <p class="detail-empty error-materials">
                Não foi possível carregar o histórico.
            </p>
        `;
    }
}


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

    carregarHistorico();

}