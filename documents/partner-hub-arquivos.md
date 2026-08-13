# Partner Hub React — arquivos a criar no Shiver-Campanhas

Destino: pasta nova `partner-hub/` na raiz do repo.  
Não misturar com `frontend/` (admin e HTML público antigo ficam).

Origem da cópia: `C:\Users\felip\Downloads\materiais shiver\materiais shiver`

---

## 1. Pasta nova

```
partner-hub/
```

---

## 2. Copiar da origem (criar no destino)

### Config

- `partner-hub/package.json`
- `partner-hub/vite.config.ts`
- `partner-hub/tsconfig.json`
- `partner-hub/tsconfig.app.json`
- `partner-hub/tsconfig.node.json`
- `partner-hub/.oxlintrc.json`
- `partner-hub/index.html`

`package-lock.json` e `node_modules` **não** copiar. Depois: `npm install` dentro de `partner-hub`.

### Public

- `partner-hub/public/favicon.svg`
- `partner-hub/public/icons.svg`

SVGs de campanha em `public/campaigns/` são mock. Com a API, as imagens vêm do Storage. Copiar só se quiser fallback visual.

### `src` raiz

- `partner-hub/src/main.tsx`
- `partner-hub/src/App.tsx`
- `partner-hub/src/index.css`

### Types

- `partner-hub/src/types/campaign.ts`

### Lib (existentes)

- `partner-hub/src/lib/utils.ts`
- `partner-hub/src/lib/asset-download.ts`
- `partner-hub/src/lib/campaign-utils.ts`

### Hooks (existentes)

- `partner-hub/src/hooks/useClipboard.ts`
- `partner-hub/src/hooks/useCountdown.ts`
- `partner-hub/src/hooks/useBodyScrollLock.ts`

### Splash e efeitos

- `partner-hub/src/components/SplashScreen.tsx`
- `partner-hub/src/components/effects/ChromaticWaves.tsx`
- `partner-hub/src/components/effects/HoverExpand.tsx`
- `partner-hub/src/components/effects/RotatingText.tsx`
- `partner-hub/src/components/effects/SmokyText.tsx`
- `partner-hub/src/components/effects/CoverflowGallery.tsx`

### UI

- `partner-hub/src/components/ui/ActionButton.tsx`
- `partner-hub/src/components/ui/SoftButton.tsx`
- `partner-hub/src/components/ui/GlowButton.tsx`
- `partner-hub/src/components/ui/FadeIn.tsx`
- `partner-hub/src/components/ui/UnavailableMaterialDialog.tsx`

### Partner Hub (telas)

- `partner-hub/src/components/partner-hub/PartnerHeader.tsx`
- `partner-hub/src/components/partner-hub/ShiverHero.tsx`
- `partner-hub/src/components/partner-hub/HeroMaterialsSlider.tsx`
- `partner-hub/src/components/partner-hub/PartnerStats.tsx`
- `partner-hub/src/components/partner-hub/TodayRecommendation.tsx`
- `partner-hub/src/components/partner-hub/CampaignCoverflow.tsx`
- `partner-hub/src/components/partner-hub/EndingSoon.tsx`
- `partner-hub/src/components/partner-hub/MomentumBanner.tsx`
- `partner-hub/src/components/partner-hub/CampaignTimeline.tsx`
- `partner-hub/src/components/partner-hub/PersonalizedCampaignTeaser.tsx`
- `partner-hub/src/components/partner-hub/PartnerSupport.tsx`
- `partner-hub/src/components/partner-hub/CampaignDrawer.tsx`
- `partner-hub/src/components/partner-hub/CampaignOverview.tsx`
- `partner-hub/src/components/partner-hub/CampaignMaterials.tsx`
- `partner-hub/src/components/partner-hub/CampaignCopies.tsx`
- `partner-hub/src/components/partner-hub/CampaignRules.tsx`

### Reserva (existem na origem, a home atual não usa)

- `partner-hub/src/components/partner-hub/CampaignGrid.tsx`
- `partner-hub/src/components/partner-hub/CampaignCard.tsx`
- `partner-hub/src/components/partner-hub/CampaignFilters.tsx`
- `partner-hub/src/components/partner-hub/FeaturedCampaignHero.tsx`

---

## 3. Criar do zero (não existem na origem)

Ligação com a API do Shiver:

- `partner-hub/src/lib/api.ts` — fetch para `/api/campanhas`, materiais, copies, regras, stats, destaque, kits
- `partner-hub/src/lib/map-campaign.ts` — traduz snake_case da API para o tipo `Campaign`
- `partner-hub/src/hooks/useCampaigns.ts` — carrega lista + loading/erro
- `partner-hub/src/types/api.ts` — tipos crus da API (`ativa`, `agendada`, `pronta_publicacao`)
- `partner-hub/src/vite-env.d.ts` — `ImportMeta.env.VITE_API_URL`
- `partner-hub/.env.example` — `VITE_API_URL=http://localhost:3000`

Agregador no backend (evita N requests no front):

- `backend/routes/partnerHubRoutes.js` — `GET /api/partner-hub/campanhas` com campanha + materiais + copies + regras + ângulos + kit

Consulta:

- `documents/partner-hub-arquivos.md` (este arquivo)

---

## 4. Alterar (já existem — não criar)

- `partner-hub/src/App.tsx` — depois de copiar, trocar `campaigns.ts` pelo hook da API
- `partner-hub/vite.config.ts` — proxy `/api` → `http://localhost:3000`
- `backend/server.js` — CORS para a porta do Vite + registrar `partnerHubRoutes`
- `backend/.env` — incluir origem do Vite em `CORS_ORIGINS` (ex.: `http://localhost:5173`)

---

## 5. Não copiar / não criar

- `src/data/campaigns.ts` — mock; a API substitui
- `src/assets/vite.svg` e `src/assets/react.svg` — lixo do template
- `scripts/` — Python de logo, não entra no produto
- `imgs/` — vazia
- `node_modules/` e `dist/`
- `README.md` genérico do Vite

---

## 6. Não apagar no Shiver-Campanhas

- `frontend/admin/`
- `frontend/css/admin/`
- `backend/` (exceto o route novo e o ajuste de CORS)
- `frontend/index.html` e `frontend/js/` — só depois do React público no ar

---

## Árvore alvo

```
Shiver-Campanhas/
├── partner-hub/
│   ├── .env.example
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── vite-env.d.ts
│       ├── types/
│       │   ├── campaign.ts
│       │   └── api.ts
│       ├── lib/
│       │   ├── api.ts
│       │   ├── map-campaign.ts
│       │   ├── utils.ts
│       │   ├── asset-download.ts
│       │   └── campaign-utils.ts
│       ├── hooks/
│       │   ├── useCampaigns.ts
│       │   ├── useClipboard.ts
│       │   ├── useCountdown.ts
│       │   └── useBodyScrollLock.ts
│       └── components/
│           ├── SplashScreen.tsx
│           ├── effects/     (5 arquivos)
│           ├── ui/          (5 arquivos)
│           └── partner-hub/ (20 arquivos)
├── backend/routes/partnerHubRoutes.js
└── documents/partner-hub-arquivos.md
```
