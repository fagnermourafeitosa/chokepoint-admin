# syntax=docker/dockerfile:1
# Production image of the Admin: the static build only, served by
# static-web-server on port 8080. Unknown paths return index.html, so the
# client routes load directly. The image does not route /api: the deployment
# sends /api on the same origin to the backend.
# Build from the admin directory: docker build -f infra/Dockerfile .

FROM node:22.23.1-alpine3.24 AS build
WORKDIR /src
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
COPY docs/design-system/styles ./docs/design-system/styles
COPY docs/design-system/fonts ./docs/design-system/fonts
RUN npm run build

FROM joseluisq/static-web-server:2.44
ENV SERVER_ROOT=/public \
    SERVER_PORT=8080 \
    SERVER_FALLBACK_PAGE=/public/index.html
COPY --from=build /src/dist /public
EXPOSE 8080
