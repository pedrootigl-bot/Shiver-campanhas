# Publicação de campanha no Partner Hub

Data: 13/08/2026

## Quando a confirmação existe

Só para campanha que **estava agendada** e teve a **data de início antecipada** para o período atual (a nova data faz a campanha “já estar valendo”).

O admin confirma se a mudança (data anterior → data de hoje/período atual) está correta. Só depois o status vira `ativa` e a campanha aparece no Partner Hub.

## Quando NÃO precisa confirmar

- Campanha agendada cuja data **não** foi trocada: no dia de `data_inicio` o status vira `ativa` sozinho.
- Campanha já `ativa`.
- Só `pronta_publicacao` (checklist completo) **não** publica no hub.

## Fluxo da antecipação

1. Campanha `agendada` (ex.: início 14/08).
2. Admin altera o início para o dia atual (ex.: 13/08).
3. Status **permanece** `agendada`. O scheduler **não** ativa.
4. Nos detalhes, com checklist completo, aparece **Confirmar nova data e ativar**.
5. Após o clique: `agendada` → `ativa` → Partner Hub.

Encerramento por `data_fim` continua automático.

## API

`POST /api/campanhas/:id/publicar` (admin autenticado)

- 400 se não houver antecipação de data pendente de confirmação
- 400 se houver pendências do checklist
- 400 se estiver encerrada

A pendência fica no histórico (`metadata.confirmacao_data_pendente`), sem coluna nova.

## Arquivos

- `backend/utils/campanhaStatus.js`
- `backend/services/campanhaHistorico.service.js`
- `backend/routes/campanhaRoutes.js`
- `backend/jobs/campanhas.job.js`
- `frontend/admin/campanha-detalhes.html` / `.js`
