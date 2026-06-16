# AutoDemo Code Review — 2026-06-15

Scope: all `src/` (40 files, ~2630 LOC). Static review; build typechecks, pipeline verified e2e per brief.
Focus: security (secret scrubbing, command injection, path traversal, video leaks), correctness (process teardown, repair loop, validator, media resolution, SSE concurrency), robustness, quality.

Overall: solid, well-commented, KISS architecture. Secret-handling and fallback chains are deliberate and mostly correct. No Critical security holes that leak secrets into the rendered video under normal use. Main risks are command-injection trust boundary (by design but undocumented), an orphan-process edge, and a few scrubbing gaps.

## TOP 3 MUST-FIX

1. **Command injection / arbitrary code exec via `devCommand` + `shell:true`** — `run-app.ts:35`. `npm run dev`/`npm run start` are spawned with `shell:true`. The command itself is hardcoded ("npm run dev"), so the injection vector is the repo's own `package.json` `scripts.dev` (npm executes it). This is *inherent* to "run the target app" but is an unguarded trust boundary: pointing AutoDemo at an untrusted repo runs that repo's dev script with the user's full env (`...process.env` passed at line 40, incl. `GEMINI_API_KEY`). Fix: (a) document that AutoDemo runs untrusted repo code; (b) strip sensitive vars from the child env (don't forward `GEMINI_API_KEY`/`GOOGLE_API_KEY` — the dev server never needs them); (c) consider a confirmation gate before auto-running.

2. **Orphan dev-server when not detached on group / cross-platform kill** — `run-app.ts:43-55`. `process.kill(-child.pid)` kills the process *group*, which requires `detached:true` (set, good) AND that the child became a group leader. If `spawn` fails synchronously or the shell wrapper reparents, the negative-PID kill throws and falls back to `child.kill()` which only kills the shell, not the framework/node grandchildren → orphan dev server holding the port. Also no `child.on("error")` handler: a spawn error (ENOENT) becomes an unhandled error event, not a rejected promise — `waitForServer` just times out 45s later. Fix: add `child.on("error")` → reject early; on teardown, after SIGTERM escalate to SIGKILL on the group after a grace timeout.

