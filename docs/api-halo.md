# Co-Counsel Halo API Contracts

This document fulfills the **data-contracts** deliverable from the Production Readiness Plan. It focuses on the API surfaces that already exist in the backend and are required to wire the halo modules. Paths are relative to the FastAPI root defined in `backend/app/main.py`; note that some routers already carry prefixes such as `/knowledge-graph` or `/mock-trial`.

> **Auth reminder:** Most endpoints depend on `Principal`-based dependencies (e.g., `authorize_query`). The frontend needs to attach the correct auth headers/session token before these calls will succeed outside of development.

---

## Evidence Ingestion Pipeline (`UploadZone`, `UploadEvidencePage`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/ingestion` | `multipart/form-data`: `file` (`UploadFile`), `document_id` (str) | `IngestionResponse { job_id, status }` | Use for binary uploads. Supports large files via streaming upload. |
| POST | `/ingestion/text` | JSON `IngestionRequest { document_id?, text, sources[] }` | `IngestionResponse` | Validates both `document_id` and `text`. |
| POST | `/ingestion/upload_directory` | Zip of folder + `document_id` form field | `IngestionResponse` | Backend expects a packaged directory; frontend currently treats each file separately. |
| GET | `/ingestion/{document_id}/status` | Path `document_id` | `IngestionStatusResponse` (documents, errors, forensics/timeline/graph details) | Poll to show pipeline progress. |

Frontend action items:
- Normalize base URL (current code calls `/api/ingestion`).
- Support folder uploads by zipping/streaming per backend expectation.
- Surface `status_details` (ingestion count, graph stats, forensic artifacts) in the halo status HUD.

---

## Knowledge Graph & Graph Explorer (`DashboardHub`, `GraphExplorerPage`, `LegalTheoryPage`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/knowledge-graph/cypher-query` | JSON `{ "query": "...", "params": { ... }, "cache": true }` | `List[Dict[str, Any>]` (raw Neo4j records) | Used by `GraphExplorer.tsx`. Returns raw nodes/relationships; UI must parse. |
| POST | `/knowledge-graph/query` | Form/JSON `cypher_query`, optional `parameters` | `KnowledgeGraphData { nodes[], relationships[] }` | Structured graph suitable for typed viz. |
| GET | `/knowledge-graph/subgraph/{label}` | Path `label` | `{ "nodes": [], "edges": [] }` | Quick filtered view. |
| GET | `/knowledge-graph/causes-subgraph/{cause}` | Path `cause` | `{ nodes, edges }` | Align with Legal Theory module. |
| GET | `/knowledge-graph/legal-references/search?query=` | Query text | `List[Dict[str, Any>]` | For legal research panel search results. |

Frontend action items:
- Expose submodule toggles (Vector Space, Structured Graph, Heatmap) as presets hitting the appropriate endpoint.
- Provide error boundaries and caching; current implementation re-runs queries on every render.

---

## Legal Theory & AI Context Engine (`LegalTheoryPage`, `LegalDashboard`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/legal_theory/suggestions` | — | `List[LegalTheorySuggestion]` with `cause`, `score`, `elements`, `missing_elements`, etc. | Currently consumed, but no pagination or filtering. |
| GET | `/legal_theory/{cause}/subgraph` | Path `cause` | `LegalTheorySubgraph { nodes, edges }` | Feed into vis-network or halo viewport. |
| GET | `/legal_theory?query=&mode=` | Query text, optional `mode` (`semantic`, etc.) | `QueryResponse` (retrieval output). | Use for ad-hoc theory exploration. |
| GET | `/strategic-recommendations/get` (router included in `main.py`) | Implementation-specific body | Strategic plan payload (see `backend/app/api/strategic_recommendations.py`). | Needed for the Legal Dashboard’s “Strategic Recommendations” tab. |
| GET | `/predictive-analytics/outcome` | Query params (e.g., case id) | Predicted outcomes + probabilities. | Wire to the Predictive tab in the dashboard. |

Frontend action items:
- Replace mock data in `LegalDashboard` with the above endpoints and show loading/error states.
- Tie halo submodules (“Fact Pattern Extraction”, “Assertion Engine”, etc.) to actual calls.

---

## Live Co-Counsel Chat & Agent Runs (`LiveCoCounselChat`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/agents/invoke` | JSON `{ session_id, prompt, agent_name }` | `{ "response": "<agent text>" }` | Router is mounted with prefix `/agents`; frontend currently requests `/api/agents/invoke`. Requires session reuse for conversation continuity. |

