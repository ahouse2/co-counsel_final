# Co-Counsel Halo Interface Audit (Phase 1)

_Date: 2025-11-17_

This document fulfills the **audit-state** deliverable in the production readiness plan. It inventories the halo UI against `frontend/Neuro-SAN Litigation OS — Frontend.txt`, maps each module to its backend endpoints, and flags the mismatches, mocks, and orphaned assets we need to resolve before moving to wiring and feature work.

## 1. Module Coverage Matrix

| Halo Module (Spec §2) | Frontend Entry Point(s) | Backend Surfaces | Current Status / Gaps |
| --- | --- | --- | --- |
| Evidence Ingestion Pipeline | `src/components/UploadZone.tsx`, `src/pages/UploadEvidencePage.tsx` | `backend/app/api/ingestion.py` (`/ingestion`, `/ingestion/{document_id}/status`) | Upload form posts to `/api/ingestion` with single-file `fetch` and simulated progress. No folder batch demux, no polling, no display of `IngestionStatusResponse`. API prefix mis-match (`/api/ingestion` vs `/ingestion`). |
| Graph Explorer | `src/components/GraphExplorer.tsx`, `DashboardHub` halo viewport | `backend/app/api/knowledge_graph.py` (prefixed `/knowledge-graph`) | Query posts to `/knowledge-graph/cypher-query` correctly but UI lacks module-level state syncing (vector view vs heatmap etc). No caching, export, or agent trigger controls per spec. |
| AI Context Engine / Legal Theory Team | `src/components/LegalDashboard/LegalDashboard.tsx`, `src/pages/LegalTheoryPage.tsx` | `backend/app/api/legal_theory.py`, `backend/app/api/strategic_recommendations.py`, `backend/app/api/predictive_analytics.py` | `LegalTheoryPage` fetches `/legal_theory/...` but lacks auth handling, caching, or node drill-in. `LegalDashboard` is 100% mock data; no calls into predictive/strategy endpoints. |
| Forensics / Chain of Custody | `src/pages/ForensicsReportPage.tsx`, `src/services/forensics_api.ts` | `backend/app/api/forensics.py`, `backend/app/api/cases.py` | Service expects `/api/v1/cases/.../forensics`, but backend routers expose `/cases/...` (prefixed `/api`). No UI route linking from halo to this page. Crypto graph viewer referenced but component missing. |
| Timeline Builder | `src/pages/TimelinePage.tsx`, `components/timeline/*` | `backend/app/api/timeline.py` | Reads/writes `/timeline/{caseId}` but uses hardcoded `caseId` and no auth. Drag/drop interactions limited; no document pop-out integration. |
| Trial Binder Creator / Exhibit Builder | `src/pages/InCourtPresentationPage.tsx`, `components/common/DocumentPreviewModal.tsx` | `backend/app/api/binder_preparation.py`, `backend/app/api/documents.py`, `backend/app/api/cases.py` | Presentation builder uses `/api/cases` + `/api/documents` (mismatched prefixes) and posts to `/prepare-binder`. No real-time syncing with timeline / binder exports, and annotation persistence is client-only. |
| Mock Trial Arena | `src/components/mock-trial/MockTrialArena.tsx`, `pages/MockTrialArenaPage.tsx` | `backend/app/api/mock_trial.py` (prefixed `/mock-trial`) | Frontend calls `/mock-trial/start` & `/mock-trial/action` correctly but UI shares no session state, lacks player metadata, and has no connection to legal theory/team data. Backend game logic is random placeholder. |
| Trial University | `src/components/trial-university/TrialUniversityPanel.tsx`, `pages/TrialUniversityPage.tsx` | `backend/app/api/trial_university.py` | Fetches `/trial-university/lessons` (static in-memory data). Missing lesson completion updates, progress syncing, or CTA into other modules. |
| Legal Research / Case Law Engine | (no dedicated halo view yet; only stray components in `components/LegalDashboard`) | `backend/app/api/legal_research.py`, `/knowledge-graph/legal-references/search` | No UI wiring. Need search panel, citation linking, and integration with Document Viewer per spec. |
| Live Co-Counsel Chat / Agent Interaction | `src/components/LiveCoCounselChat.tsx`, `pages/LiveCoCounselChatPage.tsx` | `backend/app/api/agents.py` (`/agents/invoke`) | Uses `/api/agents/invoke` (should be `/agents/invoke`). Generates new UUID per send (no session continuity), no streaming, no agent roster, no transcript persistence. |
| Document Viewer / Context Engine | `src/pages/DocumentDraftingPage.tsx`, `components/common/DocumentPreviewModal.tsx`, `pages/ServiceOfProcessPage.tsx` | `backend/app/api/document_drafting.py`, `backend/app/api/service_of_process.py` | Drafting hits `/draft-document` and handles download, but lacks job tracking, autosave, or referencing ingested docs. Service of Process UI still mostly design-system demo stub. |

