# Storyboard JSON — schema (v2)

One object from the LLM director to the Remotion composition. The composition maps each `scene.type`
to a React scene component and pulls captured media by reference. Durations are **frames** at
`meta.fps`. Unknown keys are ignored (safe to extend per theme).

## `meta`

| field | type | notes |
|---|---|---|
| `title` | string | product name |
| `fps` | number | 30 default |
| `width`/`height` | number | 1920×1080 default; 1080×1920 for vertical |
| `theme` | enum | `cinematic-dark` (default) \| `brand-light` |
| `accent` / `accent2` | hex? | default `#41A3EF` / `#FCCE50` |
| `music` | string | mood key (see audio reference) |
| `bpm` | number? | enables beat-snapped cuts |
| `totalSeconds` | number | target 45–60 |

## Common scene fields

`type`, `durationInFrames`, `transitionIn?` (`fade`|`slide`|`wipe`|`cut`), `sfx?`
(`whoosh`|`tick`|`riser`|`thock`|`impact`|`none`), `bg?`.

## Scene types & fields

- **title** — `text` (identity+promise, ≤8 words), `sub?`, `media?` (a UI still to sit behind/beside).
- **problem** — `lines: string[]` (1–2 short lines).
- **ui** — `media` (ref to a captured **still**), `caption?`, `kenBurns?` ("in"|"out"), `frame?`
  ("browser"|"device"|"none").
- **demo** — `media` (ref to a captured **clip**), `caption?`, `trim?` ([startFrame,endFrame]).
- **feature-montage** — `items: [{icon, text(2–4 words)}]` (3–5), `perItemFrames?` (~30),
  `over?` (media ref to dim behind the cards).
- **architecture** — `mermaid: string` OR `graph:{nodes,edges}`; `caption?`. One mechanism only.
- **techstack** — `items: [{name, icon?}]` (the real stack), `caption?`.
- **code** — OPTIONAL. `lang`, `code` (≤14 lines), `highlight:[[s,e]]`, `caption`. Only if code sells.
- **stat** — `value` (number/`%`/short string; count-up if numeric), `label`, `sub?`.
- **outro** — `text`, `cta` (URL), `sub?`.

## `media` registry

Captured assets are referenced by id and resolved by the renderer to local file paths:

```jsonc
"media": {
  "home":   { "kind": "still", "src": "captures/home.png" },
  "search": { "kind": "clip",  "src": "captures/search.webm", "durationInFrames": 90 }
}
```
A scene's `media` field is one of these ids (e.g. `"ui": { "media": "home" }`).

## Validation rules

- Storyboard must satisfy the six questions (storytelling.md): include ≥1 `ui`/`demo` (or no-UI
  fallback) AND a `techstack` scene.
- ~10–13 scenes for 45–60s; no 3 text-only scenes in a row.
- Text scenes: `durationInFrames/fps` ≥ `max(1.0, words*0.25)`.
- `feature-montage` items 3–5; per-item ~24–36 frames.
- ≤1 `code` scene and only if it's the selling point; `code` ≤14 lines.
- ≤1 `architecture`; one mechanism.
- ≤6 scenes carry `sfx`; one dominant accent, `accent2` in ≤2 scenes.
- `totalSeconds` in [45,70].

## Worked example

See `assets/example-storyboard.json` — a ~52s, 11-scene board (title → problem → ui →
feature-montage → demo → architecture → techstack → stat → ui → outro) with a `media` registry.
