console.log("campanha modal carregado");


/**
 * Abre o modal unificado (mesmo da home / Entender campanha),
 * com resumo, objetivo, mecânica e ângulos.
 */
async function abrirModalCampanha(id, opcoes = {}){

    if(!id){
        console.warn(
            "Nenhuma campanha selecionada para o modal"
        );
        return;
    }

    if (typeof abrirModal === "function") {
        abrirModal(id, {
            abaInicial: opcoes.abaInicial || opcoes.aba || "visao-geral"
        });
        return;
    }

    console.error(
        "abrirModal não encontrado. Verifique se js/modal.js foi carregado."
    );

}

async function carregarMateriais(campanhaId){


    const container =
    document.querySelector("#modal-materials");


    if(!container){
        console.error(
            "Elemento #modal-materials não encontrado"
        );
        return;
    }


    if(!campanhaId){
        container.textContent =
            "Nenhum material cadastrado.";
        return;
    }


    container.textContent = "Carregando materiais...";


    try{


        const resposta = await fetch(
            `http://localhost:3000/api/materiais/${campanhaId}`
        );


        if(!resposta.ok){

            throw new Error(
                `Erro HTTP: ${resposta.status}`
            );

        }


        const dados = await resposta.json();


        const materiais = Array.isArray(dados)
            ? dados
            : (dados.materiais ?? []);


        if(materiais.length === 0){

            container.textContent =
                "Nenhum material cadastrado.";
            return;

        }


        container.innerHTML = "";


        materiais.forEach(material => {


            const card =
            document.createElement("div");

            card.className = "material-card";


            const tipo =
            String(material.tipo || "").toLowerCase();

            const url = material.url || "";
            const nome = material.nome ?? "Material";

            const ehImagem =
                tipo.includes("imagem")
                || tipo.includes("image")
                || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);

            const ehVideo =
                tipo.includes("video")
                || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);


            if(ehImagem && url){

                const img =
                document.createElement("img");

                img.src = url;
                img.alt = nome;
                card.appendChild(img);

            }


            const info =
            document.createElement("div");

            info.className = "material-info";


            const titulo =
            document.createElement("h3");

            titulo.textContent = nome;


            const meta =
            document.createElement("span");

            meta.textContent =
                material.tipo ?? "";


            info.appendChild(titulo);
            info.appendChild(meta);
            card.appendChild(info);


            const actions =
            document.createElement("div");

            actions.className = "material-actions";


            if(url){

                const btnVisualizar =
                document.createElement("button");

                btnVisualizar.type = "button";
                btnVisualizar.className = "btn btn--outline";
                btnVisualizar.innerHTML = `
                    <i class="fa-regular fa-eye"></i>
                    Visualizar
                `;

                btnVisualizar.addEventListener("click", () => {

                    if (ehVideo) {

                        if (typeof abrirVideoPreview === "function") {
                            abrirVideoPreview(url, nome);
                        } else {
                            window.open(url, "_blank", "noopener");
                        }

                        return;
                    }

                    if (ehImagem && typeof abrirImagePreview === "function") {
                        abrirImagePreview(url, nome);
                        return;
                    }

                    // Outros tipos: abre para visualizar sem forçar download
                    window.open(url, "_blank", "noopener");

                });


                const linkBaixar =
                document.createElement("a");

                linkBaixar.href = url;
                linkBaixar.className = "btn";
                linkBaixar.setAttribute("download", "");
                linkBaixar.innerHTML = `
                    <i class="fa-solid fa-download"></i>
                    Baixar
                `;

                linkBaixar.addEventListener("click", (event) => {

                    if (typeof forcarDownloadArquivo === "function") {
                        forcarDownloadArquivo(event, url, nome);
                        return;
                    }

                    // Fallback: tenta download nativo
                    linkBaixar.setAttribute(
                        "download",
                        nome.replace(/\s+/g, "-").toLowerCase()
                    );

                });


                actions.appendChild(btnVisualizar);
                actions.appendChild(linkBaixar);

            }


            card.appendChild(actions);
            container.appendChild(card);


        });


    }catch(error){


        console.error(
            "Erro ao carregar materiais:",
            error
        );


        container.textContent =
            "Erro ao carregar materiais.";


    }


}



