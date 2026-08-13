/**
 * Post / Destaque do Dia
 * Seleciona automaticamente a campanha mais relevante para a data atual.
 */

function inicioDoDiaDestaque(data = new Date()) {
    return new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );
}

function parseDataDestaque(valor) {
    if (!valor) return null;

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
        const [ano, mes, dia] = valor.slice(0, 10).split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return inicioDoDiaDestaque(data);
}

/**
 * Ordena do mais antigo para o mais novo (ordem de cadastro).
 * Usa created_at quando existir; senão usa o id crescente.
 */
function ordenarCampanhasMaisAntigasPrimeiro(campanhas = []) {
    return (Array.isArray(campanhas) ? campanhas.slice() : []).sort((a, b) => {
        const createdA = a?.created_at ? new Date(a.created_at).getTime() : NaN;
        const createdB = b?.created_at ? new Date(b.created_at).getTime() : NaN;

        const temCreatedA = Number.isFinite(createdA);
        const temCreatedB = Number.isFinite(createdB);

        if (temCreatedA && temCreatedB && createdA !== createdB) {
            return createdA - createdB;
        }

        const idA = Number(a?.id) || 0;
        const idB = Number(b?.id) || 0;
        return idA - idB;
    });
}

function campanhaNaoExpirada(campanha, hoje = inicioDoDiaDestaque(new Date())) {
    const fim = parseDataDestaque(campanha?.data_fim);
    if (!fim) return false;
    return hoje.getTime() <= fim.getTime();
}

function campanhaJaIniciou(campanha, hoje = inicioDoDiaDestaque(new Date())) {
    const inicio = parseDataDestaque(campanha?.data_inicio);
    if (!inicio) return true;
    return hoje.getTime() >= inicio.getTime();
}

function ehCampanhaAtiva(campanha) {
    return String(campanha?.status || "").toLowerCase().trim() === "ativa";
}

/**
 * Regras do hero / destaque:
 * 1) Entre campanhas ativas (status sincronizado pelas datas), usa a mais antiga.
 * 2) Se nenhuma estiver ativa, usa a agendada pronta mais antiga.
 * 3) Se nenhuma estiver disponível, null (fallback da API /destaque).
 */
function escolherCampanhaPostDoDia(campanhas = []) {
    const lista = ordenarCampanhasMaisAntigasPrimeiro(campanhas);
    const ativas = lista.filter((campanha) => ehCampanhaAtiva(campanha));

    if (ativas.length > 0) {
        return ativas[0];
    }

    const agendadasProntas = lista.filter((campanha) => {
        if (typeof campanhaDisponivelNoFront === "function") {
            return campanhaDisponivelNoFront(campanha);
        }

        return String(campanha?.status || "").toLowerCase().trim() === "agendada";
    });

    if (agendadasProntas.length > 0) {
        return agendadasProntas[0];
    }

    return null;
}

function formatarMesCurtoHero(mes) {
    const meses = [
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
    ];
    return meses[mes] || "";
}

function formatarDataHero(valor) {
    const data = parseDataDestaque(valor);
    if (!data) return "";
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = formatarMesCurtoHero(data.getMonth());
    return `${dia} DE ${mes}`;
}

function formatarPeriodoHero(campanha) {
    const inicio = formatarDataHero(campanha?.data_inicio);
    const fim = formatarDataHero(campanha?.data_fim);
    if (inicio && fim) return `${inicio} — ${fim}`;
    return inicio || fim || "—";
}

function formatarDepositoHero(valor) {
    if (valor === null || valor === undefined || valor === "") return "—";

    const numero = Number(
        String(valor).replace(/[^\d.,-]/g, "").replace(",", ".")
    );

    if (!Number.isFinite(numero)) {
        return String(valor);
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    });
}

function formatarCountdownHero(dataFim) {
    const fim = parseDataDestaque(dataFim);
    if (!fim) return "—";

    // Considera o fim do dia
    const fimDia = new Date(
        fim.getFullYear(),
        fim.getMonth(),
        fim.getDate(),
        23,
        59,
        59
    );

    const agora = new Date();
    const diff = fimDia.getTime() - agora.getTime();

    const diaLabel = formatarDataHero(dataFim).replace(" DE ", " ");

    if (diff <= 0) {
        return `${diaLabel} encerrada`;
    }

    const totalHoras = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(totalHoras / 24);
    const horas = totalHoras % 24;

    return `${diaLabel} ${dias}d ${String(horas).padStart(2, "0")}h`;
}

function formatarStatusHero(status) {
    const s = String(status || "").trim().toLowerCase();
    if (s === "ativa") return "DESTAQUE · ATIVA";
    if (s === "agendada") return "DESTAQUE · AGENDADA";
    if (s === "finalizada") return "DESTAQUE · FINALIZADA";
    return s ? `DESTAQUE · ${s.toUpperCase()}` : "DESTAQUE";
}

