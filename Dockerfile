# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS hub
WORKDIR /hub
COPY partner-hub/package.json partner-hub/package-lock.json ./
RUN npm ci
COPY partner-hub ./
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend
COPY --from=hub /hub/dist ./partner-hub/dist

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "server.js"]
