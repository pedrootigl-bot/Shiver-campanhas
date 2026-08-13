/**
 * UI compartilhada do admin Shiver.
 * Toast, sidebar categorizada e menu mobile.
 * Não altera autenticação nem APIs.
 */
(function initShiverAdminUI() {
    const PAGE = document.body?.dataset?.saasPage || inferPage();

    function inferPage() {
        const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
        if (file.includes("dashboard")) return "dashboard";
        if (file.includes("campanha-form")) return "campanhas";
        if (file.includes("campanha-detalhes")) return "campanhas";
        if (file.includes("campanhas")) return "campanhas";
        if (file.includes("materiais")) return "materiais";
        if (file.includes("copies")) return "copies";
        return "";
    }

    function toast(mensagem, tipo) {
        let host = document.querySelector(".saas-toasts");
        if (!host) {
            host = document.createElement("div");
            host.className = "saas-toasts";
            host.setAttribute("aria-live", "polite");
            document.body.appendChild(host);
        }

        const el = document.createElement("div");
        const kind = tipo === "ok" || tipo === "error" || tipo === "warn" ? tipo : "ok";
        el.className = `saas-toast saas-toast--${kind}`;
        el.textContent = String(mensagem || "");
        host.appendChild(el);

        window.setTimeout(() => {
            el.classList.add("is-out");
            window.setTimeout(() => el.remove(), 220);
        }, 2800);
    }

    function navHtml() {
        const active = (href) => (PAGE === href ? " is-active" : "");
        return `
            <a href="dashboard.html" class="admin-sidebar__brand">
                <span class="admin-sidebar__logo"><i class="fa-solid fa-s"></i></span>
                <strong>Shiver</strong>
            </a>
            <nav class="admin-sidebar__nav" aria-label="Menu admin">
                <span class="saas-nav-label">Visão geral</span>
                <a href="dashboard.html" class="${active("dashboard")}"><i class="fa-solid fa-gauge-high"></i><span>Dashboard</span></a>
                <span class="saas-nav-label">Campanhas</span>
                <a href="campanhas.html" class="${active("campanhas")}"><i class="fa-solid fa-bullhorn"></i><span>Campanhas</span></a>
                <a href="gerenciar-materiais.html" class="${active("materiais")}"><i class="fa-regular fa-image"></i><span>Materiais</span></a>
                <span class="saas-nav-label">Conteúdo</span>
                <a href="gerenciar-copies.html" class="${active("copies")}"><i class="fa-regular fa-file-lines"></i><span>Copies</span></a>
            </nav>
        `;
    }

    function mountSidebar() {
        let aside = document.querySelector(".admin-sidebar");
        if (!aside) return;
        aside.innerHTML = navHtml();

        if (!document.querySelector(".saas-nav-backdrop")) {
            const backdrop = document.createElement("div");
            backdrop.className = "saas-nav-backdrop";
            backdrop.addEventListener("click", fecharNav);
            document.body.appendChild(backdrop);
        }

        const topbar = document.querySelector(".admin-topbar, .admin-header");
        if (topbar && !document.querySelector(".saas-nav-toggle")) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "saas-nav-toggle";
            btn.setAttribute("aria-label", "Abrir menu");
            btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            btn.addEventListener("click", () => {
                document.body.classList.toggle("saas-nav-open");
            });
            topbar.prepend(btn);
        }
    }

    function fecharNav() {
        document.body.classList.remove("saas-nav-open");
    }

    window.ShiverUI = {
        toast,
        notifyOk: (msg) => toast(msg, "ok"),
        notifyError: (msg) => toast(msg, "error"),
        notifyWarn: (msg) => toast(msg, "warn")
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountSidebar);
    } else {
        mountSidebar();
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") fecharNav();
    });
})();