3. **Child env forwards API keys to untrusted app** — `run-app.ts:40` (same root as #1, called out separately because it's a concrete data-leak path). `env: { ...process.env, ... }` hands `GEMINI_API_KEY`/`GOOGLE_API_KEY` to the spawned repo. A malicious or compromised dev script can exfiltrate them. Fix: build an explicit minimal env (PATH, HOME, BROWSER, PORT, maybe NODE_ENV) instead of spreading `process.env`.

## Critical
None beyond TOP 3.

## High

- **Secret scrubbing: README never scrubbed before reaching Gemini** — `triage-and-summarize.ts:54` DOES scrub picked files (incl. README) — good. But `scrubSecrets` is keyword/shape based; a README often contains example tokens or real leaked creds in prose that don't match `KEY=`/known-prefix patterns. Residual risk: those reach Gemini and could surface in `identity`/`whatItDoes`/features → rendered into the video text. Mitigation already partial (over-redaction intent). Recommend: also run `scrubSecrets` on the LLM *output* facts (defense in depth) before they feed `build-director-prompt.ts` and before render. Currently facts flow to the prompt and to scenes unscrubbed (`repo-facts.ts:30-40`).

- **No scrub on rendered storyboard text** — `Trailer.tsx`/scenes render `scene.text`, `caption`, `code`, `value`, etc. verbatim from director output. If a secret survives triage scrubbing and the model echoes it into a `code`/`stat`/`title` scene, it lands in the mp4. Add a final `scrubSecrets` pass over all string fields of the validated storyboard in `director.ts` before persist/render. This closes the "leak into video" objective robustly.

- **`scrub-secrets.ts:25` ASSIGNMENT_RE can leave secrets partially exposed** — value capture `[^"'`\s,}]{6,}` stops at whitespace/comma/quote/`}` but NOT at `;`, `)`, `>`, newline-is-fine. Multi-line PEM bodies are handled by the dedicated pattern, but e.g. `password=foo)bar` → only redacts `foo`. Also min length 6 misses short secrets. Low exploitability but tighten the terminator set and consider redacting the whole RHS token to EOL for assignment matches.

## Medium

- **`.env.example` inconsistency** — `walk-repo.ts:78` intends to allow `.env.example`, but `isSecretFile` regex `/(^|\/)\.env(\.|$)/i` matches `.env.example` (the `.` after `env`), so line 94 skips it. Either intended (safer) or a latent bug vs the stated intent. If `.env.example` should be indexed (it's useful, non-secret context), exclude it explicitly in `isSecretFile`.

- **Director repair loop wastes a round / can throw on transient API error** — `director.ts:46,54`. `generateRawJson` is awaited with no try/catch; a transient Gemini 429/500 during the *first* call or a repair call rejects `direct()` and aborts the whole pipeline (no retry). The repair loop only handles *validation* failure, not *network* failure. Wrap calls in retry-with-backoff or at least catch and surface a clean error. Loop termination itself is correct (bounded by `MAX_REPAIRS=2`).

- **SSE single-job guard has a TOCTOU window** — `server.ts:58-68, 77-89`. `running` is a plain boolean checked then set in async handlers. Node is single-threaded so the check-then-set within one handler is atomic (no `await` between `if (running)` and `running = true`), so practically safe. But `history = []` is reset on new run while old SSE clients may still receive a trailing event from the previous `.finally`/`.catch` (the old promise can still call `broadcast` after reset). Minor: a late error event from a superseded run could appear. Consider a run-id/generation token guarding `broadcast`.

- **Path traversal on static artifacts is bounded but media src is unvalidated** — `server.ts:35` serves `artifactDir` via `@fastify/static` (which blocks `..` traversal — OK). However `MediaItem.src` (`storyboard-schema.ts:23`) is an arbitrary string and `POST /api/storyboard` accepts a user-supplied storyboard; `staticFile(src)` in `Trailer.tsx:18` resolves it relative to publicDir at *render* time. Remotion's `staticFile` rejects absolute/`..` paths, so render-side is OK, but worth an explicit validator rule that `src` is a bare basename (matches what capture produces) to prevent a hand-crafted storyboard from referencing files outside the capture dir during bundling.

- **`waitForServer` treats any `status < 500` as ready** — `run-app.ts:20`. A dev server returning 404/401 on `/` is considered "ready"; Playwright then captures an error page. Acceptable (fallback chain covers ugliness) but could yield a misleading screenshot. Low impact.

## Low

- **`makeResolver` try/catch around `staticFile`** — `Trailer.tsx:16-20` — `staticFile` throwing is swallowed → `undefined` → placeholder. Fine, but silent. OK for robustness goal.
- **`extractJson` depth walker ignores strings** — `gemini-client.ts:52-56` counts braces inside JSON *string values* (e.g. `"a}b"`), so a `}` inside a string can prematurely close. Rare for model JSON output; `responseMimeType:"application/json"` makes well-formed output likely. Consider a real incremental JSON parse if flakiness appears.
- **`collect-repo-screenshots.ts:20`** uses `path.resolve(repoRoot, rel)` on README-derived paths — a malicious README `![x](../../etc/passwd.png)` could copy an arbitrary `.png` into the capture dir (then potentially rendered). Constrained to image extensions but still reads outside repo. Add a containment check that resolved path stays under `repoRoot`.
- **`detect-runnable.ts:77-78`** chooses `npm run dev` even if `dev` script is e.g. `rm -rf` — see TOP 3; the script content is never inspected.
- **Dead/loose typing**: `injectMeta` return `ok` field is computed but never read in `director.ts` (only `parsed`). Harmless. `repo-facts.ts:8` imports `RepoFacts` value+type alias — fine.
- **`config.ts:11` `loadEnvFile(".env")`** loads from CWD, not the target repo or package root — intentional (operator's own key) but worth a comment; if run via `npx` from elsewhere the `.env` resolution may surprise.

## Positive

- Secret control is layered: `isSecretFile` excludes at walk time AND `scrubSecrets` at bundle time; over-redaction by design.
- Capture fallback chain (`capture.ts`) genuinely never throws fatal — try/catch/finally with `stop?.()`, then screenshot fallback, then graphics-only. Matches the stated invariant.
- Validator rules are thoughtful (longest-line reading floor for `problem`, media kind matching, spice caps). Loop bounded.
- `calculateMetadata` derives true duration from frame sum (`Root.tsx:36`) — correct, decoupled from `meta.totalSeconds`.
- Missing-API-key handling is graceful: triage falls back deterministically (`triage-and-summarize.ts:87`), CLI warns (`cli/index.ts:21`), `assertGeminiKey` only fires when an LLM call is actually attempted.
- Clean ESM `.js`-specifier handling for Remotion webpack (`render-trailer.ts:32`).

## Recommended Actions (priority)

1. Strip API keys from spawned child env; build explicit minimal env (`run-app.ts:40`).
2. Add `child.on("error")` + SIGKILL escalation on teardown (`run-app.ts`).
3. Final `scrubSecrets` pass over validated storyboard string fields before render/persist (`director.ts`).
4. Also scrub RepoFacts (LLM output) before prompt/render (`repo-facts.ts`).
5. Wrap Gemini calls in retry/backoff or catch transient errors in `director.ts`.
6. Validator: require media `src`/referenced ids be bare basenames; containment-check README screenshot paths.
7. Document the "runs untrusted repo code" trust model; consider a confirm gate before auto-run.

## Metrics
- Type coverage: high (zod at all boundaries, discriminated unions; a few `as unknown as` casts in gemini-client are pragmatic).
- Test coverage: not assessed (no test files in `src/`; e2e verified per brief).
- Lint: not run (static review only).

## Unresolved Questions
1. Is auto-running an arbitrary repo's `dev` script an accepted threat-model decision (local-first, user owns the repo)? If yes, items #1/#3/#7 become docs + env-stripping only.
2. Should `.env.example` be indexed for context, or is excluding it intentional?
3. Does the target audience ever feed *untrusted* third-party repos, or only the operator's own? Determines severity of the command-injection items.

---
**Status:** DONE_WITH_CONCERNS
**Summary:** No defect that leaks secrets into the video under normal use, but the spawned dev server inherits the operator's API keys and runs the target repo's scripts unsandboxed (run-app.ts), and storyboard/facts text is rendered without a final scrub pass — both should be closed before treating arbitrary repos as input.