async function carregarCopies(campanhaId){

        console.log("Entrou no carregarCopies:", campanhaId);



    const container =
    document.querySelector("#modal-copies");


    if(!container){
        console.error(
            "Elemento #modal-copies não encontrado"
        );
        return;
    }


    if(!campanhaId){
        container.textContent =
            "Nenhuma copy cadastrada.";
        return;
    }


    container.textContent = "Carregando copies...";


    try{


        const resposta = await fetch(
            `http://localhost:3000/api/copies/${campanhaId}`
        );


        if(!resposta.ok){

            throw new Error(
                `Erro HTTP: ${resposta.status}`
            );

        }



        const dados = await resposta.json();

console.log("Dados recebidos copies:", JSON.stringify(dados));

        const copies = Array.isArray(dados)
            ? dados
            : (dados.copies ?? []);


        if(copies.length === 0){

            container.textContent =
                "Nenhuma copy cadastrada.";
            return;

        }


        container.innerHTML = "";


        copies.forEach(copy => {

console.log("Renderizando copy:", JSON.stringify(copy));


            const card = document.createElement("div");

card.className = "copy-card";


// CANAL

const canal = document.createElement("span");

canal.className = "copy-channel";

canal.textContent =
    copy.canal ?? "";



// TÍTULO

const titulo = document.createElement("h4");

titulo.textContent =
    `${copy.canal ?? ""} — ${copy.tipo ?? ""}`;



// TEXTO

const texto = document.createElement("p");

texto.textContent =
    copy.texto ?? "";



// BOTÃO COPIAR

const botao = document.createElement("button");

botao.className = "btn-copy";

botao.textContent = "Copiar texto";


botao.addEventListener("click", async () => {

    await navigator.clipboard.writeText(copy.texto);


    botao.textContent = "Copiado!";


    setTimeout(() => {

        botao.textContent = "Copiar texto";

    }, 2000);

});



// MONTA O CARD

card.appendChild(canal);
card.appendChild(titulo);
card.appendChild(texto);
card.appendChild(botao);


container.appendChild(card);


console.log("HTML final:", container.innerHTML);

                        console.log("HTML final:", container.innerHTML);



        });


    }catch(error){


        console.error(
            "Erro ao carregar copies:",
            error
        );


        container.textContent =
            "Erro ao carregar copies.";


    }


}


async function carregarRegras(campanhaId){

    try {

        const response = await fetch(
                `http://localhost:3000/api/regras/${campanhaId}`

        );


        if(!response.ok){
            throw new Error("Erro ao buscar regras");
        }


        const regras = await response.json();


        renderizarRegrasCampanhaModalLegado(regras);


    } catch(error){

        console.error("Erro ao carregar regras:", error);

    }

}



function renderizarRegrasCampanhaModalLegado(regras) {

    const container = document.getElementById("modal-rules");


    if (!container) {
        console.warn("Container de regras legado não encontrado");
        return;
    }


    if (!regras.length) {

        container.innerHTML = `
            <p>Regras em breve.</p>
        `;

        return;

    }


    container.innerHTML = `

        ${regras.map((regra) => `

            <div class="rule-card">

                <h4>
                    ${regra.titulo}
                </h4>


                <p>
                    ${regra.descricao}
                </p>

            </div>

        `).join("")}

    `;

}


function paraLista(valor){


    if(Array.isArray(valor)) return valor;


    if(typeof valor === "string"){

        try{
            const parsed = JSON.parse(valor);
            return Array.isArray(parsed) ? parsed : [];
        }catch{
            return valor.trim() ? [valor] : [];
        }

    }


    return [];


}





