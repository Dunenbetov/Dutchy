# Single Railway service: Angular SPA + Nest API (same pattern as selling-tours).
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/ apps/
COPY packages/ packages/
COPY scripts/ scripts/

RUN npm ci \
  && npm run build -w @dutchy/shared \
  && API_URL=/api node scripts/generate-env.mjs \
  && npm run build -w @dutchy/frontend \
  && npm run build -w @dutchy/backend

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production \
    STATIC_DIR=/app/static

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/frontend/dist/frontend/browser ./static

EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
