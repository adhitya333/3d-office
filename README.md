# Verlyn HQ — Interactive 3D Office

A walkable office with seven Antigravity employees, built with React, TypeScript, Three.js, Vite and a Node backend. All seven use **Gemini 3.8 Flash**: quick chat uses `gemini-3.8-flash-low` with low reasoning; **Run as task** uses `gemini-3.8-flash-medium` with medium reasoning for full deliverables. Both choices are fixed on the backend, with no automatic fallback to another model or provider.

## Start the office

Requires Node.js 22.13+, npm and the official Antigravity CLI on the computer running the backend.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`).
3. Launch `agy` and complete its official Google sign-in. Run `agy models` to confirm access to both `gemini-3.8-flash-low` and `gemini-3.8-flash-medium`.
4. Run `npm run dev` and open http://127.0.0.1:3000.
5. Open an employee panel → **Connection settings** → **Check connection**. **Open Antigravity sign-in** opens the official interactive client on a local Windows host if sign-in is needed.

The site does not collect your Google password or store provider keys in the browser. Authentication stays in [Antigravity's official client and credential storage](https://antigravity.google/docs/install). A local sign-in can be shared by the seven roles; they have separate conversations, request state and workspaces.

For production run `npm run build`, then `npm start`. The Node server serves both the built site and its AI routes. The host must have Antigravity installed and signed in. Publishing only `dist/` to a static host cannot run the employees. A GitHub push stores the source and does not deploy this backend.

## Employee roles and skills

The server loads the employee's own skill for every request using [the manifest](agents/manifest.json).

| Employee | Scope | Skill |
| --- | --- | --- |
| Adhi | Web engineering, architecture, responsive implementation | [SKILL.md](.agents/skills/adhi-web-engineering/SKILL.md) |
| Abbu | Web design, UX, landing pages and conversion experience | [SKILL.md](.agents/skills/abbu-web-design/SKILL.md) |
| Prox | SEO, GEO, semantic content and search readiness | [SKILL.md](.agents/skills/prox-seo-geo/SKILL.md) |
| Rewu | Design, brand identity, typography and creative direction | [SKILL.md](.agents/skills/rewu-design-branding/SKILL.md) |
| Taha | CRM, ERP, data architecture and integrations | [SKILL.md](.agents/skills/taha-crm-systems/SKILL.md) |
| Vaibav | AI agents, automation and orchestration | [SKILL.md](.agents/skills/vaibav-ai-automation/SKILL.md) |
| Ameen | CEO oversight, prioritization, quality and optimization | [SKILL.md](.agents/skills/ameen-ceo-oversight/SKILL.md) |

Antigravity runs in plan mode with its sandbox option and normal permission checks, without a permission-bypass flag. Requests supply the relevant conversation and project excerpts. Responses and deliverable content are real model output; the office does not imply that an answer itself edited a repository, published a site, sent a message or changed an external CRM.

## Call an employee to the canteen

Open **Directory**, select the employee and click **Call to canteen** in their chat toolbar. You can also type **`/canteen`** or “come to the canteen” in their chat. These office commands run locally without spending a model request.

An invitation reserves a dining seat, then the employee collects food or coffee at an available pickup point, sits down, eats or drinks, finishes and returns to their desk. Invitations made while they are thinking/working or when places are full remain queued. At most two employees are on a break at once.

The right side of the canteen has a serving table with plated rice, pasta, salad, sandwiches, fruit and nuts, plus drinks and clean plates. Three spaced pickup positions have separate reservations. The dining table has collision bounds and correctly facing chairs. Table collision checks remain active during seat approaches. Coffee has separate waiting spots, and walkers route around people who occupy a waypoint.

Automatic breaks use independent, shorter random work periods, usually around 2–6 minutes, with a little extra variation for Ameen. Food and coffee visits use the same seated meal sequence. Lounge-only breaks remain available. Busy employees finish their work before taking a queued break.

## Controls

| Action | Control |
| --- | --- |
| Move | W A S D / arrows |
| Look | Mouse / drag |
| Interact / choose food and drinks | E |
| Call an absent employee to their desk | C near the desk |
| Invite an employee to the canteen | Employee panel → Call to canteen, or chat `/canteen` |
| Sit on a free chair or sofa | F |
| Stand / jump | Space |
| Nearby door | Q |
| Third person / comfortable first person | Scroll or V |
| Measured performance and saved Low / Medium / High | P or Performance |
| Fullscreen | Fullscreen button |
| Close a panel | Escape |

Keyboard controls stay at the top. Touch users have a movement pad, swipe camera and action buttons; landscape gives more room. The office menu retains directory, task board, project upload, 2D map, reset, camera, team recall, audio and motion settings. All 35 modeled seat positions remain usable when free. Ameen's executive room includes the wide chair, two-seat sofa, lounge table, walnut details and AC.

## Background work and storage

Each employee keeps independent thinking, responding and task progress. Closing their panel does not abort an active request; a background indicator reopens their progress. Replies, deliverables, drafts, tabs and scroll positions persist locally. Reloading the app or closing the browser interrupts in-flight client requests and unfinished replies are marked interrupted on return. This is not a durable server job queue or cross-device storage system.

Antigravity runs two or three requests concurrently, depending on host CPU capacity; additional requests wait. Normal chats use lower reasoning, concise prompts and bounded recent conversation context (up to 16 messages / 24,000 characters, always retaining the current request intact). Complete chat history stays saved locally. Role files/workspaces and successful connection checks are cached to avoid repeated setup; **Check connection** forces a fresh sign-in/model check. Restart the backend after editing role skills.

Visible answer deltas stream from the CLI to the browser as soon as they arrive; the backend no longer waits for the complete answer before displaying text. Reasoning and private diagnostics are never streamed. CLI startup, provider load and account limits still affect response time.

The selected graphics tier stays saved and never changes automatically. Static geometry batching, shared food materials, cached shadows and static monitor textures reduce rendering work. FPS still depends on device, resolution and scene load.

## Shared access and private data

Local development binds to 127.0.0.1. For a trusted phone/LAN preview or shared hosting, set `HOST=0.0.0.0`, `APP_ORIGIN` to the exact browser origin (including protocol and port), and `APP_ACCESS_TOKEN` to a unique password of at least 24 characters. For example the origin may be `http://192.168.1.10:3000` on a trusted local network. Use HTTPS for Internet hosting.