function formatarFocoHero(categoria) {
    const partes = String(categoria || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    if (!partes.length) return "—";
    return partes.join(" · ");
}

function imagemCampanhaHero(campanha) {
    return (
        campanha?.imagem_card
        || campanha?.banner
        || campanha?.imagem
        || campanha?.story_url
        || "images/post.png"
    );
}

function preencherHeroComCampanha(campanha) {
    const hero = document.querySelector("#hero");
    if (!hero || !campanha) return;

    // Título grande do hero: campo "Texto do header" (fallback no título da campanha)
    const tituloHeader =
        String(campanha.texto_header || "").trim()
        || campanha.titulo
        || "Campanha ativa";
    const tituloCampanha = campanha.titulo || tituloHeader;
    const descricao =
        campanha.descricao
        || campanha.objetivo
        || campanha.visao_geral
        || "";
    const cupom = campanha.cupom || "—";
    const imagemSrc = imagemCampanhaHero(campanha);

    const elTitulo = document.querySelector("#heroTitle");
    const elLead = document.querySelector("#heroLead");
    const elPeriod = document.querySelector("#heroPeriod");
    const elCupom = document.querySelector("#heroCupom");
    const elDeposito = document.querySelector("#heroDeposito");
    const elPremio = document.querySelector("#heroPremio");
    const elFocus = document.querySelector("#heroFocusText");
    const elCountdown = document.querySelector("#heroCountdown");
    const elStatus = document.querySelector("#heroBadgeStatus");
    const elImage = document.querySelector("#heroImage");
    const elCaptionCupom = document.querySelector("#heroCaptionCupom");
    const elCaptionTitulo = document.querySelector("#heroCaptionTitulo");

    if (elTitulo) elTitulo.textContent = tituloHeader;
    if (elLead) elLead.textContent = descricao || "Campanha ativa no momento.";
    if (elPeriod) elPeriod.textContent = formatarPeriodoHero(campanha);
    if (elCupom) elCupom.textContent = cupom;
    if (elDeposito) {
        elDeposito.textContent = formatarDepositoHero(campanha.deposito_minimo);
    }
    if (elPremio) {
        elPremio.textContent = campanha.premio || campanha.valor || "—";
    }
    if (elFocus) {
        elFocus.textContent = formatarFocoHero(
            campanha.publico_recomendado || campanha.objetivo || campanha.categoria
        );
    }
    if (elCountdown) elCountdown.textContent = formatarCountdownHero(campanha.data_fim);
    if (elStatus) elStatus.textContent = formatarStatusHero(campanha.status);

    if (elImage) {
        elImage.src = imagemSrc;
        elImage.alt = `${tituloHeader}${cupom && cupom !== "—" ? ` — ${cupom}` : ""}`;
    }

    if (elCaptionCupom) elCaptionCupom.textContent = cupom;
    // Caption do card visual segue com o título da campanha
    if (elCaptionTitulo) elCaptionTitulo.textContent = tituloCampanha;

    hero.dataset.campanhaId = String(campanha.id || "");
    revelarHeroFadeIn();
}

function revelarHeroFadeIn() {
    const hero = document.querySelector("#hero");
    if (!hero) return;

    hero.classList.remove("hero--loaded");
    // força reinício da animação
    void hero.offsetWidth;
    hero.classList.add("hero--loaded", "is-visible");
}

async function buscarCopiesCampanha(campanhaId) {
    try {
        const resposta = await fetch(
            `http://localhost:3000/api/copies/${campanhaId}`
        );

        if (!resposta.ok) return [];

        const dados = await resposta.json();
        return Array.isArray(dados) ? dados : [];
    } catch (error) {
        console.error("Erro ao buscar copies do destaque:", error);
        return [];
    }
}

async function obterCampanhaParaDestaque() {
    const resposta = await fetch(
        "http://localhost:3000/api/campanhas"
    );

    if (!resposta.ok) {
        throw new Error("Erro ao buscar campanhas");
    }

    const dados = await resposta.json();
    const campanhas = Array.isArray(dados)
        ? dados
        : (dados.campanhas ?? []);

    return escolherCampanhaPostDoDia(campanhas);
}

async function preencherDestaqueComCampanha(campanha) {
    const tag = document.querySelector("#highlightTag");
    const titulo = document.querySelector("#highlightTitle");
    const descricao = document.querySelector("#highlightDescription");
    const imagem = document.querySelector("#highlightImage");
    const copy = document.querySelector("#highlightCopy");
    const downloadStory = document.querySelector("#highlightDownloadStory");
    const mediaLabel = document.querySelector("#highlightMediaLabel");
    const mediaCaption = document.querySelector("#highlightMediaCaption");
    const openKitBtn =
        document.querySelector("#openKitModal")
        || document.querySelector("#highlightOpenKit");
    const openModalBtn = document.querySelector("#openModal");

    const copies = await buscarCopiesCampanha(campanha.id);
    const copyPrincipal = copies
        .slice()
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))[0];

    const imagemSrc =
        campanha.imagem_card
        || campanha.banner
        || "";

    if (tag) {
        tag.textContent =
            campanha.cupom
            || String(campanha.categoria || "").split(",")[0]?.trim()
            || "DESTAQUE DO DIA";
    }

    if (titulo) {
        titulo.textContent = campanha.titulo || "";
    }

    if (descricao) {
        descricao.textContent = campanha.descricao || "";
    }

    if (imagem) {
        if (imagemSrc) {
            imagem.hidden = false;
            imagem.src = imagemSrc;
            imagem.alt = campanha.titulo || "Campanha em destaque";
        } else {
            imagem.removeAttribute("src");
            imagem.hidden = true;
            imagem.alt = "";
        }
    }

    if (copy) {
        copy.textContent =
            copyPrincipal?.texto
            || campanha.objetivo
            || campanha.descricao
            || "";
    }

    if (downloadStory) {
        downloadStory.href = imagemSrc
            ? `${imagemSrc}`
            : "#";
    }

    if (mediaLabel) {
        mediaLabel.textContent =
            campanha.cupom || campanha.titulo || "Campanha";
    }

    if (mediaCaption) {
        mediaCaption.textContent = "Material recomendado pronto para uso";
    }

    if (openKitBtn) {
        openKitBtn.dataset.campanhaId = String(campanha.id);
    }

    if (openModalBtn) {
        openModalBtn.dataset.campanhaId = String(campanha.id);
    }

    const openEntenderBtn = document.querySelector("#openEntenderCampanha");
    if (openEntenderBtn) {
        openEntenderBtn.dataset.campanhaId = String(campanha.id);
    }

    // Mantém referência global para modal/kit/materiais/copies/regras
    window.campanhaDestaqueAtual = campanha;

    // Hero: título, textos, datas, cupom, prêmio e imagem da campanha ativa
    preencherHeroComCampanha(campanha);
}