## 2. Frontend Findings

### Layout & Navigation
- `src/components/Layout.tsx` now renders the halo shell + slide-out menu, but the menu buttons only change routes; there is no state linkage to highlight the active halo node inside `DashboardHub`.
- `App.tsx` still calls `useId()` even though the value is unused and throws a lint warning.
- The old cinematic sidebar CSS (`.cinematic-nav`, `.cinematic-main`, etc.) remains in `src/styles/index.css` even though the layout has switched to the halo paradigm, inflating bundle size.

### Module Implementations
- **Upload Zone**: No multi-file progress, no ingestion status polling, and no proper error surfaces beyond a simple message. Folder upload uses `webkitdirectory` but treats each file individually, so directories are flattened and metadata is lost.
- **Graph Explorer**: Hard-coded query string, no persistence of saved queries, no differentiation between “Vector Space”, “Structured Graph”, “Relationship Heatmap”, etc. as called for in the spec. The halo viewport summary card currently just mirrors the selected submodule label.
- **Live Co-Counsel Chat**: Inline state only; no WebSocket/SSE support, no user identity, no agent/role selection, and the speech synthesis hook is invoked client-side without permission prompts or fallback.
- **Timeline Builder**: `caseId` is a literal string and the UI assumes `/timeline/{caseId}` is publicly accessible. There is no drag-to-reorder, no document attach, and the “View Related Documents” button is a placeholder.
- **Trial Binder / Presentation**: Uses alerts for success/failure, and binder download blocks the UI thread. Selected evidence preview opens `window.open` on the evidence URL with no auth token propagation.
- **Mock Trial**: Canvas rendering works, but there is no viewport containment or retina scaling, and the backend simulation is stateless beyond a single global Python variable (one user globally).
- **Trial University & Legal Dashboard**: Both rely on mock or static data, so progress bars never update and cross-links to other modules are missing.
- **Document Drafting**: The front end posts to `/draft-document` but does not surface the returned job ID or guard against double submissions; all motion types are hard-coded.

### Component / Asset Debt
- Numerous unused components remain (`src/components/DevTeam`, `components/CinematicDesignSystemDemo`, etc.).
- Duplicate style sheets (`src/styles/cinematic-design-system.css`, `design-system.css`) were deleted earlier but equivalents exist in `index.css` with overlapping selectors that should be modularized.
- `src/components/common` includes a `DocumentPreviewModal` that is only partially wired; other planned shared components (NodeButton, GlowPulseEffect) do not exist yet.

## 3. Backend & Contract Observations

- **Route Prefix Drift**: Frontend calls `/api/ingestion`, `/api/agents/invoke`, `/prepare-binder`, etc. while the FastAPI `include_router` wiring exposes a mix of bare prefixes, `/agents`, `/knowledge-graph`, `/api`, etc. We need a single API gateway path (e.g., `/api/v1`) or a client helper.
- **Authentication/Authorization**: Most endpoints depend on `Principal` via `authorize_*` dependencies, but the frontend performs unauthenticated `fetch` calls. Until auth is wired, all requests will fail in production.
- **Long-running Jobs**: Ingestion, binder prep, document drafting, and mock trial evaluation all return immediately but may take time. There is no job status poller or notifications in the UI.
- **Toolchain Dependencies**: Several backend APIs depend on `toolsnteams_previous` modules (timeline manager, binder preparer, etc.) that have CLI assumptions and may not be production-ready. Need to encapsulate them behind services with retries and logging.

## 4. Orphaned / Loose Ends

- `src/components/mock-trial/MockTrialArenaPanel.tsx`, `components/graph-explorer/GraphExplorerPanel.tsx`, `components/DevTeam/*`, and `components/LegalDashboard` are not referenced from any route.
- CSS assets include embedded base64 noise textures and old radial gradients; we should extract halo-specific styles into a dedicated SCSS/Tailwind layer to avoid conflicts.
- There are multiple service helper files (`src/services/document_api.ts`, `src/services/forensics_api.ts`) that are unused or partially implemented.
- Tests under `frontend/tests` are outdated snapshots referencing the old dashboard layout and will fail once we hook real data.

## 5. Recommended Next Actions (Feeds Phase 2+)

1. **Normalize API access** via a typed client (Axios/React Query) that handles auth headers, base URLs, and error translation. This unblocks wiring tasks in Phase 2.
2. **Define shared halo module state** (selected primary/submodule, active case) so `DashboardHub` and individual pages stay in sync.
3. **Backfill missing UI surfaces** (Legal Research panel, AI Context Engine view, Document Viewer inside the halo viewport).
4. **Retire unused components/styles** to reduce noise before lint/type cleanup.

This audit should be used together with `docs/api-halo.md` (data-contracts deliverable) to guide the upcoming implementation waves.

