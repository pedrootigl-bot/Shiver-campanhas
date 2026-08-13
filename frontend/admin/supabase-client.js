/**
 * Sessão admin do Shiver.
 * Login passa pelo backend (banco novo). Não usa chave do projeto antigo.
 */
const ADMIN_API = "http://localhost:3000";
const SESSION_KEY = "shiver_admin_session";

function lerSessao() {
    try {
        const bruto = window.localStorage.getItem(SESSION_KEY);
        return bruto ? JSON.parse(bruto) : null;
    } catch {
        return null;
    }
}

function salvarSessao(session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function limparSessao() {
    window.localStorage.removeItem(SESSION_KEY);
}

async function loginAdmin(email, password) {
    const resposta = await fetch(`${ADMIN_API}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok || !dados.session?.access_token) {
        const erro = new Error(dados.erro || "Login inválido");
        throw erro;
    }

    salvarSessao(dados.session);
    return dados;
}

async function logoutAdmin() {
    limparSessao();
}

/**
 * Redireciona para login se não houver sessão válida no projeto Shiver.
 */
async function requireAdminSession() {
    const session = lerSessao();

    if (!session?.access_token) {
        window.location.href = "login.html";
        return null;
    }

    const resposta = await fetch(`${ADMIN_API}/api/auth/me`, {
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (!resposta.ok) {
        limparSessao();
        window.location.href = "login.html";
        return null;
    }

    const dados = await resposta.json().catch(() => ({}));

    return {
        access_token: session.access_token,
        user: dados.user || null
    };
}

/**
 * Headers JSON com Bearer token da sessão admin.
 */
async function getAuthHeaders(extra = {}) {
    const session = lerSessao();
    const headers = {
        ...extra
    };

    if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
    }

    return headers;
}
