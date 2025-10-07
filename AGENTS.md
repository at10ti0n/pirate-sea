# Repository Guidelines

## Project Structure & Module Organization
Core gameplay scripts live at the repo root: `game.js` coordinates flow, with `map.js`, `player.js`, `entities.js`, `fog.js`, `ui.js`, and `resource-manager.js` handling terrain, actors, visibility, interaction, and gathering. Browser surface files (`index.html`, `styles.css`) sit beside them, while `server.js` serves the bundle through Express. Tests follow the `test-*.js` convention in the root, and `web-bundles/` contains packaged agent, expansion, and team assets used for distribution experiments.

## Build, Test, and Development Commands
Install once with `npm install`. Start the web server via `npm start` (alias `npm run web`), which binds to `PORT` or defaults to `5000`. Use `npm run dev` for nodemon-powered reloads during editing. Launch the ASCII terminal build with `npm run terminal` or `node terminal-game.js --seed=<value>` for deterministic runs. Execute regression checks with targeted scripts like `node test-integration.js`, `node test-gathering.js`, and `node test-cross-platform-consistency.js`.

## Coding Style & Naming Conventions
Code is CommonJS with ES2015 classes. Prefer four spaces for indentation, `const`/`let` bindings, single quotes, and camelCase identifiers; reserve PascalCase for classes such as `PirateSeaGame`. File names stay kebab-case (`resource-manager.js`). Keep console logging informative and use comments sparingly to clarify complex control flow or maths.

## Testing Guidelines
Each `test-*.js` file is a standalone Node script that should exit cleanly after printing status lines. Write new coverage by cloning an existing harness, naming it for the capability under test, and seeding randomness to stabilise outputs. Before submitting changes, run the integration and gathering suites plus any scripts relevant to your edits, and record command/output pairs for review.

## Commit & Pull Request Guidelines
Follow the emerging conventional-commit style: `feat:`, `fix:`, `chore:`, `docs:`, etc., with concise imperatives under ~72 characters. Keep unrelated work in separate commits. Pull requests need a problem statement, bullet summary, manual test evidence (commands plus results), and links to issues or design docs. Add screenshots or GIFs whenever UI behaviour shifts, and call out configuration tweaks such as non-default `PORT` values.

## Security & Configuration Notes
The Express server enables broad CORS and listens on all interfaces; confirm firewall rules before sharing builds. Configure runtime behaviour with environment variables (`PORT`, `NODE_ENV`) rather than editing source, and never commit credentials or private map seeds.
