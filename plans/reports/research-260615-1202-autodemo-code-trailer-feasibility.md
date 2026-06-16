# Research Report: AutoDemo — local-first repo → code trailer

**Conducted:** 2026-06-15 12:02 (Asia/Saigon)
**Inputs analyzed:** `PROJECT.md`, `PLAN.md`, `code-trailer` skill (SKILL.md + 5 references + example storyboard)
**Web sources:** 4 WebSearch queries (Remotion license, Remotion SSR render, Playwright capture, code highlighting)

## Table of Contents
1. Executive Summary
2. Concept & contract analysis (skill ↔ project)
3. Technical findings (5 pillars)
4. Risk register (brutal)
5. 6-day plan assessment
6. Recommendations & decisions
7. Open questions

---

## 1. Executive Summary

Ý tưởng vững. Project + plan + skill **đã ăn khớp**: skill `code-trailer` chính là *contract* (storyboard JSON + scene taxonomy + quality bar) mà product phải implement. Plan "de-risk render trước" là **đúng chiến lược** — render layer là thứ duy nhất bạn kiểm soát 100%; capture/analysis luôn best-effort.

**Verdict khả thi:** MVP 6 ngày **làm được nếu solo + scope kỷ luật**, nhưng 2 thứ bị plan đánh giá thấp:
1. **Remotion licensing** = rủi ro lớn nhất, plan chưa nhắc. Remotion **KHÔNG free cho công ty ≥4 người**. "Deployed, used by thousands" (AABW angle) đụng trực tiếp ràng buộc này — mỗi for-profit ≥4 nhân viên chạy `npx autodemo` về lý thuyết cần company license (~$25/dev/mo, min $100/mo).
2. **Chất lượng Storyboard từ LLM Director** là bottleneck thật sự, không phải render. Render đẹp là tất định; LLM ra storyboard *thỏa 6 câu hỏi + pacing + variety* một cách ổn định mới là phần khó.

Hai thứ này quyết định product có "wow" và có ship được cho số đông hay không. Chi tiết bên dưới.

---

## 2. Concept & contract analysis

Skill `code-trailer` định nghĩa rõ ràng product surface — **đây là tài sản lớn nhất**, đừng thiết kế lại:

- **Contract = Storyboard JSON** (`meta` + `scenes[]` + `media` registry). Durations theo **frames @ fps**. Unknown keys ignored → schema mở rộng an toàn.
- **10 scene types**: `title, problem, ui, demo, feature-montage, architecture, techstack, code, stat, outro`. Renderer = **generic components/scene.type**, KHÔNG bespoke per repo. Đây là cốt lõi để 1 renderer phục vụ mọi repo.
- **Quality bar cứng**: 6 câu hỏi (What/Problem/Does/How/Tech/Why), 10–13 scenes / 45–60s, UI hiện trong 10s đầu, có `techstack`, không 3 text-scene liên tiếp, code chỉ khi code "bán được", music resolve, ≤6 SFX.
- **Validation rules đã định lượng** (storyboard-schema.md §Validation) → có thể code thẳng thành validator (JSON Schema + checks). Tận dụng để reject storyboard tệ *trước* khi render.
- **Theme**: `cinematic-dark` default, accent `#41A3EF`/`#FCCE50` (project brand). `media` field của scene = id trỏ vào registry → renderer resolve ra local path.

→ **Hệ quả thiết kế:** D1 nên build đúng 10 scene components + 1 `<TrailerComposition>` đọc storyboard, KHÔNG hơn. Validator viết sớm (D1) để dùng làm "định nghĩa done" cho Director ở D3.

```
RepoFacts ──► Director(LLM) ──► Storyboard JSON ──► [validate] ──► Remotion ──► .mp4
   ▲                                  ▲                              ▲
 analyze/        capture/ media ──────┘                      generic scene comps
```

---

## 3. Technical findings (5 pillars)

### 3.1 Remotion render (FOUNDATION — solid)
- **API đúng cho use case:** `bundle()` 1 lần → `selectComposition()` → `renderMedia({serveUrl, composition, codec, inputProps, outputLocation})`. Storyboard JSON truyền qua **`inputProps`** → 1 bundle render N video khác nhau. Đây chính xác là mô hình "deterministic render from JSON".
- **Perf:** `concurrency = os.cpus().length`; `npx remotion benchmark` tìm optimal. 1080p/30fps ~60s video thường render trong **~1–5 phút** tùy độ nặng scene (mermaid/Ken-Burns/video clips nặng hơn text). Chấp nhận được cho local tool; set expectation cho user (progress bar).
- **Lưu ý:** `<OffthreadVideo>` cho clip, `<Img>` cho still (đúng như ui-capture.md). Cap concurrency khi có video clips để tránh OOM.

