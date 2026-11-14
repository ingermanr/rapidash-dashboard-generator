# Professional hardening — Rapidash Dashboard Generator

Objective: make the project professional in phases (baseline+CI → domain → UI → product). Branch: `chore/professional-baseline`.
Delivery: ask-on-risk, work-unit commits. Test runner: `npx jest`; checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Specs

- S1 Phase 1 "Base": normalize EOL, fix type errors, single lockfile, clean dependencies and `console`, migrate ESLint to flat config, add CI (types + lint + tests + build).
- S2 Phase 2 "Dominio": extract combination generation, layout selection and mock data to `lib/domain/` with a seeded RNG and unit tests.
- S3 Phase 3 "UI": split the two giant components (layouts, charts, cards) and add behavior tests.
- S4 Phase 4 "Producto": PDF, accessibility, persistence (to be defined with the user).

## Tasks

- [x] T1 (S1) EOL: `.gitattributes`, LF everywhere — inline — 820c8b3
- [x] T2 (S1) Fix `tsc` errors in tests; add `typecheck` script — inline — 98f146a
- [x] T3 (S1) Single lockfile (npm), Node LTS pin, remove unused deps/UI/dead files; render missing `<Toaster />` — inline — 10ff044
- [x] T4 (S1) ESLint flat config, zero warnings, remove debug `console.*` — inline — 0dcd4ec
- [x] T5 (S1) GitHub Actions CI — inline — 94920cd
- [ ] T6 (S2) Domain extraction + seeded RNG + tests
- [ ] T7 (S3) UI split + behavior tests
- [ ] T8 (S4) Product improvements (pending definition)

Route evidence: phase 1 units are small and sequential; no writer trigger applies.

## Log

- L1 (2026-11-13) User: "revisa este proyecto, vamos a mejorarlo y dejarlo realmente profesional"
- L2 (2026-11-13) Proposed 4-phase plan; user: "adelante" (start with phase 1).
- L3 Baseline: build OK, 28 tests pass, `tsc` 8 errors (tests), 42 lint warnings, 6/52 UI components used, 20 files with CRLF-only diffs, `<Toaster />` never rendered so toasts in `layout-preview` never show.
- L4 Phase 1 done. `npm run verify` green: tsc 0 errors, lint 0 warnings, 28/28 tests, build OK. Risk: item 5 (dependencies, Node pin, CI).
- L5 Findings for later phases: PDF export shadows `getRealLayoutDivisions` with a hardcoded distribution, so the PDF diagram can differ from the preview (phase 4); PDF error uses `alert()` (phase 3/4); 28 `Math.random()` calls (phase 2).
- L6 Verification: independent verifier PASS on all S1 items, no blockers. Native review of the full branch refused (`lens_context_budget_exceeded`); narrowed to the CI range (base 0dcd4ec): granted, approved, acknowledged. Advisory follow-ups: pin actions to commit SHAs; limit `cancel-in-progress` to pull requests.
