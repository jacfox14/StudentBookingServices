# Build context is the repo root so workspace installs and @shared alias work.
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci

COPY shared ./shared
COPY client ./client

ENV VITE_USE_MSW=false
# Skip `tsc -b` (client/tsconfig.json uses an ignoreDeprecations value the
# pinned TS version rejects); vite/esbuild handles the TS transform itself.
RUN npm --workspace client exec -- vite build

FROM nginx:alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80
