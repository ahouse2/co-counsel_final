# Co-Counsel Workflow Implementation Roadmap

## Vision
- Deliver fully operational FastAPI service that honors the PRP contracts and persists knowledge artifacts across Neo4j, Qdrant, and filesystem storage.
- Embed deterministic, locally runnable analytics to support ingestion, retrieval, timeline, graph, and forensics workflows end-to-end.

## Phase 1 — Foundations
- ### Configuration Architecture
  - #### Settings Source
    - ##### Environment variables override sensible defaults for service URLs and storage paths.
    - ##### Support in-memory fallbacks for local testing (Neo4j `memory://`, Qdrant `:memory:`).
  - #### Resource Bootstrapping
    - ##### Ensure directories for vectors, forensics, timelines, and job metadata exist on load.
    - ##### Create schema management helpers for Neo4j constraints and Qdrant collections.
- ### Data Model Definitions
  - #### Pydantic Schemas
    - ##### IngestionSource, IngestionRequest, IngestionResponse.
    - ##### QueryResponse, Citation, Trace structures.
    - ##### TimelineEvent schema, GraphNode/Edge, Forensics payloads.

## Phase 2 — Workflow Engines
- ### Ingestion Pipeline
  - #### Source Handlers
    - ##### Local filesystem enumerator with recursive traversal + MIME detection.
    - ##### SharePoint placeholder rejection with actionable error (explicitly unsupported until credentials provided).
  - #### Text Processing
    - ##### UTF-8 normalization + fallback decoding.
    - ##### Semantic chunker (400 char windows with overlap) with metadata propagation.
  - #### Embedding Strategy
    - ##### Deterministic hashed term-frequency vectorizer (dimension 128) using SHA-256.
    - ##### Unit-length normalization for cosine-friendly similarity.
  - #### Persistence
    - ##### Upsert Qdrant points with document + chunk metadata.
    - ##### Create/update Neo4j nodes: `Document`, `Entity`, `MENTIONS` relationships.
    - ##### Extract simple events (date regex) and append to timeline store.
    - ##### Generate forensics artifacts per modality and save under storage tree.
    - ##### Record ingestion job manifest with completion timestamp + artifacts.

- ### Retrieval Engine
  - #### Vector Search
    - ##### Query embedding using same hashing vectorizer.
    - ##### Top-k search against Qdrant with payload fetch.
  - #### Graph Expansion
    - ##### Identify entity ids from retrieved payloads.
    - ##### Pull two-hop neighborhood via GraphService abstraction.
  - #### Response Composer
    - ##### Construct concise answer summary from highest-score chunk(s).
    - ##### Attach citations (doc id, span excerpt, optional file URI).
    - ##### Provide trace data for vectors (scores, chunk ids) and graph (nodes/edges).

- ### Timeline Service
  - #### Storage Format
    - ##### JSONL backed by append-only writes, read with ordering by timestamp.
  - #### API Logic
    - ##### Filter/normalize timestamps, default ordering descending recency.

- ### Graph Service
  - #### Query Endpoint
    - ##### Validate requested id exists.
    - ##### Return typed nodes/edges with properties sanitized for JSON serialization.

- ### Forensics Services
  - #### Document Forensics
    - ##### Hash digests (SHA256, MD5), size, word/line counts, MIME detection.
  - #### Image Forensics
    - ##### Metadata via Pillow (dimensions, mode, EXIF if present).
    - ##### Error Level Analysis heatmap score (per-channel mean absolute diff).
    - ##### Clone detection heuristic via block hashing (avg hash) comparisons.
  - #### Financial Forensics
    - ##### CSV/Excel ingestion (pandas-free) using `csv` module.
    - ##### Column typing heuristics; totals for numeric columns; anomaly detection via z-score.

## Phase 3 — API Wiring & Contracts
- ### FastAPI Router Composition
  - #### Dependency Injection
    - ##### Provide service singletons (Settings, GraphService, VectorService, TimelineStore, ForensicsStore).
  - #### Endpoint Implementations
    - ##### `/ingest` returns 202 + job id, synchronous job execution for MVP.
    - ##### `/query` returns retrieval payloads with citations and traces.
    - ##### `/timeline` streams timeline events.
    - ##### `/graph/neighbor` surfaces neighbor graph.
    - ##### `/forensics/document|image|financial` loads saved artifacts and handles missing cases gracefully.

## Phase 4 — Testing & Quality Gates
- ### Unit Tests
  - #### Vectorizer, chunker, and timeline parsers with deterministic outputs.
- ### Integration Tests
  - #### FastAPI client covering happy paths and error scenarios for each endpoint.
  - #### Temporary storage + in-memory services to guarantee hermeticity.
- ### Documentation Traceability
  - #### Expand PRP doc with explicit payload/status references per endpoint.

## Phase 5 — Polish & Compliance
- ### Repository Hygiene
  - #### Update requirements, ensure dependency locking.
  - #### Append chain-of-stewardship entry.
- ### Validation
  - #### Run pytest suite; ensure zero lint/test failures.
  - #### Manual code inspection pass (two iterations minimum) before submission.

