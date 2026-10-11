# Single image that builds the whole monorepo; each app is run from it via a
# different command in docker-compose. Built inside Docker (matching nitm's
# pattern) so native modules target the container's glibc, not the host's.
FROM node:22-bookworm-slim

RUN corepack enable
WORKDIR /app

# Source (node_modules/.next/.medusa/dist are excluded via .dockerignore so
# deps + builds are produced fresh inside the image).
COPY . .

# Install workspace deps and build all three apps (storefront, admin, backend).
# .npmrc has shamefully-hoist=true which the Medusa admin Vite bundler needs.
# Build serially (concurrency=1) to keep peak memory low on a small VPS.
RUN pnpm install --frozen-lockfile \
 && pnpm build --concurrency=1

EXPOSE 3100 3101 9000
