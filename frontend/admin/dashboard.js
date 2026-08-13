const API = "http://localhost:3000";

function statusOf(campanha) {
    return String(campanha?.status || "").trim().toLowerCase();
}

function isPronta(campanha) {
    const valor = campanha?.pronta_publicacao;
    return valor === true || valor === "true" || valor === 1 || valor === "1";
}

function diasAte(dataValor) {
    if (!dataValor) return null;
    const raw = String(dataValor).slice(0, 10);
    const [ano, mes, dia] = raw.split("-").map(Number);
    if (!ano || !mes || !dia) return null;
    const alvo = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.round((alvo - hoje) / 86400000);
}

function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(valor);
}

function montarAtencao(campanhas) {
    const lista = document.getElementById("attentionList");
    if (!lista) return;

    const itens = [];

    campanhas.forEach((campanha) => {
        const status = statusOf(campanha);
        const titulo = campanha.titulo || `Campanha #${campanha.id}`;
        const href = `campanha-detalhes.html?id=${campanha.id}`;

        if (status !== "finalizada" && !isPronta(campanha)) {
            itens.push({
                titulo,
                detalhe: "Incompleta / não pronta para publicação",
                href
            });
        }

        const restante = diasAte(campanha.data_fim);
        if (status === "ativa" && restante !== null && restante >= 0 && restante <= 3) {
            itens.push({
                titulo,
                detalhe: restante === 0 ? "Encerra hoje" : `Encerra em ${restante} dia(s)`,
                href
            });
        }
    });

    const unicos = [];
    const visto = new Set();
    itens.forEach((item) => {
        if (visto.has(item.href)) return;
        visto.add(item.href);
        unicos.push(item);
    });

    if (!unicos.length) {
        lista.innerHTML = `
            <li class="empty-state" style="padding:1.2rem">
                <strong>Nenhum alerta no momento</strong>
                Tudo certo com as campanhas atuais.
            </li>
        `;
        return;
    }

    lista.innerHTML = unicos.slice(0, 8).map((item) => `
        <li>
            <a href="${item.href}">
                <span>${item.titulo}</span>
                <small>${item.detalhe}</small>
            </a>
        </li>
    `).join("");
}

async function carregarPainel() {
    try {
        const [resCampanhas, resStats] = await Promise.all([
            fetch(`${API}/api/campanhas`),
            fetch(`${API}/api/stats`)
        ]);

        const campanhas = resCampanhas.ok ? await resCampanhas.json() : [];
        const stats = resStats.ok ? await resStats.json() : {};
        const lista = Array.isArray(campanhas) ? campanhas : [];

        const ativas = lista.filter((item) => statusOf(item) === "ativa").length;
        const encerradas = lista.filter((item) => statusOf(item) === "finalizada").length;
        const prontas = lista.filter(isPronta).length;
        const pendentes = lista.filter((item) => statusOf(item) === "agendada").length;

        setText("metricTotal", lista.length);
        setText("metricAtivas", ativas);
        setText("metricPendentes", pendentes);
        setText("metricEncerradas", encerradas);
        setText("metricProntas", prontas);
        setText("statMateriais", stats.materiais ?? 0);
        setText("statCopies", stats.copies ?? 0);
        setText("statVideos", stats.videos ?? 0);

        montarAtencao(lista);
    } catch (error) {
        console.error("Erro dashboard:", error);
        montarAtencao([]);
        window.ShiverUI?.notifyError("Não foi possível carregar o dashboard.");
    }
}

async function iniciar() {
    const session = await requireAdminSession();
    if (!session) return;
    await carregarPainel();
}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutAdmin();
    window.location.href = "login.html";
});

iniciar();
