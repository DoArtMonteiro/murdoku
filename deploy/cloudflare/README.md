# Deploying Alibi to Cloudflare

Alibi is served by a Cloudflare Worker named `alibi-game`: the built site (`dist/`) as static assets, plus a small script (`worker.js`) that guards the directories of files that change between builds.

## Read this first

> **Remove the old `murdoku` Workers Builds connection before this branch is merged to `main`.**
>
> If this repository is still connected to the existing `murdoku` Worker through Workers Builds, the merge will start a build there. That build must not deploy this project over the old Worker, and a CI setting can override the `name` in a Wrangler config. Disconnect the `murdoku` connection in the Cloudflare dashboard (Workers & Pages, the `murdoku` Worker, Settings, Builds) first. Connect `alibi-game` afterwards, if wanted, with the commands below.

This is why there is no `wrangler.jsonc` at the repository root: a tool looking for a root config finds nothing and cannot pick this one up by accident. Always pass the config explicitly. Do not move it back to the root.

## Files

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker `alibi-game`, assets from `../../dist`, single-page-application fallback, `workers.dev` only, no routes or custom domains. |
| `worker.js` | Runs first for `/assets/*`, `/kenney3d/*`, `/kenney/*` and `/workbox-*`. If the asset layer would answer one of those with the app shell, it returns `404` with `Cache-Control: no-store`. Everything else is served by the asset layer with the headers in `public/_headers`. |

Why the guard exists: Cloudflare answers any unknown path with `index.html` and status 200. For a page that is right. For a missing script it is not: the browser would receive HTML as a script and, because `/assets/*` is cached as immutable, keep it under that name for a year. After a rollback that makes the name valid again, the cached HTML would still be served.

When you add a new top-level directory to `public/`, add it to `run_worker_first` in `wrangler.jsonc`. `tests/productionBuild.test.ts` fails until you do.

## Deploy

```bash
npm ci
npm run deploy:cloudflare:dry-run   # builds, then wrangler deploy --dry-run; changes nothing
npm run deploy:cloudflare           # builds, then deploys Worker alibi-game
```

Both scripts build first (`dist/` must exist) and pass `--config deploy/cloudflare/wrangler.jsonc`. To check which Worker a run targets, add `--outdir <folder>` to the dry run: the `README.md` it writes there names the Worker (`alibi-game`).

For Workers Builds on `alibi-game`, set the build command to `npm ci && npm run build` and the deploy command to `npx wrangler@4.164.0 deploy --config deploy/cloudflare/wrangler.jsonc`.

## Roll back

A deployment is a Worker version containing the assets of that build.

```bash
npx wrangler@4.164.0 versions list --config deploy/cloudflare/wrangler.jsonc
npx wrangler@4.164.0 rollback <version-id> --config deploy/cloudflare/wrangler.jsonc -m "reason"
```

or check out the previous commit and run `npm run deploy:cloudflare` again.

After a rollback, a tab that already has the newer build open keeps running it until it is reloaded; on the next visit the rolled-back service worker replaces the newer one (its file differs, so the browser installs it). If that tab asks for a file that no longer exists it gets a plain 404, never cached HTML, and the game shows its reload message.

## Check locally (nothing is uploaded)

```bash
npm run build
npx wrangler@4.164.0 dev --local --ip 127.0.0.1 --config deploy/cloudflare/wrangler.jsonc
```

Never use `--remote`.
