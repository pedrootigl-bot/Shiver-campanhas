/**
 * Central de Notificações — Admin Shiver
 * Monta o sino no topbar/header e consome /api/notificacoes
 */
(function initCentralNotificacoes() {
    const API = "http://localhost:3000";
    let aberta = false;
    let carregando = false;
    let cache = [];

    function $(sel, root = document) {
        return root.querySelector(sel);
    }

    function escapar(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function tempoRelativo(iso) {
        const data = new Date(iso);
        if (Number.isNaN(data.getTime())) return "agora";

        const diffMs = Date.now() - data.getTime();
        const min = Math.floor(diffMs / 60000);
        if (min < 1) return "agora";
        if (min < 60) return `Há ${min} min`;

        const horas = Math.floor(min / 60);
        if (horas < 24) return `Há ${horas} hora${horas === 1 ? "" : "s"}`;

        const dias = Math.floor(horas / 24);
        if (dias === 1) return "Há 1 dia";
        if (dias < 30) return `Há ${dias} dias`;

        return data.toLocaleDateString("pt-BR");
    }

    function hostNotificacoes() {
        return (
            $(".admin-topbar__right")
            || $(".admin-header__actions")
            || null
        );
    }

    function montarMarkup() {
        const host = hostNotificacoes();
        if (!host || $("#adminNotifications")) return null;

        const wrap = document.createElement("div");
        wrap.className = "admin-notifications";
        wrap.id = "adminNotifications";
        wrap.innerHTML = `
            <button
                type="button"
                class="admin-notifications__bell"
                id="adminNotificationsBell"
                aria-label="Abrir notificações"
                aria-expanded="false"
                aria-controls="adminNotificationsPanel"
            >
                <i class="fa-regular fa-bell" aria-hidden="true"></i>
                <span class="admin-notifications__badge" id="adminNotificationsBadge" hidden>0</span>
            </button>

            <div
                class="admin-notifications__panel"
                id="adminNotificationsPanel"
                role="dialog"
                aria-label="Central de notificações"
                hidden
            >
                <div class="admin-notifications__header">
                    <strong>Notificações</strong>
                    <button type="button" class="admin-notifications__close" id="adminNotificationsClose" aria-label="Fechar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="admin-notifications__list" id="adminNotificationsList">
                    <p class="admin-notifications__empty">Carregando...</p>
                </div>
            </div>
        `;

        host.prepend(wrap);
        return wrap;
    }

    function atualizarBadge(qtd) {
        const badge = $("#adminNotificationsBadge");
        if (!badge) return;

        const n = Number(qtd) || 0;
        if (n <= 0) {
            badge.hidden = true;
            badge.textContent = "0";
            return;
        }

        badge.hidden = false;
        badge.textContent = n > 99 ? "99+" : String(n);
    }

    function iconeTipo(tipo) {
        const t = String(tipo || "").toLowerCase();
        if (t.includes("encerrada")) return "fa-solid fa-flag-checkered";
        if (t.includes("encerrando")) return "fa-solid fa-hourglass-half";
        if (t.includes("iniciada")) return "fa-solid fa-bolt";
        return "fa-regular fa-bell";
    }

    function renderLista(notificacoes) {
        const lista = $("#adminNotificationsList");
        if (!lista) return;

        cache = Array.isArray(notificacoes) ? notificacoes : [];

        if (!cache.length) {
            lista.innerHTML = `
                <p class="admin-notifications__empty">
                    Nenhuma notificação por enquanto.
                </p>
            `;
            return;
        }

        lista.innerHTML = cache.map((item) => {
            const lida = Boolean(item.lida);
            return `
                <article
                    class="admin-notifications__item${lida ? " is-read" : " is-unread"}"
                    data-id="${escapar(item.id)}"
                >
                    <div class="admin-notifications__item-icon" aria-hidden="true">
                        <i class="${iconeTipo(item.tipo)}"></i>
                    </div>
                    <div class="admin-notifications__item-body">
                        <div class="admin-notifications__item-top">
                            <strong>${escapar(item.titulo || "Notificação")}</strong>
                            ${lida ? "" : '<span class="admin-notifications__dot" title="Não lida"></span>'}
                        </div>
                        <p>${escapar(item.mensagem || "")}</p>
                        <div class="admin-notifications__item-meta">
                            <time>${escapar(tempoRelativo(item.created_at))}</time>
                            ${
                                lida
                                    ? '<span class="admin-notifications__status">Lida</span>'
                                    : `<button type="button" class="admin-notifications__mark" data-action="mark-read">
                                        Marcar como lida
                                       </button>`
                            }
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    async function carregarNotificacoes() {
        if (carregando) return;
        carregando = true;

        const lista = $("#adminNotificationsList");
        if (lista && !cache.length) {
            lista.innerHTML = `<p class="admin-notifications__empty">Carregando...</p>`;
        }

        try {
            const headers = typeof getAuthHeaders === "function"
                ? await getAuthHeaders()
                : {};

            const resposta = await fetch(`${API}/api/notificacoes`, {
                headers
            });

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || dados.error || "Não foi possível carregar as notificações."
                );
            }

            const notificacoes = Array.isArray(dados.notificacoes)
                ? dados.notificacoes
                : (Array.isArray(dados) ? dados : []);

            const naoLidas = Number.isFinite(Number(dados.nao_lidas))
                ? Number(dados.nao_lidas)
                : notificacoes.filter((n) => !n.lida).length;

            renderLista(notificacoes);
            atualizarBadge(naoLidas);
        } catch (error) {
            console.error("Erro ao carregar notificações:", error);
            const listaEl = $("#adminNotificationsList");
            if (listaEl) {
                listaEl.innerHTML = `
                    <p class="admin-notifications__empty is-error">
                        ${escapar(error.message || "Erro ao carregar notificações.")}
                    </p>
                `;
            }
        } finally {
            carregando = false;
        }
    }

    function abrirPainel() {
        const panel = $("#adminNotificationsPanel");
        const bell = $("#adminNotificationsBell");
        if (!panel || !bell) return;

        aberta = true;
        panel.hidden = false;
        bell.setAttribute("aria-expanded", "true");
        carregarNotificacoes();
    }

    function fecharPainel() {
        const panel = $("#adminNotificationsPanel");
        const bell = $("#adminNotificationsBell");
        if (!panel || !bell) return;

        aberta = false;
        panel.hidden = true;
        bell.setAttribute("aria-expanded", "false");
    }

    function togglePainel() {
        if (aberta) fecharPainel();
        else abrirPainel();
    }

    async function marcarLida(id) {
        try {
            const headers = typeof getAuthHeaders === "function"
                ? await getAuthHeaders({
                    "Content-Type": "application/json"
                })
                : { "Content-Type": "application/json" };

            const resposta = await fetch(
                `${API}/api/notificacoes/${id}/lida`,
                {
                    method: "PATCH",
                    headers
                }
            );

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || dados.error || "Não foi possível marcar como lida."
                );
            }

            cache = cache.map((item) =>
                String(item.id) === String(id)
                    ? { ...item, lida: true }
                    : item
            );

            renderLista(cache);
            atualizarBadge(cache.filter((n) => !n.lida).length);
        } catch (error) {
            console.error("Erro ao marcar notificação:", error);
            window.alert(error.message || "Erro ao marcar notificação como lida.");
        }
    }

    function ligarEventos(root) {
        $("#adminNotificationsBell", root)?.addEventListener("click", (event) => {
            event.stopPropagation();
            togglePainel();
        });

        $("#adminNotificationsClose", root)?.addEventListener("click", (event) => {
            event.stopPropagation();
            fecharPainel();
        });

        $("#adminNotificationsList", root)?.addEventListener("click", (event) => {
            const btn = event.target.closest('[data-action="mark-read"]');
            if (!btn) return;

            const item = btn.closest(".admin-notifications__item");
            const id = item?.dataset?.id;
            if (!id) return;

            marcarLida(id);
        });

        document.addEventListener("click", (event) => {
            if (!aberta) return;
            if (event.target.closest("#adminNotifications")) return;
            fecharPainel();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && aberta) {
                fecharPainel();
            }
        });
    }

    async function iniciar() {
        if (typeof requireAdminSession === "function") {
            const session = await requireAdminSession();
            if (!session) return;
        }

        const root = montarMarkup();
        if (!root) return;

        ligarEventos(root);
        await carregarNotificacoes();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
