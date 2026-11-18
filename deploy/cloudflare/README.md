# Deploying Alibi to Cloudflare

Alibi is served by a Cloudflare Worker named `alibi-game`: the built site (`dist/`) as static assets, plus a small script (`worker.js`) that guards the directories of files that change between builds.

## Read this first

> **Remove the old `murdoku` Workers Builds connection before this branch is merged to `main`.**
>
> If this repository is still connected to the existing `murdoku` Worker through Workers Builds, the merge will start a build there, and that build will not use the config in this folder. Measured with Wrangler 4.164.0: a bare `npx wrangler deploy --dry-run` at the repository root finds no config, detects the Vite project, names the Worker **`murdoku`** (from the `name` in `package.json`) and plans to install packages and write a config of its own. A real bare `wrangler deploy` there would therefore deploy this build to `murdoku` without the guard Worker. A CI setting can also override the `name` in any config. Disconnect the `murdoku` connection in the Cloudflare dashboard (Workers & Pages, the `murdoku` Worker, Settings, Builds) first. Connect `alibi-game` afterwards, if wanted, with the commands below.

The config is kept out of the repository root so that a tool looking for a root config cannot pick this one up by accident, but that is not isolation: the bare command above still works against whatever Worker its settings name. Always pass the config explicitly. The repository's literal `wrangler deploy --dry-run` no longer validates anything at the root (it stops at the auto-detection step); use `npm run deploy:cloudflare:dry-run`. Do not move the config back to the root. Renaming the package (`name` in `package.json`) would change which Worker a bare deploy targets, but not make it safe; that is an owner decision.

## Files

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker `alibi-game`, assets from `../../dist`, single-page-application fallback, `workers.dev` only, no routes or custom domains. |
| `worker.js` | Runs first for `/assets/*` and `/workbox-*` only (about 21 Worker invocations on a first visit). If the asset layer would answer one of those with the app shell, it returns `404` with `Cache-Control: no-store`. Everything else is served by the asset layer with the headers in `public/_headers`. |

Why the guard exists: Cloudflare answers any unknown path with `index.html` and status 200. For a page that is right. For a missing script it is not: the browser would receive HTML as a script and, because `/assets/*` is cached as immutable, keep it under that name for a year. After a rollback that makes the name valid again, the cached HTML would still be served.

Why only those paths: every request under a `run_worker_first` pattern invokes the Worker, and the precache downloads every model and sprite on a first visit (about 330 files). `/assets/*` is the only place a stale answer is dangerous, because it is cached as immutable; the guard covers it and the workbox helper (`/workbox-*`, which the service worker imports).

What is not guarded: a missing model under `/kenney3d/` or sprite under `/kenney/` is answered by the asset layer's single-page fallback, with the shell as `200 text/html` and the default `Cache-Control: public, max-age=0, must-revalidate`. It is revalidated on every use, never cached as immutable, and a model or sprite that exists is never replaced by it. Files listed in the precache are never requested under a name that does not exist. If a path is ever given an immutable cache rule in `public/_headers`, add it to `run_worker_first` in `wrangler.jsonc`; `tests/productionBuild.test.ts` fails until you do.

## Deploy

```bash
npm ci
npm run deploy:cloudflare:dry-run   # builds, then wrangler deploy --dry-run; changes nothing
npm run deploy:cloudflare           # builds, then deploys Worker alibi-game
```

Both scripts build first (`dist/` must exist) and pass `--config deploy/cloudflare/wrangler.jsonc`. To check which Worker a run targets, add `--outdir <absolute folder>` to the dry run: the `README.md` it writes there names the Worker (`alibi-game`).

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
