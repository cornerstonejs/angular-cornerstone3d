# Angular + Cornerstone3D

This project uses [Angular CLI](https://github.com/angular/angular-cli) with Cornerstone3D 5.x for DICOM viewing. It can run at the site root or under a subpath (e.g. `/subpath/`).

## Install

The project uses **pnpm**, matching the Cornerstone3D 5.x monorepo:

```bash
pnpm install
```

`pnpm-workspace.yaml` sets `nodeLinker: hoisted` (as CS3D does). That is required here — the codec asset globs in `angular.json` and the helpers in `scripts/` read `@cornerstonejs/codec-*` and `@cornerstonejs/dicom-image-loader` out of the top level of `node_modules`, and those are transitive dependencies that pnpm's default isolated layout would not place there.

`postinstall` generates the browser artifacts the DICOM loader needs (see [Cornerstone assets](#cornerstone-assets)).

## Build and run

### Main path (app at `/`)

- **Dev:** `pnpm start` or `pnpm dev` → open http://localhost:4200/
- **Build:** `pnpm build` → output in `dist/angular-vite-6/`
- **Preview:** `pnpm preview` → builds then serves at http://localhost:4201/ (use this if dev server doesn’t load images)

### Subpath (app at `/subpath/`)

- **Dev:** `pnpm dev:subpath` → open http://localhost:4200/subpath/
- **Build:** `pnpm build:subpath` → output in `dist/angular-vite-6/` (asset URLs use `/subpath/`)
- **Preview:** `pnpm preview:subpath` → builds for subpath then serves at http://localhost:4202/subpath/

There are two ways to exercise the subpath, and they test different things: `dev:subpath` runs the Vite dev server with `baseHref` `/subpath/` (fast rebuilds, unbundled deps), while `preview:subpath` runs the real production bundle behind a static server that mirrors a deployment. Check both before trusting a subpath change.

Note that `dev` and `dev:subpath` both want port 4200, so a second one auto-selects the next free port — read the `➜ Local:` line for the URL it actually chose. In the dev server, requests to `/subpath/@fs/...` are normal: that is Vite's raw-filesystem route for pre-bundled dependencies out of `.angular/cache`. The worker and codec WASM are deliberately *not* served that way — they come from `/subpath/cs-dicom-loader/`, which is what makes them work in the production build too.

For production, deploy the build from `build:subpath` to a server that serves the app under `/subpath/`.

## Cornerstone assets

Cornerstone3D's DICOM image loader resolves its web worker and codec WASM with bare specifiers inside `new URL(...)`, which bundlers do not rewrite. Three `postinstall`/`prebuild` scripts deal with that:

- `scripts/bundle-dicom-worker.js` — bundles `decodeImageFrameWorker` into `public/cs-dicom-loader/`. The component registers that pre-bundled worker with `getWebWorkerManager()` before calling the loader's `init()`, so the loader keeps the working registration.
- `scripts/copy-codec-wasm.js` — copies the four codec `.wasm` files into one flat directory, `public/cs-dicom-loader/wasm/`.
- `scripts/install-node-stubs.js` — stubs the Node built-ins (`fs`, `path`, `url`) that the codec glue and `@kitware/vtk.js`'s XML dependency chain require.

The codec binaries are located at runtime by passing that directory to the loader as `wasmBasePath`:

```ts
dicomImageLoaderInit({
  maxWebWorkers: 1,
  wasmBasePath: new URL('cs-dicom-loader/wasm/', document.baseURI).href,
});
```

One root for every codec, resolved against `document.baseURI` so the same build works at the site root and under a subpath. This replaces an earlier workaround that rewrote the codec paths inside the built worker bundle.

> **`wasmBasePath` is not in a release yet.** It exists on the `feat/wasm-base-path` branch of Cornerstone3D. Until it ships, use `pnpm link:cs3d` (below) — otherwise decoding fails with `expected magic word 00 61 73 6d`, and `pnpm build` warns about it.

## Testing against a local Cornerstone3D build

`scripts/link-cs3d.js` points the app at a Cornerstone3D checkout so unreleased changes can be tested before they are published:

```bash
# in the Cornerstone3D checkout: build the package first
cd ../cornerstone3D/packages/dicomImageLoader && pnpm build:esm

# back here
pnpm link:cs3d                  # defaults to ../cornerstone3D
pnpm link:cs3d -- --repo /path/to/cornerstone3D
pnpm link:cs3d -- --packages core,tools,metadata,utils,dicom-image-loader
pnpm link:cs3d:status           # which build is each package using?
pnpm unlink:cs3d                # restore the published build
```

It replaces the `dist` directory of each package inside `node_modules` with a copy from the checkout, keeping the published one alongside as `dist.published-backup`. **Re-run it after each Cornerstone3D rebuild** — it copies rather than symlinks, because a symlinked `dist` makes the bundler resolve the loader's own dependencies out of the Cornerstone3D checkout, where this app's Node built-in stubs don't exist, and the build fails with `Could not resolve "fs"`. A `pnpm install --force` also restores the published build.

Because it is a copy, `dir`/`ls` on `node_modules/@cornerstonejs` shows an ordinary directory rather than a symlink — there is nothing to see there. Use `pnpm link:cs3d:status` to check the state, which reports a package as using the local build when the set-aside `dist.published-backup` is present:

```
@cornerstonejs/dicom-image-loader: LOCAL build (published 5.6.12 set aside in dist.published-backup)
@cornerstonejs/core: published 5.6.12
```

## Development server

To start a local development server (main path), run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project (main path):

```bash
ng build
```

To build for deployment under a subpath:

```bash
pnpm build:subpath
```

Build artifacts are in `dist/angular-vite-6/`. The production build optimizes your application for performance and speed.

## Preview (production build locally)

To build and serve the production output locally (useful when the dev server doesn’t load images or to test the real bundle):

```bash
pnpm preview
```

Then open http://localhost:4201/. For a subpath build:

```bash
pnpm preview:subpath
```

Then open http://localhost:4202/subpath/. This preview uses `scripts/preview-server.js`, which mirrors a real deployment: files and client-side routes are served under `/subpath/`, and anything outside it returns 404. The root preview fetches `serve` through `pnpm dlx` on first run.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
