/**
 * Atualiza a barra de indicadores (.stats)
 * Esperado do banco/API:
 * { campanhas, materiais, copies, videos }
 */

async function carregarStats() {

    console.log("carregarStats executou");

    try {

        const stats = await obterStats();

        console.log("Stats recebidos:", stats);

        atualizarStats(stats);


    } catch (err) {

        console.error("Erro ao carregar stats:", err);

    }

}

async function obterStats() {

    const resposta = await fetch(
        "http://localhost:3000/api/stats"
    );


    if (!resposta.ok) {

        throw new Error(
            "Erro ao buscar stats"
        );

    }


    return await resposta.json();

}


function atualizarStats(stats = {}) {

    const mapa = {

        campanhas: stats.campanhas,

        materiais: stats.materiais,

        "copies-count": stats.copies,

        videos: stats.videos

    };


    Object.entries(mapa).forEach(([id, valor]) => {

        const el = document.getElementById(id);

        if (el) {

            el.textContent = valor ?? 0;

        }

    });

}