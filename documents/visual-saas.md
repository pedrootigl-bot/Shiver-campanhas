# Evolução visual SaaS — Shiver Admin

Data: 13/08/2026

Camada de apresentação. APIs, banco, autenticação, `pronta_publicacao` e lógica de upload/download **não** foram recriadas.

O site público continua com a paleta premium descrita em `documents/visual-premium.md`. Este documento cobre o painel administrativo.

## Design system

Arquivo: `frontend/css/admin/admin-saas.css`

- Fundo: `#07090f`
- Superfície: `#0e121b` / `#141925`
- Texto: `#f2f0ea` · secundário: `#9a958c`
- Marca (destaque): `#6d8fd4`
- Champagne (apoio): `#c9b07a`
- Tipografia: Exo 2 (títulos e números), Montserrat (labels/botões), Poppins (corpo)
- Status: Ativa, Em preparação, Encerrada, Pronta, Pendente — badges discretos

UI compartilhada: `frontend/admin/admin-ui.js`

- Toast único (`ShiverUI.toast / notifyOk / notifyError / notifyWarn`)
- Sidebar por categorias, só com páginas existentes
- Menu mobile com overlay

## Navegação

**Visão geral** — Dashboard  
**Campanhas** — Campanhas, Materiais  
**Conteúdo** — Copies  

Calendário, Kits, Regras, Notificações e Configurações **não** receberam páginas novas (evita links mortos). Notificações seguem no sino do admin.

## Páginas

| Página | Resultado |
|---|---|
| Dashboard | Métricas executivas + Atenção, via `GET /api/campanhas` e `GET /api/stats` |
| Campanhas | Board, empty state, toast ao excluir |
| Detalhes | Workspace: ações, contagens, checklist de `pronta_publicacao`, kit completo |
| Formulário | Sidebar, toasts, “Salvando...” / “✓ Alterações salvas”, dropzone |
| Materiais | Abas Stories / Feed / Vídeos / Banners, upload visual, deep link `?id=` |
| Copies | Toasts, empty states, “Salvando...”, deep link `?id=` |
| Login | Tipografia e botão alinhados ao design system |

## Regras preservadas

- Publicação: coluna e validação existentes (`pronta_publicacao` + pendências da API)
- Upload: `POST /api/upload`
- Download de kit: rota já existente
- Sem APIs duplicadas e sem alteração de banco

## Arquivos principais

- `frontend/css/admin/admin-saas.css`
- `frontend/admin/admin-ui.js`
- `frontend/admin/dashboard.html` / `dashboard.js`
- `frontend/admin/campanhas.html` / `campanhas.js`
- `frontend/admin/campanha-detalhes.html` / `campanha-detalhes.js`
- `frontend/admin/campanha-form.html` / `campanha-form.js`
- `frontend/admin/gerenciar-materiais.html` / `gerenciar-materiais.js`
- `frontend/admin/gerenciar-copies.html` / `gerenciar-copies.js`
- `frontend/admin/login.html`
- `frontend/admin/notificacoes-admin.js`
