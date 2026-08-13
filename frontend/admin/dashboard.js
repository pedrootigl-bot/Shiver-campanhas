// Verifica se existe usuário logado
async function verificarUsuario(){

    const session = await requireAdminSession();

    if(!session){
        return;
    }

    console.log(
        "Usuário logado:",
        session.user.email
    );

    carregarStats();

}





// Busca estatísticas do sistema
async function carregarStats(){


    try{


        const resposta = await fetch(
            "http://localhost:3000/api/stats"
        );



        if(!resposta.ok){

            throw new Error(
                "Erro ao carregar estatísticas"
            );

        }



        const stats = await resposta.json();



        document.querySelector("#campanhas").textContent =
        stats.campanhas ?? 0;



        document.querySelector("#materiais").textContent =
        stats.materiais ?? 0;



        document.querySelector("#copies").textContent =
        stats.copies ?? 0;



        document.querySelector("#videos").textContent =
        stats.videos ?? 0;



    }catch(error){


        console.error(
            "Erro stats dashboard:",
            error
        );


    }

}




// Logout
const logoutBtn = document.querySelector("#logoutBtn");


if(logoutBtn){


    logoutBtn.addEventListener(
        "click",
        async ()=>{


            await logoutAdmin();


            window.location.href = "login.html";


        }
    );


}



verificarUsuario();
