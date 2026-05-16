# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.2.0 (2026-05-16)

### Features

* migrate from Vercel to self-hosted VPS with Docker + GHCR CI/CD ([...](https://github.com/bayoehafiz/mamita-order/commit/...))
* schema isolation in shared Supabase project (`mamita` schema) ([...](https://github.com/bayoehafiz/mamita-order/commit/...))
* add Watchtower auto-deploy from GHCR ([...](https://github.com/bayoehafiz/mamita-order/commit/...))
* add Nginx reverse proxy with HSTS + security headers ([...](https://github.com/bayoehafiz/mamita-order/commit/...))
* multi-stage Docker build with Next.js standalone output ([...](https://github.com/bayoehafiz/mamita-order/commit/...))

### Bug Fixes

* prevent Next.js build-time process.env capture by moving reads inside functions ([...](https://github.com/bayoehafiz/mamita-order/commit/...))
* pass all env vars as Docker build args to avoid undefined build trace ([...](https://github.com/bayoehafiz/mamita-order/commit/...))
* fix Watchtower Docker API version compatibility ([...](https://github.com/bayoehafiz/mamita-order/commit/...))

### 0.1.1 (2026-04-10)


### Features

* setup deployment and git versioning strategy ([468a818](https://github.com/bayoehafiz/mamita-order/commit/468a818ae3357bb9ca55b8b887ba01eeb45de2ca))


### Bug Fixes

* make 'Rp' prefix optional in parsePriceFromLabel to prevent missing WA totals ([9ab3b84](https://github.com/bayoehafiz/mamita-order/commit/9ab3b84b7415a266ea4026c473ae28eed5b8e1ee))
* trim ADMIN_PIN to handle accidental whitespace in environment variables ([5670514](https://github.com/bayoehafiz/mamita-order/commit/5670514985308e05c7a06dc81611bbbf20b57505))
