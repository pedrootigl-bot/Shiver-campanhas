/**
 * Camada de API — trocar mocks por fetch do banco quando integrar.
 */

/**
 * Campanha pronta aparece no site público se estiver ativa
 * ou agendada (ex.: começa amanhã). Finalizada e incompleta ficam de fora.
 */
function campanhaDisponivelNoFront(campanha) {
    const status = String(campanha?.status || "")
        .toLowerCase()
        .trim();

    if (status === "ativa") {
        return true;
    }

    if (status !== "agendada") {
        return false;
    }

    const pronta = campanha?.pronta_publicacao;
    return (
        pronta === true
        || pronta === "true"
        || pronta === 1
        || pronta === "1"
    );
}

/** Mock dos indicadores */
const statsMock = {
    campanhas: 1,
    materiais: 13,
    copies: 9,
    videos: 1
};

/**
 * Mock do destaque do dia ("O que divulgar hoje")
 * Esperado do banco/API — mesmos campos.
 */
const destaqueMock = {
    tag: "BULLCAR",
    titulo: "BULLCAR • Operou, acelerou",
    descricao: "Incentive traders a depositar com o cupom e operar para acumular tickets do HAVAL H6 GT.",
    copy: "Deposite a partir de R$150 com o cupom BULLCAR, opere R$60 e ganhe tickets para concorrer a um HAVAL H6 GT 0 km. Quanto mais operar, mais chances.",
    storyUrl: "assets/images/post.png",
    imagem: "assets/images/post.png",
    mediaLabel: "BULLCAR",
    mediaCaption: "Material recomendado pronto para uso"
};

/**
 * Busca os indicadores da plataforma.
 * Futuro:
 *   const response = await fetch("/api/stats");
 *   if (!response.ok) throw new Error("Falha ao carregar stats");
 *   return response.json();
 */
async function obterStats(){

    const resposta = await fetch(
        "http://localhost:3000/api/stats"
    );


    if(!resposta.ok){

        throw new Error(
            "Erro ao buscar stats"
        );

    }


    return await resposta.json();

}

/**
 * Busca o destaque do dia.
 * Futuro:
 *   const response = await fetch("/api/destaque");
 *   if (!response.ok) throw new Error("Falha ao carregar destaque");
 *   return response.json();
 */
async function obterDestaque() {

    const resposta = await fetch(
        "http://localhost:3000/api/destaque"
    );


    if (!resposta.ok) {

        throw new Error(
            "Erro ao buscar destaque"
        );

    }


    return await resposta.json();

}

function carregarDestaque(destaque){

    document.querySelector("#destaque-titulo").textContent =
        destaque.titulo;


    document.querySelector("#destaque-descricao").textContent =
        destaque.descricao;


    document.querySelector("#destaque-imagem").src =
        destaque.imagem;


    document.querySelector("#destaque-copy").textContent =
        destaque.copy;

}

function iniciarAcoesDestaque(){

    const botaoCopiar = document.querySelector(
        "#highlightCopyBtn"
    );

    const botaoKit = document.querySelector(
        "#highlightOpenKit"
    );


    const campoCopy = document.querySelector(
        "#highlightCopy"
    );


    if(botaoCopiar && campoCopy){

        botaoCopiar.addEventListener(
            "click",
            async () => {

                await navigator.clipboard.writeText(
                    campoCopy.textContent
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

                },2000);


            }
        );

    }



    if(botaoKit){

        botaoKit.addEventListener(
            "click",
            () => {

                alert(
                    "Abrir kit completo"
                );

            }
        );

    }

}

/**
 * Busca campanha na API.
 * Futuro: apontar API_URL para o endpoint real.
 */
async function buscarCampanha() {
    const resposta = await fetch("API_URL");
    const dados = await resposta.json();
    carregarCampanha(dados);
}
