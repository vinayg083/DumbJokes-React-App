# AGENTS.md — dumb-jokes

Guidance for AI agents and developers working on this repo. Keep it current when the stack or conventions change.

## Stack

- **Framework:** Create React App, `react-scripts` 3.4.1 (webpack 4, Babel, Jest). Not ejected.
- **UI:** React 16.13 with class components; plain CSS files imported per component (`Joke.css`, `JokeList.css`, `App.css`).
- **Data:** `axios` fetching random jokes from `https://icanhazdadjoke.com` (JSON via `Accept: application/json`). No backend of our own.
- **Persistence:** browser `localStorage` under the key `jokes` (array of `{ id, text, votes }`).
- **IDs:** `uuid/v4` (uuid 3.x). Note: `uuid` is not declared in `package.json`; it resolves through a transitive dependency of react-scripts. Add it explicitly before upgrading react-scripts.
- **Icons:** Font Awesome and the `em` emoji classes are expected to be loaded by `public/index.html` (CDN links), not via npm.
- **Package manager:** npm (`package-lock.json`). Node 22 is used in the sandbox.

## Structure

```
public/          static HTML shell, icons, manifest
src/index.js     entry; renders <App /> into #root
src/App.js       wraps <JokeList />
src/JokeList.js  fetches jokes, dedupes against seen jokes, sorts by votes, persists to localStorage
src/Joke.js      single joke row: up/down vote, vote color scale, emoji by score
src/*.css        component-scoped styles
```

## Scripts

```
npm start   dev server (react-scripts --openssl-legacy-provider start)
npm run build  production build into build/
npm test    Jest + Testing Library (watch mode locally; set CI=true for one-shot)
```

## Running on modern Node (important)

react-scripts 3.x bundles webpack 4, which hashes with MD4. Node 17+ ships OpenSSL 3, which rejects MD4 and crashes the dev server and build with `ERR_OSSL_EVP_UNSUPPORTED`. The `start` and `build` scripts therefore pass `--openssl-legacy-provider` to Node through the react-scripts launcher (it forwards any flags placed before the script name). Keep that flag until react-scripts is upgraded to 5.x.

The CRA dev server also exits silently when its stdin closes unless `CI=true` is set. Any detached or non-interactive launch (the Draftbit sandbox, containers, CI) must set `CI=true`. CRA reads the bind address and port from the `HOST` and `PORT` environment variables, not from CLI flags.

## Draftbit sandbox

- The preview server is started by the saved sandbox init script, not by the platform. It runs `CI=true HOST=0.0.0.0 PORT=23075 BROWSER=none npm start` detached, logging to `/tmp/preview-server.log`.
- To restart by hand: kill whatever holds port 23075, then relaunch with the command above via `setsid -f`.
- Deployment is handled through Draftbit's Publishing settings; do not add hostnames or deploy config to the repo.

## Conventions

- Extend the existing class-component and per-file CSS pattern; do not introduce a styling library or state manager for small changes.
- Keep `localStorage` as the persistence layer unless the user asks for a backend.
- Do not commit; the user saves work through Draftbit.
