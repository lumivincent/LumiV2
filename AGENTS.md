# Lumiterra V2 workspace rules

This workspace is the durable operating memory for Lumiterra V2. For any Lumiterra product, marketing, content, campaign, or asset task:

1. Read `memory/current.md` first.
2. Read the relevant files in `sources/`. They are the local product source of truth.
3. Treat `records/requests/` as the handoff inbox. If the user says “处理最新运营请求”, use the newest pending request.
4. Separate claims into:
   - confirmed product facts from `sources/`;
   - operational interpretation or recommendation;
   - open assumptions that still need team confirmation.
5. Never turn an unconfirmed date, number, economy outcome, or token return into a public promise.
6. Document analysis, content creation, and asset production are independent work types. Do not force one into the next. They share project memory and may be linked only when the user wants that relationship.
7. For public content creation, use the latest files in `sources/` as the product truth and use only `final` or `published` entries in `data/content-metadata.json` as prior voice/content memory. Draft content must never be treated as approved messaging.
8. If a finalized content entry is marked `reviewRequired`, treat it as historical expression only and re-check every product claim against the current sources before reusing it.
9. Treat the operations knowledge base as an independent work type. Do not copy knowledge entries into product sources, content outputs, asset records, or project memory unless the user explicitly requests that relationship.
10. For substantive research, analysis, or brainstorming discussions that should remain reusable operating knowledge:
   - external materials and evidence belong in `knowledge/sources/`;
   - structured discussion summaries belong in `knowledge/discussions/`;
   - reusable single conclusions belong in `knowledge/insights/` only after separating evidence, operational interpretation, and open assumptions;
   - brainstorm conclusions without evidence must remain assumptions or low-confidence insights, not confirmed facts.
11. Keep `data/knowledge-metadata.json` aligned with every knowledge entry so the workbench can search and trace it. Knowledge entries must preserve stable IDs, versions, relations, and source references.

## Where work goes

- Analysis, strategy, narrative, campaign plans, and operating documents: `outputs/documents/`
- X / Twitter copy and threads: `outputs/twitter/`
- Image/video briefs, prompts, storyboards, and produced media: `outputs/assets/`
- A short record of each substantive execution: `records/sessions/`
- Confirmed decisions: `records/decisions/`
- External research and evidence: `knowledge/sources/`
- Structured research or brainstorming discussions: `knowledge/discussions/`
- Reusable operating viewpoints: `knowledge/insights/`
- Knowledge topics, experiments, and reusable context: the matching folders under `knowledge/`

Use Markdown for text outputs. Name new files with an ISO-style date prefix, for example `2026-08-26-agent-narrative.md`.

## Closing an operating request

After completing a file in `records/requests/`:

- change its status from `待处理` to `已完成`;
- add links or paths to the produced files;
- create a short session record with what was done, important judgments, sources used, and remaining questions;
- only update `memory/current.md` when the change is durable and confirmed.

Do not overwrite source documents with generated content. Source sync is handled by the dashboard or `pnpm sync:docs`.
