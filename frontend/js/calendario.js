console.log("calendario carregado");

let campanhasCalendario = [];
let dataAtual = new Date();
let diaSelecionado = null;
let campanhaExibida = null;

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const DIAS_SEMANA_COMPLETO = [
    "DOMINGO",
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO"
];
const MESES_CURTOS = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];



function atualizarSubtituloCalendario(){
    const el = document.querySelector("#calendar-subtitle");
    if(!el) return;

    const mes = MESES_CURTOS[dataAtual.getMonth()] || "";
    el.textContent = `Campanhas de ${mes} — navegue pelas setas.`;
}



function atualizarDiaSelecionadoUI(ano, mes, dia){
    const diaEl = document.querySelector("#calendar-selected-day");
    const semanaEl = document.querySelector("#calendar-selected-weekday");

    if(!diaEl || !semanaEl) return;

    if(dia == null || ano == null || mes == null){
        diaEl.textContent = "—";
        semanaEl.textContent = "";
        return;
    }

    const data = new Date(ano, mes, dia);
    diaEl.textContent = String(dia).padStart(2, "0");
    semanaEl.textContent = DIAS_SEMANA_COMPLETO[data.getDay()] || "";
}



function inicioDoDia(data){
    return new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );
}



function parseDataLocal(valor){
    if(!valor) return null;

    if(typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)){
        const [ano, mes, dia] = valor.slice(0, 10).split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    const data = new Date(valor);
    if(Number.isNaN(data.getTime())) return null;
    return inicioDoDia(data);
}



function campanhaNoDia(campanha, dataDia){
    const inicio = parseDataLocal(campanha.data_inicio);
    const fim = parseDataLocal(campanha.data_fim);

    if(!inicio || !fim) return false;

    const dia = inicioDoDia(dataDia).getTime();
    return dia >= inicio.getTime() && dia <= fim.getTime();
}



function campanhasDoDia(dataDia){
    return campanhasCalendario.filter(campanha =>
        campanhaNoDia(campanha, dataDia)
    );
}



function rotuloCampanha(campanha){
    return (
        campanha?.titulo
        || campanha?.nome
        || campanha?.cupom
        || "Campanha"
    ).toString().trim();
}

function rotuloCampanhaCurto(campanha){
    return rotuloCampanha(campanha).toUpperCase();
}



function atualizarLabelCampanha(campanha, listaContexto = null){
    const label = document.querySelector("#calendar-campaign-label");
    if(!label) return;

    if(!campanha){
        label.textContent = "—";
        return;
    }

    const lista = Array.isArray(listaContexto) && listaContexto.length > 0
        ? listaContexto
        : campanhasCalendario;

    if(!lista.length){
        label.textContent = rotuloCampanhaCurto(campanha);
        return;
    }

    const indice = lista.findIndex((item) =>
        String(item.id) === String(campanha.id)
    );

    const posicao = indice >= 0 ? indice + 1 : 1;

    label.textContent =
        `${rotuloCampanhaCurto(campanha)} ${posicao}/${lista.length}`;
}



function escolherCampanhaDoDia(lista, ano, mes, dia){
    if(!Array.isArray(lista) || lista.length === 0){
        return null;
    }

    // Prioriza campanha que começa neste dia
    const queComecaHoje = lista.find((campanha) => {
        const inicio = parseDataLocal(campanha.data_inicio);
        if(!inicio) return false;
        return (
            inicio.getFullYear() === ano
            && inicio.getMonth() === mes
            && inicio.getDate() === dia
        );
    });

    if(queComecaHoje) return queComecaHoje;

    // Se já havia uma campanha exibida e ela ainda vale neste dia, mantém
    if(
        campanhaExibida
        && lista.some((item) => String(item.id) === String(campanhaExibida.id))
    ){
        return lista.find(
            (item) => String(item.id) === String(campanhaExibida.id)
        );
    }

    return lista[0];
}



