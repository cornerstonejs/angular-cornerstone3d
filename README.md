# Angular + Cornerstone3D

This project uses [Angular CLI](https://github.com/angular/angular-cli) with Cornerstone3D for DICOM viewing. It can run at the site root or under a subpath (e.g. `/subpath/`).

## Build and run

### Main path (app at `/`)

- **Dev:** `npm start` or `npm run dev` → open http://localhost:4200/
- **Build:** `npm run build` → output in `dist/angular-vite-6/`
- **Preview:** `npm run preview` → builds then serves at http://localhost:4201/ (use this if dev server doesn’t load images)

### Subpath (app at `/subpath/`)

- **Dev:** `npm run dev:subpath` → open http://localhost:4200/subpath/
- **Build:** `npm run build:subpath` → output in `dist/angular-vite-6/` (asset URLs use `/subpath/`)
- **Preview:** `npm run preview:subpath` → builds for subpath then serves at http://localhost:4202/

For production, deploy the build from `build:subpath` to a server that serves the app under `/subpath/`.

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
npm run build:subpath
```

Build artifacts are in `dist/angular-vite-6/`. The production build optimizes your application for performance and speed.

## Preview (production build locally)

To build and serve the production output locally (useful when the dev server doesn’t load images or to test the real bundle):

```bash
npm run preview
```

Then open http://localhost:4201/. For a subpath build:

```bash
npm run preview:subpath
```

Then open http://localhost:4202/. The first run may prompt to install the `serve` package if needed.

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
