# Install

In root project directory run
```
yarn
```

In `lib/`
```
yarn build --force
```

In `web/`
```
yarn build
```

In `cli/`
```
yarn build --force
```


# Build

Build locally.

```
docker build --file ./docker-codio/Dockerfile -t codio/dolos --progress=plain .
```