function atualizarCardCampanha(campanha, listaContexto = null){
    campanhaExibida = campanha || null;
    atualizarLabelCampanha(campanhaExibida, listaContexto);

    const imagem = document.querySelector("#campaign-image");
    const titulo = document.querySelector("#campaign-title");
    const nome = document.querySelector("#campaign-name");
    const cupom = document.querySelector("#campaign-coupon");
    const valor = document.querySelector("#campaign-value");
    const botao = document.querySelector("#campaign-button");

    if(!campanha){

        if(imagem) imagem.removeAttribute("src");
        if(titulo) titulo.textContent = "";
        if(nome) nome.textContent = "";
        if(cupom) cupom.textContent = "";
        if(valor) valor.textContent = "";

        if(botao){
            botao.removeAttribute("data-campanha-id");
        }

        return;
    }

    if(botao){
        botao.dataset.campanhaId = String(campanha.id);
    }

    if(imagem){
        const src =
            campanha.imagem_card
            ?? campanha.banner
            ?? "images/default.jpg";

        if(imagem.getAttribute("src") !== src){
            imagem.style.opacity = "0.35";
            imagem.onload = () => {
                imagem.style.opacity = "1";
            };
            imagem.src = src;
        }
    }

    if(titulo){
        titulo.textContent = campanha.titulo ?? "";
    }

    if(nome){
        nome.textContent = campanha.categoria ?? "";
    }

    // Nome dinâmico da campanha ativa (não cupom fixo)
    if(cupom){
        cupom.textContent = rotuloCampanhaCurto(campanha);
    }

    if(valor){
        valor.textContent = campanha.premio ?? campanha.valor ?? "";
    }

}



function escolherCampanhaPadrao(){
    const hoje = inicioDoDia(new Date());

    // 1) Campanha vigente hoje: data_inicio <= hoje <= data_fim
    const ativasHoje = campanhasDoDia(hoje);

    if(ativasHoje.length > 0){
        return (
            ativasHoje.find((campanha) =>
                String(campanha.status || "").toLowerCase() === "ativa"
            )
            || ativasHoje[0]
        );
    }

    // 2) Próxima campanha futura com data_inicio mais próxima
    const futuras = campanhasCalendario
        .filter((campanha) => {
            const inicio = parseDataLocal(campanha.data_inicio);
            return inicio && inicio.getTime() > hoje.getTime();
        })
        .sort((a, b) => {
            const inicioA = parseDataLocal(a.data_inicio)?.getTime() ?? 0;
            const inicioB = parseDataLocal(b.data_inicio)?.getTime() ?? 0;
            return inicioA - inicioB;
        });

    if(futuras.length > 0){
        return futuras[0];
    }

    // 3) Fallback atual
    const marcadaAtiva = campanhasCalendario.find(
        campanha => String(campanha.status || "").toLowerCase() === "ativa"
    );
    if(marcadaAtiva) return marcadaAtiva;

    return campanhasCalendario[0] || null;
}



function selecionarDia(ano, mes, dia, campanhas){
    diaSelecionado = { ano, mes, dia };
    atualizarDiaSelecionadoUI(ano, mes, dia);

    const lista = campanhas || campanhasDoDia(new Date(ano, mes, dia));
    const campanhaDoDia = escolherCampanhaDoDia(lista, ano, mes, dia);

    // Sempre atualiza o card/label com a campanha do dia clicado
    atualizarCardCampanha(campanhaDoDia, lista.length ? lista : null);

    renderizarCalendario();
}



function montarCabecalho(grid){
    const spacer = document.createElement("div");
    spacer.className = "calendar-weekday is-spacer";
    spacer.textContent = "SEM.";
    grid.appendChild(spacer);

    DIAS_SEMANA.forEach(nome => {
        const celula = document.createElement("div");
        celula.className = "calendar-weekday";
        celula.textContent = nome;
        grid.appendChild(celula);
    });
}



