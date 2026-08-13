const form = document.querySelector("#loginForm");

const mensagem = document.querySelector("#loginMessage");



if(form){


    form.addEventListener("submit", async (e)=>{


        e.preventDefault();


        const email = document.querySelector("#email").value.trim();

        const password = document.querySelector("#password").value;



        mensagem.textContent =
        "Entrando...";



        try{


            await loginAdmin(email, password);



            mensagem.textContent =
            "Login realizado!";



            setTimeout(()=>{


                window.location.href =
                "dashboard.html";


            },500);



        }catch(error){


            console.error(
                "Erro inesperado:",
                error
            );


            mensagem.textContent =
            error && error.message === "Login inválido"
                ? "Login inválido"
                : "Erro ao conectar com servidor";


        }



    });


}else{


    console.error(
        "Formulário #loginForm não encontrado"
    );


}
