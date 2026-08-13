document.addEventListener("DOMContentLoaded", () => {


    if(typeof carregarStats === "function"){

        carregarStats();

    }


    if(typeof carregarDestaque === "function"){

        carregarDestaque();

    }


    if(typeof iniciarAcoesDestaque === "function"){

        iniciarAcoesDestaque();

    }


    if(typeof iniciarKitMateriais === "function"){

        iniciarKitMateriais();

    }


    /* Animações de entrada/saída das seções */
    (function iniciarRevealSections(){
        const reduzirMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const secoes = document.querySelectorAll(
            [
                ".hero",
                ".stats",
                ".highlight",
                ".campaigns",
                ".calendar-section",
                ".support",
                ".footer"
            ].join(", ")
        );

        if(!secoes.length) return;

        secoes.forEach((secao, indice) => {
            secao.classList.add("reveal");

            if(indice > 0 && indice < 4){
                secao.classList.add(`reveal--delay-${Math.min(indice, 3)}`);
            }

            if(reduzirMotion){
                secao.classList.add("is-visible");
            }
        });

        if(reduzirMotion || !("IntersectionObserver" in window)){
            secoes.forEach((secao) => secao.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const el = entry.target;

                    if(entry.isIntersecting){
                        el.classList.add("is-visible");
                        el.classList.remove("is-leaving");
                        return;
                    }

                    if(el.classList.contains("is-visible")){
                        el.classList.remove("is-visible");
                        el.classList.add("is-leaving");
                    }
                });
            },
            {
                threshold: 0.16,
                rootMargin: "0px 0px -8% 0px"
            }
        );

        secoes.forEach((secao) => observer.observe(secao));
    })();


    const menuToggle = document.querySelector("#menu-toggle");
    const menu = document.querySelector(".navbar .menu");



    if(!menuToggle || !menu) return;



    function fecharMenu(){

        menu.classList.remove("active");

        menuToggle.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }



    function alternarMenu(){

        const aberto = menu.classList.toggle("active");

        menuToggle.classList.toggle(
            "active",
            aberto
        );

        menuToggle.setAttribute(
            "aria-expanded",
            String(aberto)
        );

    }



    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );


    menuToggle.setAttribute(
        "aria-controls",
        "navbar-menu"
    );


    menu.setAttribute(
        "id",
        "navbar-menu"
    );



    menuToggle.addEventListener(
        "click",
        (evento) => {

            evento.stopPropagation();

            alternarMenu();

        }
    );



    menu.querySelectorAll("a").forEach((link) => {

        link.addEventListener(
            "click",
            () => {

                fecharMenu();

            }
        );

    });



    document.addEventListener(
        "click",
        (evento) => {


            if(!menu.classList.contains("active")) return;



            const clicouDentro =
                menu.contains(evento.target)
                ||
                menuToggle.contains(evento.target);



            if(!clicouDentro){

                fecharMenu();

            }


        }
    );



    document.addEventListener(
        "keydown",
        (evento) => {


            if(evento.key === "Escape"){

                fecharMenu();

            }


        }
    );


});