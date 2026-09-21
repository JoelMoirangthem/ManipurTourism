# Folder structure — observed and proposed

Version 0.2 · 21 September 2026 · **Audit of the real workspace plus a proposed target.** The observed tree is what exists today; the target tree is a recommendation, not an instruction to reorganize immediately.

## 1. Observed structure (21 September 2026)

```
D:/ManipuriTourism/
├─ .workbuddy-ai/                    # agent workspace data (not a cache; do not delete)
├─ .gitignore                        # ignores node_modules, .next, .env*, .data, .uploads
├─ _research/                        # 1 image
├─ apps/
│  └─ web/                           # the only application today (Next.js 16.3.5, React 19, Tailwind 4)
│     ├─ prisma/schema.prisma        # relational schema, not yet migrated
│     ├─ eval/                       # questions.json, run.mjs
│     ├─ public/images/
│     ├─ .data/                      # gitignored file-backed store
│     ├─ .uploads/quarantine/        # gitignored local upload quarantine
│     ├─ .env.example / .env.local   # key names only; never commit real secrets
│     ├─ AGENTS.md, CLAUDE.md, README.md
│     └─ src/
│        ├─ app/                     # routes + pages
│        │  ├─ api/{ai/query,health,inquiries,inquiries/[id],inquiries/[id]/messages,
│        │  │        phrases,places,places/[id],plan,translate,uploads,uploads/[id],weather}
│        │  └─ {assistant,inbox,inquire,inquiries/[id],places,places/[id],plan,review,upload}
│        ├─ data/                    # seed-places.json, phrase-cards.json, intake_queue.csv,
│        │                           # photo-attribution.json
│        └─ lib/                     # adapters, domain, ports, rag, searchWeb,
│                                    # inquiryStore, uploadStore
├─ docs/build/                       # phased build plan: PRD, architecture, design, tasks,
│                                    # memory, api-testing, content-pipeline, rulebook-checklist
├─ outputs/manipur-tourism-docs/     # research + full specification pack (canonical)
├─ manipur_ftv_dtv_2019_27.png       # source image (tourism statistics)
├─ mtp2022.pdf                       # source (Manipur Tourism Policy 2022)
└─ sendra_tender.pdf                 # source (Sendra/Takmu tender; text not extractable)
```

Two documentation sets exist by design: `outputs/manipur-tourism-docs/` is canonical for evidence, requirements and rules; `docs/build/` is the phased execution plan. Neither overwrites the other. `index.md` in the canonical set is the entry point.

## 2. Divergence from the documented target

| Documented intent | Observed reality | Note |
|---|---|---|
| `packages/domain`, `packages/ports`, `packages/adapters`, `packages/rag`, `packages/ui`, `packages/eval` | No `packages/` directory; logic lives in `apps/web/src/lib` plus `eval/` | Acceptable while one app exists; extract on a real second consumer |
| Three domain files (planner/budget/trust) | One `src/lib/domain.ts` | Already recorded as a deviation in `docs/build/memory.md` |
| Adapter folders per provider | One `src/lib/adapters.ts` | Module boundaries hold; folder split is cosmetic until adapters multiply |
| Postgres with row-level security | Prisma schema only; runtime uses seed JSON and a file-backed store | A local convenience, not a production substitute |

Rule: do not create empty directories or speculative packages for architectural symmetry. Split when a concrete boundary exists.

## 3. Proposed target structure (when a second consumer appears)

```
apps/web/                    # routes, server actions, PWA shell
packages/domain/             # planner, budget (minor-unit INR), trust — zero provider imports
packages/ports/              # interfaces only, no implementations
packages/adapters/           # db-postgres, storage-s3, llm-*, translate-*, xlit-*, search-*, weather-*
packages/rag/                # router, retrievers/sql, evidence, validate
packages/ui/                 # catalogue, gallery, planner, inbox, reviewer components
packages/eval/               # question sets, scoring harness
prisma/                      # schema, migrations, seeds
docs/                        # build plan; canonical specs stay in outputs/manipur-tourism-docs/
```

## 4. File placement rules

- Source PDFs, images and other originals stay at the workspace root or under a source folder; never overwrite them. Corrections are added with provenance [R02](rules.md).
- Generated local state (`.data/`, `.uploads/`) stays gitignored and is never shipped as seed data.
- Seed and fixture JSON under `src/data/` must keep `is_demo` flags and licence/attribution fields [R51](rules.md).
- New evidence belongs in `sources.md`, not in ad-hoc notes; new requirements belong in the canonical PRD.
- Screenshots and research captures go under `_research/`, not the application source tree.

## 5. Naming conventions

- Documents: lowercase, hyphenated, `.md` (the existing `PRD.MD` capitalisation is inconsistent — prefer `prd.md` on next edit and update links).
- Tasks: stable `Phase<letter><n>` IDs as in [tasks.md](tasks.md).
- Claims: stable `c-*` identifiers, stable rule IDs `R##`, stable source IDs `S##`, stable test IDs `T##`.
- Fixtures: explicit `demo` prefix plus `is_demo=true`.