function preencherModalCampanha(campanha){



    const imagem =
    document.querySelector("#modal-image");


    if(imagem){

        imagem.src =
            campanha.imagem_card
            ?? campanha.banner
            ?? "images/default.jpg";

    }





    const categoria =
    document.querySelector("#modal-category");


    if(categoria){

        categoria.textContent =
            campanha.categoria ?? "";

    }





    const titulo =
    document.querySelector("#modal-title");


    if(titulo){

        titulo.textContent =
            campanha.titulo ?? "";

    }





    const descricao =
    document.querySelector("#modal-description");


    if(descricao){

        descricao.textContent =
            campanha.descricao ?? "";

    }





    const resumo =
    document.querySelector("#modal-summary");


    if(resumo){

        resumo.textContent =
            campanha.resumo ?? "";

    }





    const premio =
    document.querySelector("#modal-prize");


    if(premio){

        premio.textContent = campanha.premio
            ? `Prêmio: ${campanha.premio}`
            : "";

    }





    const deposito =
    document.querySelector("#modal-deposit");


    if(deposito){

        deposito.textContent = campanha.deposito_minimo
            ? `Depósito mínimo: ${campanha.deposito_minimo}`
            : "";

    }





    const publico =
    document.querySelector("#modal-audience");


    if(publico){

        publico.textContent = campanha.publico_recomendado
            ? `Público: ${campanha.publico_recomendado}`
            : "";

    }





    const objetivo =
    document.querySelector("#modal-objective");


    if(objetivo){

        objetivo.textContent = campanha.objetivo
            ? `Objetivo: ${campanha.objetivo}`
            : "";

    }





    const cupom =
    document.querySelector("#modal-coupon");


    if(cupom){

        cupom.textContent =
            campanha.cupom ?? "Sem cupom";

    }





    const inicio =
    document.querySelector("#modal-start");


    if(inicio){

        inicio.textContent =
            formatarDataModal(
                campanha.data_inicio
            );

    }





    const fim =
    document.querySelector("#modal-end");


    if(fim){

        fim.textContent =
            formatarDataModal(
                campanha.data_fim
            );

    }





    const mecanica =
    document.querySelector("#modal-mechanics");


    if(mecanica){

        mecanica.innerHTML = "";


        paraLista(campanha.mecanica).forEach(item => {


            const li = document.createElement("li");
            li.textContent = item;
            mecanica.appendChild(li);


        });

    }





    const angulos =
    document.querySelector("#modal-angles");


    if(angulos){

        angulos.innerHTML = "";


        paraLista(campanha.angulos_divulgacao).forEach(item => {


            const card = document.createElement("div");
            card.className = "angle-card";


            const tituloAngulo = document.createElement("h4");
            tituloAngulo.textContent =
                item?.titulo ?? "";


            const descricaoAngulo = document.createElement("p");
            descricaoAngulo.textContent =
                item?.descricao ?? "";


            card.appendChild(tituloAngulo);
            card.appendChild(descricaoAngulo);
            angulos.appendChild(card);


        });

    }


}





function formatarDataModal(data){


    if(!data) return "";


    const partes = String(data).slice(0, 10).split("-");


    if(partes.length !== 3) return String(data);


    const [ano, mes, dia] = partes;


    return `${dia}/${mes}/${ano}`;


}





function fecharModalCampanha(){

    if (typeof fecharModal === "function") {
        fecharModal();
    }

    const modal =
    document.querySelector("#campaign-modal");


    if(modal){

        modal.classList.remove("active");
        document.body.style.overflow = "";

    }


}





document.addEventListener(
"DOMContentLoaded",
()=>{


    const fechar =
    document.querySelector("#modal-close");



    if(fechar){

        fechar.addEventListener(
            "click",
            fecharModalCampanha
        );

    }



    const modal =
    document.querySelector("#campaign-modal");



    if(modal){


        modal.addEventListener(
            "click",
            (evento)=>{


                if(evento.target === modal){

                    fecharModalCampanha();

                }


            }
        );


    }



   document.addEventListener(
    "click",
    (evento)=>{


        const botao = evento.target.closest(
            ".btn-abrir-campanha"
        );


        if(!botao) return;


        const id = botao.dataset.campanhaId;


        if(!id){
            console.warn(
                "Botão sem data-campanha-id"
            );
            return;
        }


        evento.preventDefault();


        abrirModalCampanha(id);


    }
);


    document.addEventListener(
"click",
(event)=>{


    const botao =
    event.target.closest(".tab-btn");


    if(!botao) return;



    const aba =
    botao.dataset.tab;



    document
    .querySelectorAll(".tab-btn")
    .forEach(btn=>{

        btn.classList.remove("active");

    });



    botao.classList.add("active");




    document
    .querySelectorAll(".tab-content")
    .forEach(content=>{

        content.classList.remove("active");

    });



    document
    .querySelector(`#${aba}`)
    .classList.add("active");



});


    document.addEventListener(
        "keydown",
        (evento)=>{


            if(evento.key !== "Escape") return;


            const modalAberto =
            document.querySelector(
                "#campaign-modal.active"
            );


            if(modalAberto){
                fecharModalCampanha();
            }


        }
    );


});
