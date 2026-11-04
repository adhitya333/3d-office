# Verlyn HQ — Interactive 3D Office

A walkable office with seven independent employees, built with React, TypeScript, Three.js, Vite and a Node backend. **GPT uses your ChatGPT sign-in through the official Codex CLI. Gemini uses your Antigravity sign-in. No provider API keys or OpenRouter are required.** Each employee has a saved model choice, separate conversation and role skill.

## Start the office

Requires Node.js 22.13+, npm, the official Codex CLI and the official Antigravity CLI on the computer running the backend.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`).
3. Run `codex login` and choose **Sign in with ChatGPT**. `codex login status` must report ChatGPT sign-in. Install/setup guidance: [official Codex CLI](https://developers.openai.com/codex/cli/) and [authentication](https://developers.openai.com/codex/auth/).
4. Launch `agy` and complete its official Google sign-in. Run `agy models` to confirm Gemini access.
5. Run `npm run dev` and open http://127.0.0.1:3000.
6. Open an employee panel → **Connection settings** → **Check connection**. The two sign-in buttons open the official interactive clients on a local Windows host when needed. Choose that employee's model in the same panel; the backend saves the choice across restarts.

The site does not collect your ChatGPT or Google password, scrape browser sessions, or copy provider credentials. Authentication stays in the official clients, including [Antigravity's credential storage](https://antigravity.google/docs/install). Each provider's local sign-in is shared by the relevant roles, so account usage limits are shared too. The ChatGPT bridge explicitly requires ChatGPT authentication and does not accept an API-key login.

For production run `npm run build`, then `npm start`. The Node server serves both the built site and its AI routes. The host must have the relevant clients installed and signed in. Publishing only `dist/` to a static host cannot run the employees. A GitHub push stores the source and does not deploy this backend.

## Models and images

Default assignment:

| Employees | Chat | Full tasks |
| --- | --- | --- |
| Adhi, Taha, Vaibav | GPT-6.1 Sol via ChatGPT sign-in | Same GPT model, medium reasoning |
| Abbu, Prox, Rewu, Ameen | Gemini 3.8 Flash Quick / low | Gemini 3.8 Flash Balanced / medium |

The picker supports GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Luna and the three Gemini 3.8 Flash reasoning variants **when listed by the connected official client**. Model catalogs and account entitlements can change; a listed model may still fail if plan limits or access restrictions apply. A saved choice stays saved if its provider disconnects. The office can use an available fallback for text, clearly marked in settings; the actual model appears under each reply. GPT-OSS through Antigravity is not used as ChatGPT GPT.

Every employee chat supports:

- **Attach image** for descriptions, visual review and visible-text extraction. Up to three PNG, JPEG or WebP references; large images are resized before upload. Unreadable text should be flagged rather than invented.
- **Create image** in the response-type selector for a real generated raster image, displayed in the reply with open/download controls. The backend verifies the generated artifact before returning it.

Image understanding and image generation use **Gemini through Antigravity**, including for employees assigned to GPT. Image generation depends on the account's image-tool access and can take longer than text. Images stay in ignored private backend storage, with access-controlled URLs; they are sent to the selected official provider only when included in a request. Keep `.office-data/` if you want saved image links and model choices to survive a server migration. There is no automatic media retention cleanup yet.

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

Antigravity runs in plan mode with its sandbox option and normal permission checks. ChatGPT runs as an ephemeral, read-only Codex CLI request with user integrations disabled. Requests supply the relevant conversation, role skill and project excerpts. Responses and deliverable content are real model output; an answer alone does not edit a repository, publish a site, send a message or change an external CRM.

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

The backend runs two or three requests concurrently across both providers, depending on host CPU capacity; additional requests wait. Normal chats use lower reasoning, concise prompts and bounded recent conversation context (up to 16 messages / 24,000 characters, always retaining the current request intact). Complete chat history stays saved locally. Role files/workspaces and successful connection checks are cached to avoid repeated setup; **Check connection** forces a fresh sign-in/model check. Restart the backend after editing role skills.

Gemini's visible answer deltas stream to the browser as they arrive. The current Codex CLI returns GPT's complete assistant message, which is displayed when ready. Reasoning and private diagnostics are never streamed. CLI startup, provider load, queue length and account limits affect response time. A live seven-employee mixed-provider connection check passed; this is not a latency guarantee.

The selected graphics tier stays saved and never changes automatically. Static geometry batching, shared food materials, cached shadows and static monitor textures reduce rendering work. Each employee has a different hairstyle. Sage, slate, clay, olive and ivory/walnut room palettes, carpet textures and baked environment lighting give the rooms distinct finishes without changing the chairs' geometry or seat locations. FPS still depends on device, resolution and scene load.

## Shared access and private data

Local development binds to 127.0.0.1. For a trusted phone/LAN preview or shared hosting, set `HOST=0.0.0.0`, `APP_ORIGIN` to the exact browser origin (including protocol and port), and `APP_ACCESS_TOKEN` to a unique password of at least 24 characters. For example the origin may be `http://192.168.1.10:3000` on a trusted local network. Use HTTPS for Internet hosting.

Visitors unlock the office with its separate access password; this does not sign them in to a provider. Native ChatGPT/Antigravity sign-in happens on the backend host, not a visitor's phone. Sessions use HttpOnly, SameSite cookies, expire after 12 hours and reset with the server. HTTPS sessions use Secure cookies.

- Provider credentials stay with the official CLI. They are not included in model arguments, browser responses, source or the static build.
- Runtime workspaces and logs live in ignored `.office-data/`. Vite denies access to that folder and environment files; production serves only `dist/`.
- Every private `.env.*` variant, dependencies, build output and private key files are ignored. Only the blank `.env.example` template is tracked.
- The backend validates employee IDs and requests, allowlists models, bounds runtime/concurrency, rate limits calls, rejects cross-origin requests and sanitizes diagnostics. No arbitrary shell command or provider URL can be supplied by the browser.

## Verify

Run `npm test`, `npm run build`, and `npm run verify:secrets`.

Checks cover 35 seats, supported feet and cushion heights, CEO desk/dining-table clearance, monitors, saved quality, hairstyle meshes after batching, coffee queues, simultaneous food collection, head-on hallway traffic, queued invitations during thinking, complete collect → sit → finish → return trips, each employee's routes, independent background work and failure recovery. Backend tests use fake providers: they check official protocol framing, ChatGPT-only authentication, private credentials/media, per-role skills/workspaces, saved model routing, image routing, bounded concurrency, answer streaming and sanitized failures without spending quota.

The seven skills also pass the Skill Creator frontmatter validator. Geometry and responsive layout checks do not replace testing on every physical device.
