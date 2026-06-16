# Storytelling — the information spine

A trailer's job is comprehension, not decoration. By the end a stranger must be able to answer six
questions. Map each to at least one scene; if a question has no scene, the storyboard is incomplete.

## The six (and where they usually live)

| # | Question | Carried by |
|---|---|---|
| 1 | **What is it?** | title (with product visible) |
| 2 | **What problem?** | problem (1–2 lines) |
| 3 | **What does it DO?** | **ui / demo** (real footage) + feature-montage — the heart |
| 4 | **How does it work?** | architecture (one mechanism, built) |
| 5 | **What tech?** | techstack (badge montage) |
| 6 | **Why care?** | stat and/or outro + CTA |

Rule of thumb: questions 3 and 5 are the ones generic trailers skip — and their absence is exactly
why a viewer "doesn't get it". Always include a UI beat (Q3) and a techstack beat (Q5).

## Default dense arc (~11 scenes, ~52s @30fps)

1. title (~75f) — identity + product peeking behind text.
2. problem (~80f) — one sharp line, maybe a second.
3. ui (~90f) — hero screenshot, slow push-in: "here's the thing working".
4. feature-montage (~120f) — 4 features, ~30f each, icon + 2–4 words, over a dimmed UI.
5. ui / demo (~90f) — a second view or a short interaction.
6. architecture (~110f) — one mechanism builds.
7. techstack (~80f) — badges fly/stagger in.
8. (optional) code (~120f) — only if a core algorithm sells it; else drop and redistribute time.
9. stat (~70f) — one number/fact.
10. ui (~70f) — final glamour shot of the product.
11. outro (~85f) — name + live/repo URL.

Adjust to the repo: a CLI/agent/API with no UI swaps `ui` beats for terminal captures, output
samples, or a strong architecture + result montage — but STILL answers all six.

## Writing the beats

- **Lead with the takeaway**, largest text. One idea per scene.
- **Identity line (title):** say what it is in plain words ("genealogy explorer for on-chain IP",
  "full-stack MERN store"), not a vague slogan.
- **Problem:** concrete and short. "On-chain IP data is opaque" beats "the world needs transparency".
- **Features:** verbs and nouns, 2–4 words ("Trace lineage", "Filter by price", "Pay online"). A
  montage of 4–5 conveys breadth fast.
- **Tech:** show the real stack as badges; don't bury it in prose. Pull from package.json / README.
- **Why:** an outcome ("from opaque chain to living map") or a number; then the URL.

## No-UI fallback (agents, APIs, CLIs)

Replace `ui/demo` with: recorded terminal output, a request/response sample, a results table, or a
strong animated architecture + a stat that proves it works. Comprehension is still mandatory — show
inputs and outputs even if there's no GUI.
