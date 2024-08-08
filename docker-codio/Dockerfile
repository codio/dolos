FROM node:18-alpine3.16

RUN apk --no-cache add python3 build-base

WORKDIR /dolos-app/core/dist
COPY core/dist .
WORKDIR /dolos-app/core
COPY core/package.json ./

WORKDIR /dolos-app/lib/dist
COPY lib/dist .
WORKDIR /dolos-app/lib
COPY lib/package.json ./

WORKDIR /dolos-app/web/dist
COPY web/dist .
WORKDIR /dolos-app/web
COPY web/package.json ./
COPY web/index.js ./
COPY web/index.d.ts ./

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

RUN apk --no-cache add tar zstd

WORKDIR /
ADD https://static-assets.codio.com/internal-tools/linux-amd64/s3-task-runner /s3-task-runner
RUN chmod +x /app/s3-task-runner

WORKDIR /dolos
ENTRYPOINT [ "nice", "-n", "15", "node", "/dolos-app/cli/dist/cli.js" ]