async function carregarDestaqueFallbackApi() {
    const resposta = await fetch(
        "http://localhost:3000/api/destaque"
    );

    if (!resposta.ok) {
        throw new Error("Erro ao buscar destaque");
    }

    const destaque = await resposta.json();

    if (!destaque) {
        console.warn("Nenhum destaque encontrado");
        return;
    }

    const tag = document.querySelector("#highlightTag");
    const titulo = document.querySelector("#highlightTitle");
    const descricao = document.querySelector("#highlightDescription");
    const imagem = document.querySelector("#highlightImage");
    const copy = document.querySelector("#highlightCopy");
    const downloadStory = document.querySelector("#highlightDownloadStory");

    if (tag) tag.textContent = "DESTAQUE DO DIA";
    if (titulo) titulo.textContent = destaque.titulo || "";
    if (descricao) descricao.textContent = destaque.descricao || "";

    if (imagem) {
        imagem.src = destaque.imagem || "";
        imagem.alt = destaque.titulo || "Destaque";
    }

    if (copy) copy.textContent = destaque.copy || "";

    if (downloadStory && destaque.story_url) {
        downloadStory.href = destaque.story_url;
    }

    revelarHeroFadeIn();
}

/**
 * Carrega o Post do Dia pela campanha mais relevante.
 * Fallback: API /api/destaque
 */
async function carregarDestaque() {
    try {
        const campanha = await obterCampanhaParaDestaque();

        if (campanha) {
            await preencherDestaqueComCampanha(campanha);
            return;
        }

        await carregarDestaqueFallbackApi();
    } catch (error) {
        console.error("Erro ao carregar destaque:", error);

        try {
            await carregarDestaqueFallbackApi();
        } catch (fallbackError) {
            console.error(
                "Erro no fallback do destaque:",
                fallbackError
            );
        }
    }
}

/**
 * Ações dos botões do destaque
 */
function iniciarAcoesDestaque() {
    const botaoCopiar = document.querySelector("#highlightCopyBtn");
    const campoCopy = document.querySelector("#highlightCopy");

    if (botaoCopiar && campoCopy) {
        botaoCopiar.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(
                    campoCopy.textContent || ""
                );

                botaoCopiar.innerHTML = `
                    <i class="fa-solid fa-check"></i>
                    Copiado!
                `;

                setTimeout(() => {
                    botaoCopiar.innerHTML = `
                        <i class="fa-regular fa-copy"></i>
                        Copiar texto
                    `;
                }, 2000);
            } catch (error) {
                console.error("Erro ao copiar texto:", error);
            }
        });
    }

    // #openKitModal é controlado em modal.js e já usa campanhaDestaqueAtual
}
