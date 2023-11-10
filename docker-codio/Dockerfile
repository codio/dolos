FROM node:20-alpine3.17

RUN apk --no-cache add python3 build-base

WORKDIR /dolos-app/lib/dist
COPY lib/dist .
WORKDIR /dolos-app/lib
COPY lib/package.json ./

WORKDIR /dolos-app/core/dist
COPY core/dist .
WORKDIR /dolos-app/core
COPY core/package.json ./

WORKDIR /dolos-app/web/dist
COPY web/dist .
WORKDIR /dolos-app/web
COPY web/package.json ./

WORKDIR /dolos-app/cli/dist
COPY cli/dist .
WORKDIR /dolos-app/cli
COPY cli/package.json ./

WORKDIR /dolos-app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production

RUN apk --no-cache del python3 build-base

EXPOSE 3000/tcp

WORKDIR /dolos
ENTRYPOINT [ "nice", "-n", "15", "node", "/dolos-app/cli/dist/cli.js" ]
