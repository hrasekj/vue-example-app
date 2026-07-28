# GitHub Profile Viewer

A client-rendered Nuxt 4 application for browsing public GitHub profiles and repositories.

## Setup

```sh
pnpm install
```

## Development

```sh
pnpm dev
```

## Checks

```sh
pnpm test:unit
pnpm type-check
pnpm lint
pnpm build
```

## Static output

```sh
pnpm generate
```

Deploy `.output/public` and configure the host to serve the SPA fallback for dynamic profile URLs such as `/octocat`.
