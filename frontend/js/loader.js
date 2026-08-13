(function () {
    const loader = document.getElementById("siteLoader");
    if (!loader) return;

    const html = document.documentElement;
    const MIN_MS = 1600;
    const MAX_MS = 4200;
    const startedAt = performance.now();

    html.classList.add("is-loading");

    const status = loader.querySelector(".site-loader__status");
    const messages = [
        "Preparando materiais",
        "Sincronizando campanhas",
        "Montando Partner Hub"
    ];
    let messageIndex = 0;

    const messageTimer = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        if (status) {
            status.innerHTML =
                `${messages[messageIndex]}<span class="site-loader__dots"></span>`;
        }
    }, 700);

    function finalizarLoader() {
        window.clearInterval(messageTimer);

        const elapsed = performance.now() - startedAt;
        const wait = Math.max(0, MIN_MS - elapsed);

        window.setTimeout(() => {
            loader.classList.add("is-done");
            loader.setAttribute("aria-busy", "false");
            html.classList.remove("is-loading");

            window.setTimeout(() => {
                loader.remove();
            }, 600);
        }, wait);
    }

    const failSafe = window.setTimeout(finalizarLoader, MAX_MS);

    window.addEventListener(
        "load",
        () => {
            window.clearTimeout(failSafe);
            finalizarLoader();
        },
        { once: true }
    );
})();
