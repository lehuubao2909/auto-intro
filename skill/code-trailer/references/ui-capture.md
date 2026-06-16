# UI capture (local-first)

Real UI footage is the most persuasive beat. Because this is a local-first tool (the repo lives on
the user's machine and the app already runs there), capturing UI is tractable — unlike driving an
arbitrary stranger's app on a server. Get footage in this priority order:

## 1. Capture the running app (best)

If RepoFacts found a runnable web app (a `dev`/`start` script, a detected port, or a live URL):

- Start the app locally (run the detected dev command) **or** use the live/deployed URL if present.
- Drive a **local headless browser (Playwright)** to: load the app, perform a short, meaningful
  interaction (search, open an item, navigate 2–3 views), and record.
- Output both: a few **stills** (for `ui` scenes / Ken-Burns) and a trimmed **clip** (for `demo`).
- Keep interactions short and legible — one clear action per shot. Prefer seeded/sample data so the
  screen looks populated.
- Capture at the trailer's resolution (e.g. 1920×1080) or a clean device viewport; record at 30fps.

Detection hints for RepoFacts: `package.json` scripts (`dev`, `start`), framework (Next/Vite →
localhost:3000/5173), a `homepage`/`About` URL, README "Demo"/"Live" links.

## 2. Use repo screenshots (reliable fallback)

If the app can't be auto-run, look for existing images in `public/`, `assets/`, `docs/`,
`screenshots/`, or images referenced in the README (e.g. `public/screenshot.png`). Read them from the
local folder and use them as `ui` stills with subtle pan/zoom. Always available, zero risk.

## 3. Guided capture (when auto-run is flaky)

Let the user click through their app once while the local tool records (a macro). The director then
adds framing, captions, pacing, and music. Robust and still genuinely useful.

## 4. No UI (agents/APIs/CLIs)

Capture terminal output, a request→response sample, or render a results table as a graphics scene.
See `storytelling.md` no-UI fallback.

## Treating footage so it reads as "product"

- Round the corners; optionally wrap stills/clips in a soft browser or device frame so they read as
  a product, not a stray image.
- Pan/zoom stills gently (Ken-Burns): scale 1.0→1.06 over the scene with ease-out; never frantic.
- Keep essential UI within the safe zone; crop to the meaningful region rather than showing chrome.
- In Remotion, use `<OffthreadVideo>` for clips and `<Img>` for stills (mechanics: remotion-dev/skills).

## Privacy note

Footage and code stay on the machine. Only LLM calls (for analysis + storyboard) leave the device;
for public hackathon repos that's fine. Never send screenshots or source to a server you control.