Future enhancements:
- Expose agent roster via `MicrosoftAgentsOrchestrator`.
- Add streaming (SSE/WebSocket) for token-by-token updates.

---

## Timeline Builder (`TimelineDisplay`, `TimelineEventCreator`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/timeline` | Query `page`, `page_size` | `TimelineResponse { events[], pagination }` | Global feed. |
| GET | `/timeline/{case_id}` | Path `case_id` | `List[TimelineEventModel]` | Used in the UI; requires numeric `case_id` convertible to `int`. |
| POST | `/timeline/{case_id}/event` | JSON `{ event_text }` | `TimelineEventModel` | Backend auto-parses the text and writes via `TimelineManager`. |

Frontend action items:
- Stop hard-coding `caseId` and pass the active case context.
- Surface validation errors (backend returns `detail` messages).

---

## Trial Binder Creator & In-Court Presentation (`InCourtPresentationPage`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/cases` | — | List of cases. | Provided by `backend/app/api/cases.py`. |
| GET | `/api/documents` | — | List of documents/evidence. | Provided by `backend/app/api/documents.py`. |
| POST | `/prepare-binder` | JSON `{ case_name, evidence_list[] }` | `.docx` download (`FileResponse`). | Endpoint defined in `backend/app/api/binder_preparation.py`. |

Frontend action items:
- Align base URLs (drop `/api` prefix or proxy correctly).
- Persist presentation order/annotations server-side so reloads keep state.

---

## Mock Trial Arena (`components/mock-trial/*`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/mock-trial/start` | — | `GameState` | Initializes global simulation state. |
| POST | `/mock-trial/action` | `{ action: "presentEvidence"|"object"|..., payload? }` | `GameState` | Processes action + opponent turn. |
| GET | `/mock-trial/state` | — | `GameState` | Retrieve latest state (useful for reconnect). |
| POST | `/mock-trial/evaluate` | `{ ... }` | `{ evaluation_result: str }` | Placeholder for LegalTheoryEngine integration. |

Frontend action items:
- Add client-side session ID so multiple users don’t clobber the single global state.
- Display `log` entries, not just the canvas.

---

## Trial University (`TrialUniversityPanel`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/trial-university/lessons` | — | `List[Lesson { id, title, summary, progress, icon, video_url? }]` | Static data today. |
| GET | `/trial-university/lessons/{lesson_id}` | Path `lesson_id` | `Lesson` | For detail view. |

Frontend action items:
- POST completion/progress updates once endpoints exist.
- Integrate CTA linking lessons to ingest/graph scenes.

---

## Legal Research / Knowledge Retrieval

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/query` (router `legal_research`) | Query `query`, `mode` | `QueryResponse` (documents, citations, traces) | Will need to namespace under `/legal-research` via proxy. |
| GET | `/knowledge-graph/legal-references/search?query=` | Query text | `List[Dict[str, Any>]` | Use for case law entity search. |

Frontend action items:
- Add dedicated halo panel for Legal Research; display `QueryResponse.citations` and allow send-to-document-viewer.

---

## Document Drafting & Service of Process

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/draft-document` | `{ motion_type, case_id, data: { facts, theories, conflicts, ... } }` | Word document (`FileResponse`) | Clean up temp files after download. |
| POST | `/service-of-process/requests` (see `backend/app/api/service_of_process.py`) | `ServiceOfProcessRequest` | `ServiceOfProcessResponse` | Current UI is mostly placeholder; contract already exists. |

Frontend action items:
- Provide UI feedback while files download, and capture job IDs for later retrieval.

---

## Forensics & Crypto Tracing (`ForensicsReportPage`, `services/forensics_api.ts`)

| HTTP | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/forensics/{case_id}/{doc_type}/{doc_id}/forensics?version=` | Path params + optional version | `ForensicAnalysisResult` | Only valid for `doc_type="opposition_documents"`. |
| GET | `/forensics/{case_id}/{doc_type}/{doc_id}/crypto-tracing?version=` | Same | `CryptoTracingResult` | Returns wallets, transactions, optional Mermaid graph. |

Frontend action items:
- Align base URL (`services/forensics_api.ts` currently prepends `/api/v1`).
- Provide routing hooks from halo nodes to `ForensicsReportPage`.

---

## Timeline of Next Steps

Use this contract doc in tandem with `docs/audit/co-counsel-halo-audit.md` when implementing the Phase 2 “wave” work:
1. Build a typed API layer (React Query/axios) honoring the paths above.
2. Normalize auth + base URL handling once the gateway path is finalized.
3. For each halo module, replace mock data with the documented endpoint(s), persisting session context (case ID, active module) through a shared store.