function renderizarCalendario(){
    const grid = document.querySelector("#calendar-days");

    if(!grid){
        console.error("Elemento #calendar-days não encontrado");
        return;
    }

    atualizarSubtituloCalendario();

    grid.innerHTML = "";

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const totalCelulas = Math.ceil((primeiroDia + ultimoDia) / 7) * 7;
    const totalSemanas = totalCelulas / 7;

    montarCabecalho(grid);

    for(let semana = 0; semana < totalSemanas; semana++){
        const label = document.createElement("div");
        label.className = "week-label";
        label.textContent = `SEM. ${semana + 1}`;
        grid.appendChild(label);

        for(let coluna = 0; coluna < 7; coluna++){
            const indice = semana * 7 + coluna;
            const diaNumero = indice - primeiroDia + 1;
            const celula = document.createElement("div");

            if(diaNumero < 1 || diaNumero > ultimoDia){
                celula.className = "day is-empty";
                grid.appendChild(celula);
                continue;
            }

            const dataDia = new Date(ano, mes, diaNumero);
            const lista = campanhasDoDia(dataDia);
            const ehInicioCampanha = campanhasCalendario.some(campanha => {
                const inicio = parseDataLocal(campanha.data_inicio);
                if(!inicio) return false;
                return (
                    inicio.getFullYear() === ano
                    && inicio.getMonth() === mes
                    && inicio.getDate() === diaNumero
                );
            });
            const selecionado =
                diaSelecionado
                && diaSelecionado.ano === ano
                && diaSelecionado.mes === mes
                && diaSelecionado.dia === diaNumero;

            celula.className = "day";
            celula.textContent = String(diaNumero).padStart(2, "0");
            celula.dataset.day = String(diaNumero).padStart(2, "0");

            // Ponto azul só no dia de início da campanha
            if(ehInicioCampanha){
                celula.classList.add("has-campaign");
            }

            if(selecionado){
                celula.classList.add("is-selected");
            }

            celula.addEventListener("click", () => {
                selecionarDia(ano, mes, diaNumero, lista);
            });

            grid.appendChild(celula);
        }
    }

    if(diaSelecionado){
        atualizarDiaSelecionadoUI(
            diaSelecionado.ano,
            diaSelecionado.mes,
            diaSelecionado.dia
        );
    }
}



function garantirSelecaoInicial(){
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const hoje = new Date();

    if(
        diaSelecionado
        && diaSelecionado.ano === ano
        && diaSelecionado.mes === mes
    ){
        return;
    }

    if(hoje.getFullYear() === ano && hoje.getMonth() === mes){
        selecionarDia(
            ano,
            mes,
            hoje.getDate(),
            campanhasDoDia(hoje)
        );
        return;
    }

    // Primeiro dia do mês com campanha, senão dia 1
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    for(let dia = 1; dia <= ultimoDia; dia++){
        const lista = campanhasDoDia(new Date(ano, mes, dia));
        if(lista.length > 0){
            selecionarDia(ano, mes, dia, lista);
            return;
        }
    }

    selecionarDia(ano, mes, 1, []);
}



async function carregarCalendario(){
    renderizarCalendario();

    try{
        const resposta = await fetch(
            "http://localhost:3000/api/campanhas"
        );

        if(!resposta.ok){
            throw new Error(`HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();
        const lista = Array.isArray(dados)
            ? dados
            : (dados.campanhas ?? []);

        // Exibe no calendário campanhas ativas e agendadas prontas
        campanhasCalendario = lista.filter((campanha) => {
            if (typeof campanhaDisponivelNoFront === "function") {
                return campanhaDisponivelNoFront(campanha);
            }

            const status = String(campanha.status || "")
                .toLowerCase()
                .trim();

            return status === "ativa" || status === "agendada";
        });

        if(!campanhaExibida){
            atualizarCardCampanha(escolherCampanhaPadrao());
        }

        garantirSelecaoInicial();
        renderizarCalendario();

    }catch(error){
        console.error("Erro ao carregar campanhas:", error);
        renderizarCalendario();
    }
}



const botaoAnterior = document.querySelector("#prev-month");

if(botaoAnterior){
    botaoAnterior.addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        diaSelecionado = null;
        garantirSelecaoInicial();
        renderizarCalendario();
    });
}



const botaoProximo = document.querySelector("#next-month");

if(botaoProximo){
    botaoProximo.addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        diaSelecionado = null;
        garantirSelecaoInicial();
        renderizarCalendario();
    });
}



carregarCalendario();