### 3.2 Remotion LICENSING (⚠️ rủi ro #1 — chi tiết ở §4)
- Free: cá nhân, for-profit **≤3 employees**, non-profit, đang đánh giá. Bao gồm render local + self-host Lambda, commercial OK.
- Company license bắt buộc cho for-profit **≥4 employees**: ~**$25/dev/mo, min $100/mo hoặc $1000/yr** (remotion.pro, 2026).
- License áp lên **bên dùng Remotion để tạo video** = end-user của AutoDemo, không chỉ bạn.

### 3.3 Playwright capture (workable, flaky-by-nature)
- Playwright record video native = **`.webm` (VP8)**, hoạt động cả headless. → **tương thích `<OffthreadVideo>`** (Remotion hỗ trợ webm/vp8/vp9).
- Stills: `page.screenshot()`; clip: `recordVideo` trong `browser.newContext({recordVideo:{dir,size}})`.
- **Khó (đúng như plan thừa nhận):** auto-run app lạ → cần detect dev script + port + wait-for-ready + seeded data. Đây là phần *không thể đảm bảo* → fallback (repo screenshots → no-UI graphics) phải solid. Đừng để pipeline block ở đây.
- Capture @ 1920×1080 hoặc clean viewport, 30fps, interaction ngắn 1 hành động/shot.

### 3.4 LLM Director (QUALITY bottleneck thật)
- Provider-agnostic, 2 model: triage (cheap long-ctx: Qwen3 Coder Next / GPT-5 mini) + brain (Claude Opus 4.8 / Qwen3 Coder Plus). Hợp lý.
- **Rủi ro thật:** LLM ra JSON *hợp lệ schema nhưng dở* (one-note, sai pacing, thiếu UI beat). Mitigate: (a) **structured output / JSON mode + JSON Schema**, (b) **validator code-side** enforce validation rules, (c) **repair loop**: validate fail → feed lỗi lại LLM 1–2 lần, (d) few-shot bằng chính `example-storyboard.json`.
- Triage cứng để kiểm token: đọc đầy đủ ≤8–10 file, còn lại signature-only (đúng plan).

### 3.5 Code highlighting (low risk, có sẵn)
- Code scene là OPTIONAL & hiếm → đừng over-engineer. **Shiki** (engine VS Code, static highlight, dễ nhúng React) đủ cho `code` scene ≤14 dòng + 1 highlight region.
- Code Hike có Remotion template (animate giữa snippets) nhưng overkill cho MVP. Shiki Magic Move nếu muốn animate diff (post-MVP).

---

## 4. Risk register (brutal)

| # | Risk | Severity | Plan covered? | Mitigation |
|---|------|----------|---------------|------------|
| R1 | **Remotion license** cho for-profit ≥4 ng. vs "used by thousands" | 🔴 High | ❌ Không nhắc | Xem 3 lựa chọn bên dưới. Phải quyết sớm. |
| R2 | LLM ra storyboard hợp lệ nhưng dở (one-note/slow) | 🔴 High | ⚠️ Một phần | Validator + repair loop + few-shot example |
| R3 | App auto-run thất bại trên repo lạ | 🟡 Med | ✅ Có fallback | Screenshot → no-UI arc; never block |
| R4 | Render perf / OOM với video clips | 🟡 Med | ✅ De-risk D1 | Cap concurrency, scene đơn giản |
| R5 | Secrets lộ vào video/lên LLM | 🟡 Med | ✅ Có nhắc | Scrub trước render + trước khi gửi LLM (.env, keys) |
| R6 | 6 ngày solo over-scope | 🟡 Med | — | Cắt stretch, meta-demo là acceptance |

**R1 — 3 lựa chọn (cần quyết trước/đầu build):**
1. **Accept + document rõ** (khuyến nghị MVP/AABW): phần lớn hackathon builder = cá nhân/≤3 ng → free hợp lệ. Ghi rõ trong README "Remotion free cho cá nhân & cty ≤3 ng; cty lớn hơn cần Remotion company license". Rủi ro: bạn đẩy nghĩa vụ license sang user — minh bạch là đủ về mặt đạo đức/pháp lý cho user tự quyết.
2. **Renderer thay thế open-source** (post-MVP nếu muốn gỡ ràng buộc): **Revideo** (fork Motion Canvas, MIT) — nhưng mất toàn bộ hệ React-scene đã build trên Remotion → đắt, không hợp 6 ngày.
3. **Hosted render** (bạn chịu license, mất "local-first"): trái nguyên tắc cốt lõi → loại.
→ **Đề xuất: chọn (1) cho MVP**, note (2) là exit option nếu license thành rào cản adoption.

