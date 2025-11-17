# Co-Counsel Production Architecture & Sequencing

_Last updated: 2025-11-17_

This document expands Phase 2 of the production readiness plan and sets the concrete architecture moves we will execute before wiring the halo modules end-to-end.

## 1. Architecture Pillars

1. **Typed API Layer (Client SDK)**
   - Build `src/lib/apiClient.ts` powered by Axios + React Query.
   - Centralize base URL, auth headers, error normalization, and retries.
   - Provide typed hooks per domain (`useIngestion()`, `useKnowledgeGraph()`, etc.) that return `{ data, isLoading, error, refetch }`.

2. **Global Case + Module Context**
   - Introduce `CaseContext` (active case, matter metadata, permissions) and `HaloContext` (selected primary module, submodule, viewport payload).
   - `DashboardHub` should read/write from context so route navigation and halo node selection stay in sync.

3. **Job Tracking Service**
   - Wrap long-running operations (ingestion jobs, binder prep, drafting) behind `/jobs/*` abstraction in the client.
   - Persist jobs in local storage to survive reload; surfaces statuses in the halo perimeter.

4. **State Management + Cache Strategy**
   - Use React Query query keys per case/module.
   - Keep derived UI state (filters, sort) in Zustand or Context to avoid prop drilling.

5. **Error & Notification Pipeline**
   - Add a global toast system (reuse `components/ui/toast`) wired to the API layer.
   - Provide `ErrorBoundary` wrappers for each halo module.

## 2. Implementation Waves (Detailed)

### Wave A – Evidence Ingestion
1. Create `useIngestionUpload()` hook (POST `/ingestion` or `/ingestion/upload_directory`).
2. Implement polling via `useIngestionStatus(documentId)` using React Query + exponential backoff.
3. Update `UploadZone` to handle folder zips, parallel uploads, and status chips per file.
4. Surface ingestion telemetry (docs processed, graph nodes, forensics artifacts) in a halo perimeter widget.

### Wave B – Graph Explorer & Knowledge Surfaces
1. Add query builders for preset submodules (vector, structured, heatmap) that call the appropriate `/knowledge-graph/*` endpoint.
2. Extend `DashboardHub` to feed the central viewport with real graph data, including node metadata cards and actions (filter, run agents, export).
3. Wire `LegalTheoryPage` to reuse the shared graph cache instead of firing duplicate requests.

### Wave C – Live Chat & Agent Orchestration
1. Normalize chat API calls to `/agents/invoke` via the client SDK; maintain session IDs in context.
2. Add scrollback persistence (per case) and agent roster selection.
3. Integrate optional WebSocket/SSE stream for incremental responses (if available); otherwise show spinner until response arrives.

### Wave D – Timeline Builder
1. Replace hard-coded `caseId` with the active case context.
2. Convert timeline components to use React Query (`GET /timeline/{case}`) and optimistic updates for `POST /timeline/{case}/event`.
3. Add drag/drop reorder (client) and persist ordering by writing back to the backend (requires new field or `event_text` convention).
4. Hook “View Related Documents” to the document viewer inside the halo viewport.

### Wave E – Binder + Mock Trial
1. Update `InCourtPresentationPage` to fetch cases/documents through the typed client, add pagination/search, and persist presentation playlists server-side.
2. Move binder prep into a background job: POST `/prepare-binder`, show job status, then download when ready.
3. Refactor mock trial to include a session ID (pass to `/mock-trial/start`/`action`). Display backend `log` entries and sync with Legal Theory suggestions.

### Wave F – Research, Trial University, Document Drafting
1. Build a halo panel for Legal Research using `/legal_research/query` and `/knowledge-graph/legal-references/search`.
2. Wire Trial University progress updates (will require new backend endpoint; define contract first).
3. Enhance Document Drafting UI to accept templates/motion definitions from backend, show job state, and attach drafted files to cases.

## 3. Cross-Cutting Tasks (Phase 3 Alignment)

- **Error Handling**: Implement domain-specific error mappers (e.g., ingestion quota exceeded, timeline parse failures) and route all toasts through a single provider.
- **Accessibility & Responsiveness**: Audit the halo layout with keyboard navigation and screen-reader labels (ARIA roles for nodes, menu, viewport).
- **Testing**:
  - Unit tests for hooks (mocking API client).
  - Component tests for each halo card using RTL.
  - Smoke Playwright journeys: ingest → graph filter → add timeline event → create binder → run mock trial.

## 4. Sequencing & Dependencies

1. **API Client + Context Foundations** (prereq for every wave) – implement before touching feature modules.
2. **Wave A (Ingestion)** unlocks graph/timeline data freshness.
3. **Wave B** depends on ingestion telemetry; **Wave C** can proceed in parallel after the client SDK lands.
4. **Wave D** requires case context + ingestion (for linking evidence).
5. **Wave E/F** can run in parallel once state management + API normalization exist.

Each wave should close with:
- API contracts validated against the backend (see `docs/api-halo.md`).
- UI wired with loading/error/empty states.
- Tests + Storybook (optional) updated.

This roadmap, combined with the audit findings, is our source of truth for the remaining production-readiness work.

