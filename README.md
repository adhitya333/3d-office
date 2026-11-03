# Verlyn HQ — Interactive 3D Office

A walkable office for seven AI employees, built with React, TypeScript, Three.js and Vite. A Node backend keeps the OpenRouter provider key off the browser and out of the static build.

## Run locally

Requires Node.js 22.13+ and npm.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`).
3. Set `OPENROUTER_API_KEY` in the private `.env` file to enable live AI. Leave it blank to explore with offline sample responses.
4. Run `npm run dev` and open http://127.0.0.1:3000.

The development server includes the backend middleware. Restart it after changing environment settings. Provider keys are never entered in the browser.

## Production / shared office

Run `npm run build`, then `npm start`. The Node server serves both `dist/` and the API. A static-only host such as GitHub Pages cannot run the AI backend. Pushing to GitHub stores the source; it does not deploy this server.

By default the app binds to 127.0.0.1. To test on a phone over a trusted network or host a shared office, set:

- `HOST=0.0.0.0`
- `APP_ORIGIN` to the exact browser origin, including protocol and port (for example `http://192.168.1.10:3000` for local testing).
- `APP_ACCESS_TOKEN` to a unique password of at least 24 characters.

Use HTTPS behind a reverse proxy for Internet hosting. Visitors enter the office access password in an employee panel's **AI connection** settings. It is distinct from the provider API key. Sessions use HttpOnly, SameSite cookies, expire after 12 hours, and reset when the server restarts. HTTPS sessions also use Secure cookies.

## Controls

| Action | Keyboard / mouse |
| --- | --- |
| Move | W A S D / arrow keys |
| Look | Mouse / drag |
| Interact / food and drinks | E |
| Call an absent employee to their desk | C near their desk |
| Sit on a free chair or sofa | F |
| Stand / jump | Space |
| Open / close a nearby door | Q |
| Third person / comfortable first person | Scroll or V |
| Performance and saved quality | P or Performance |
| Fullscreen | Fullscreen button |
| Close a panel | Escape |

Controls stay visible at the top. Touch users have a movement pad, swipe camera and action buttons; landscape gives more room. The office menu retains directory, task board, project upload, 2D map, camera, reset, recall, audio and motion settings.

## Office and employee behavior

- Web & Search: Adhi, Abbu and Prox. AI & Systems: Vaibav and Taha. Growth: Rewaant. Executive Suite: Ameen.
- All 35 modeled seat positions are registered: the original 33 seats plus two seats on the new executive sofa. Occupied seats are reserved. Character poses follow cushion height and face the desk without rotating the seated body toward a conversation partner.
- Ameen has a broader, rounded silhouette, a wide upholstered executive chair, a walnut-accented lounge, a two-seat sofa and wall AC. Other chair models remain intact.
- Employees wait 8–15 minutes between breaks; Ameen waits three minutes longer. Coffee is 20% of break choices. At most two employees leave at once. The espresso station and waiting spots have exclusive reservations and physical clearance checks.
- Walking employees keep separation and find local furniture detours when a waypoint is blocked.
- Food and drinks remain available to the player and employees.

## Chat and work

Each employee has independent thinking, responding and task progress. Closing an employee panel does not abort an active request. A background indicator opens the employee's progress again, and completed replies and deliverables are saved locally. Drafts, tabs and scroll positions resume when reopening a panel.

The application must remain open for client-managed requests to finish. A full reload or closing the browser interrupts an in-flight request; unfinished replies are marked as interrupted on the next visit. This is not a durable server job queue. Chats, projects and deliverables are stored in that browser's local storage, not synchronized between devices.

With a configured backend, OpenRouter generates role-specific replies and deliverable content. These responses are not automatic repository edits, deployments, or external tool execution. Without a provider key, offline examples are demonstrations rather than live AI work.

## Quality and performance

Low, Medium and High are explicit saved profiles. The renderer never automatically overrides the selected tier. Profiles adjust render scale and shadows while preserving furniture geometry. Static geometry batching, cached shadows and static monitor textures reduce per-frame work. The performance panel reports measured FPS and render statistics; frame rate depends on device, browser, resolution and scene load.

## Secrets and backend boundaries

- Only the backend reads `OPENROUTER_API_KEY`. Browser requests go to same-origin `/api/ai/chat`; the server attaches credentials upstream.
- `.env`, every `.env.*` variant, private key files, build output and dependencies are ignored. Only the blank `.env.example` template is tracked.
- Never put secrets in `VITE_` or `PUBLIC_` variables. The client public prefix is explicitly restricted to `PUBLIC_`. [Vite documents why client-prefixed variables expose secrets](https://vite.dev/guide/env-and-mode#env-variables).
- Legacy browser-stored provider keys are removed on startup. API status returns connection state and model name only.
- The proxy pins the server-configured model, bounds output tokens and request size, limits request rate/concurrency, rejects cross-origin calls and sanitizes upstream error diagnostics. It has no arbitrary URL forwarding.
- The production server serves only `dist/` and refuses network hosting without an origin and strong office access password. Set production secrets with the hosting provider's secret manager or private environment, never in GitHub source.

## Verification

Run `npm test` and `npm run build`.

Regression checks cover seat anchors, feet and cushion heights, CEO tabletop clearance, monitor construction, saved quality, coffee reservations and queue spacing, every employee's round-trip route, seated chat orientation, concurrent background conversations, task progress, failure/reload recovery, authenticated proxy access, credential isolation, SSE streaming, model/token restrictions and sanitized errors. Backend tests use a fake provider and spend no API credits. Canvas geometry checks do not replace visual testing on physical devices.

## Source layout

- `src/config/office.config.ts`: rooms, employees, schedules, anchors and waypoint graph.
- `src/components/3d/`: building, furniture, avatars, collisions, rendering and camera.
- `src/components/ui/`: HUD, touch controls, employee panels and project/task tools.
- `src/services/employeeWorkManager.ts`: independent employee request lifecycle.
- `src/services/npcBrain.ts`, `navigation.ts`: activity, reservations and path following.
- `server/api.mjs`: server-only AI proxy, session access and request limits.
- `server/index.mjs`: production HTTP and static asset server.
- `scripts/`: regression and backend tests.