---

## 5. 6-day plan assessment

| Day | Plan | Đánh giá |
|-----|------|----------|
| D1 | Render layer + 10 scene comps + JSON tay → mp4 | ✅ Đúng ưu tiên. **Thêm: viết validator ngay D1.** Realistic nếu theo remotion skill. |
| D2 | Repo analysis → RepoFacts + CLI/server/UI tối thiểu | ⚠️ Nặng. Tách: RepoFacts trước, UI tối thiểu sau. |
| D3 | Director: RepoFacts → Storyboard JSON | 🔴 Phần khó nhất. Cần buffer cho repair loop + prompt tuning. |
| D4 | Playwright capture + media registry | ⚠️ Flaky; ưu tiên fallback screenshot chạy trước, auto-run sau. |
| D5 | Web UI + polish + **meta-demo** | ✅ Meta-demo = acceptance test tốt nhất. |
| D6 | Harden + package `npx` + publish | ✅ |

**Verdict:** ordering tốt, nhưng D3 (Director quality) bị nén. Nếu trượt, hi sinh **D5 UI polish** (preview + download là đủ), giữ Director + fallback chắc. Thứ tự de-risk thực tế nên là: **render (D1) → validator (D1) → Director trên storyboard tay (D3) → analysis (D2) → capture fallback-first (D4)**.

**KISS cho MVP:** pure `npx` + mở browser (KHÔNG Electron — open decision #3); 1 ngôn ngữ text; 1 music mood auto; ≤13 scenes. Electron thêm tuần build, không cần.

---

## 6. Recommendations & decisions

1. **Build render + validator trước (D1)**; validator = "definition of done" cho Director. Few-shot Director bằng `example-storyboard.json`.
2. **Quyết R1 license ngay**: chọn Accept + document (MVP). Note Revideo là exit option.
3. **Director robustness > UI polish**: structured output + JSON Schema + repair loop (validate→feed error→retry ≤2). Đây là nơi "wow" thắng/thua.
4. **Capture: fallback-first.** Repo-screenshot path chạy được trước, auto-run Playwright là enhancement. Pipeline không bao giờ block ở capture.
5. **Scrub secrets** 2 chỗ: trước khi gửi code lên LLM, và trước khi render bất kỳ file/code nào vào video.
6. **Stack chốt:** TS end-to-end · Node + Fastify (hoặc Vite middleware) · React+Vite+Tailwind · Playwright · Remotion (`@remotion/renderer` SSR) · Shiki cho code scene · provider-agnostic LLM client (env keys).
7. **No Electron** cho MVP. `concurrency = os.cpus().length`, cap khi có video clips.
8. **Acceptance = meta-demo**: AutoDemo tự tạo trailer cho chính repo của nó, pass quality bar trong 1 run.

---

## 7. Open questions

1. **Solo hay team?** (PLAN open #1) — quyết định parallelize capture/render/UI. Solo → giữ scope §5.
2. **Brain model default?** Claude Opus 4.8 (Bedrock) vs Qwen3 Coder Plus (Qwen credits) — ảnh hưởng chất lượng storyboard & cost. Khuyến nghị Opus 4.8 cho chất lượng director, Qwen cho triage.
3. **Remotion license stance** — Accept+document (đề xuất) hay đầu tư Revideo? Cần chốt vì ảnh hưởng claim "used by thousands".
4. **Music pack nguồn nào?** Cần curate royalty-free + license cho phép redistribute trong npm package (kích thước package + license của nhạc cần kiểm).
5. **Target framework cho capture MVP?** Chốt 1–2 framework (Next.js/Vite) để auto-run reliable, thay vì cover tất cả.

---

## Sources
- [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
- [Remotion License & Pricing](https://www.remotion.dev/docs/license) · [Company Licensing](https://www.remotion.pro/license)
- [Remotion SSR (renderMedia / bundle / inputProps)](https://www.remotion.dev/docs/ssr-node) · [renderMedia()](https://www.remotion.dev/docs/renderer/render-media) · [Performance Tips](https://www.remotion.dev/docs/performance)
- [Playwright Videos](https://playwright.dev/docs/videos) · [playwright-recording for Remotion](https://skills.rest/skill/playwright-recording)
- [Code Hike (Remotion template)](https://www.remotion.dev/templates/code-hike) · [Shiki](https://shiki.style/guide/) · [Shiki Magic Move](https://github.com/shikijs/shiki-magic-move)
