FROM node:18-alpine3.16

RUN apk --no-cache add python3 build-base

WORKDIR /dolos-app/lib/dist
COPY lib/dist .
WORKDIR /dolos-app/lib
COPY lib/package.json ./
# RUN yarn build --force

WORKDIR /dolos-app/web/dist
COPY web/dist .
WORKDIR /dolos-app/web
COPY web/package.json ./
# RUN yarn build

WORKDIR /dolos-app/cli/dist
COPY cli/dist .
WORKDIR /dolos-app/cli
COPY cli/package.json ./
# RUN yarn build --force

WORKDIR /dolos-app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile

# RUN npm link 

RUN apk --no-cache del python3 build-base

EXPOSE 3000/tcp

WORKDIR /dolos
ENTRYPOINT [ "node", "/dolos-app/cli/dist/cli.js" ]