Visitors unlock the office with its separate access password; this does not sign them in to Google. Native Antigravity sign-in must happen on the backend host, not a visitor's phone. Sessions use HttpOnly, SameSite cookies, expire after 12 hours and reset with the server. HTTPS sessions use Secure cookies.

- Provider credentials stay with the official CLI. They are not included in model arguments, browser responses, source or the static build.
- Runtime workspaces and logs live in ignored `.office-data/`. Vite denies access to that folder and environment files; production serves only `dist/`.
- Every private `.env.*` variant, dependencies, build output and private key files are ignored. Only the blank `.env.example` template is tracked.
- The backend validates employee IDs and requests, pins the model, bounds runtime/concurrency, rate limits calls, rejects cross-origin requests and sanitizes diagnostics. No arbitrary shell command or provider URL can be supplied by the browser.

## Verify

Run `npm test`, `npm run build`, and `npm run verify:secrets`.

Checks cover 35 seats, supported feet and cushion heights, CEO desk/dining-table clearance, monitors, saved quality, coffee queues, simultaneous food collection, queued invitations during thinking, complete collect → sit → finish → return trips, table blocking, each employee's routes, independent background work and failure recovery. Backend tests use a fake CLI: they check official protocol framing, authentication, private credentials, per-role skills/workspaces, fixed chat/task model selection, bounded concurrency, answer text arriving before completion, and sanitized stream failures without spending quota.

The seven skills also pass the Skill Creator frontmatter validator. Geometry and responsive layout checks do not replace testing on every physical device.
