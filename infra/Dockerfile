# syntax=docker/dockerfile:1
# Production image of the Admin: the static build only, served by
# static-web-server on port 8080. Unknown paths return index.html, so the
# client routes load directly. The image does not route /api and sets no security
# header: Envoy sends /api/v1/ on the same origin to the backend and sets the
# headers and caching of the Admin (Backend 072).
# Build from the admin directory: docker build -f infra/Dockerfile .

FROM node:22.23.1-alpine3.24@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS build
WORKDIR /src
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
COPY docs/design-system/styles ./docs/design-system/styles
COPY docs/design-system/fonts ./docs/design-system/fonts
RUN npm run build

# The Alpine variant has wget, for the container health check (Backend 072). The deployment
# runs it as the admin UID (10003); the build files stay owned by root, read-only.
FROM joseluisq/static-web-server:2.44.1-alpine@sha256:2fe3e5c0a20691f23fb270338578c8d31b5f7a19abb308c4c1ec901a7eefbe2e
ENV SERVER_ROOT=/public \
    SERVER_PORT=8080 \
    SERVER_FALLBACK_PAGE=/public/index.html \
    SERVER_HEALTH=true
COPY --from=build /src/dist /public
EXPOSE 8080
