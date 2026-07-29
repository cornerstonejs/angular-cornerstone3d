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

For production, deploy the build from `build:subpath` to a server that serves the app under `/subpath/`.

## Cornerstone assets

Cornerstone3D's DICOM image loader resolves its web worker and codec WASM with bare specifiers inside `new URL(...)`, which bundlers do not rewrite. Two `postinstall`/`prebuild` scripts work around that, the same way CS3D's own example builds do with webpack `resolve.fallback`:

- `scripts/bundle-dicom-worker.js` — bundles `decodeImageFrameWorker` into `public/cs-dicom-loader/`, rewriting each `@cornerstonejs/codec-*` wasm specifier to a served path. It fails the build if a specifier it expects is gone, so a Cornerstone upgrade cannot silently produce a broken worker.
- `scripts/copy-codec-wasm.js` — copies the four codec `.wasm` files to the paths that rewrite points at.
- `scripts/install-node-stubs.js` — stubs the Node built-ins (`fs`, `path`, `url`) that the codec glue and `@kitware/vtk.js`'s XML dependency chain require.

The component registers that pre-bundled worker with `getWebWorkerManager()` before calling the loader's `init()`, so the loader keeps the working registration.

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
