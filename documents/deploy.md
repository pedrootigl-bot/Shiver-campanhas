# Subir o Shiver-Campanhas no ar

Data: 14/08/2026

O site inteiro (Partner Hub + admin + API) sobe **num único endereço**.

- `https://seu-link/` → Partner Hub
- `https://seu-link/admin/` → painel
- `https://seu-link/api/health` → teste da API

O banco continua no **Supabase**. O host só roda o Node.

Desenvolvimento local **não muda**: API na porta 3000 e `npm run dev` no `partner-hub`.

---

## O que você precisa ter

1. Conta no [GitHub](https://github.com) com este projeto (se ainda não estiver lá, envie a pasta).
2. Conta no [Render](https://render.com) (recomendado na primeira vez) **ou** [Railway](https://railway.app).
3. As chaves do Supabase (as mesmas do `backend/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

Nunca publique a `SERVICE_ROLE` no chat, no GitHub ou no Partner Hub. Só no painel do host.

---

## Render (passo a passo)

1. Entre em [render.com](https://render.com) e faça login (pode ser com GitHub).
2. **New** → **Web Service** → ligue o repositório `Shiver-Campanhas`.
3. Se pedir, escolha:
   - **Root Directory:** vazio (raiz do repo)
   - **Runtime:** Docker (ele lê o `Dockerfile`)
4. Em **Environment** / **Environment Variables**, cadastre:

| Nome | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | a URL do projeto Shiver |
| `SUPABASE_ANON_KEY` | a chave **anon public** |
| `SUPABASE_KEY` | a mesma anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave **service_role** |
| `PUBLIC_APP_URL` | deixe vazio no primeiro deploy; depois cole o `https://....onrender.com` |

5. Clique em **Deploy** / **Create Web Service**.
6. Espere o build (pode levar 5–10 minutos na primeira vez).
7. Abra o link que o Render mostrar.

Teste:

- `/` abre o Partner Hub
- `/admin/login.html` abre o login
- `/api/health` mostra `{"ok":true,...}`

Depois do primeiro deploy, copie a URL pública, cole em `PUBLIC_APP_URL` e faça um novo deploy (ou Save).

---

## Railway (alternativa)

1. Entre em [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**.
2. Escolha o repositório. O `Dockerfile` na raiz é detectado.
3. Em **Variables**, cole as mesmas chaves da tabela acima.
4. O `PORT` o Railway preenche sozinho. Não force 3000 se o painel já definir `PORT`.
5. Abra o domínio gerado em **Settings → Networking → Generate Domain**.

---

## Se algo falhar

- **Tela branca no hub:** o build do `partner-hub` não entrou na imagem. Veja o log do Docker (`npm run build`).
- **Login admin não entra:** `SUPABASE_ANON_KEY` ou `SUPABASE_URL` errados.
- **API 500 no public-config:** falta `SUPABASE_ANON_KEY` no host.
- **Upload/histórico quebrados:** falta `SUPABASE_SERVICE_ROLE_KEY`.
- **CORS:** no mesmo domínio isso quase não aparece. Se aparecer, preencha `PUBLIC_APP_URL` com `https://...` sem barra no final.

---

## Provar na sua máquina (opcional)

No PowerShell, na raiz do projeto:

```powershell
cd partner-hub
npm ci
npm run build
cd ..\backend
node server.js
```

Abra `http://localhost:3000` (hub) e `http://localhost:3000/admin/login.html` (admin).

---

## Arquivos deste empacotamento

- `backend/servePublico.js` — entrega o hub e o admin
- `backend/server.js` — `/api/health` + CORS de produção
- `Dockerfile` — build do hub + API num container
- `render.yaml` — dica para o Render
- `package.json` na raiz — `npm run build` / `npm start`
