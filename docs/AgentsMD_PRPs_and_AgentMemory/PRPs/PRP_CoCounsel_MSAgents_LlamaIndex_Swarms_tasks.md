name: "Tasks — Co-Counsel MVP"
status: draft

## Phase 1 — Foundation
- [ ] Repo wiring: env, settings, logging, OTel stubs
- [ ] Data stores: Qdrant/Chroma driver; Neo4j driver; config
- [ ] API skeleton: FastAPI/Flask with endpoints stubs

## Phase 2 — Ingestion
- [ ] Folder uploads; LlamaHub loader registry + local file loader
- [ ] OCR (Tesseract or equivalent) + Vision‑LLM agent for classification/tagging/scanned docs
- [ ] Chunking + embeddings (HF BGE small by default)
- [ ] Persist vector index; metadata schema

## Phase 3 — GraphRAG
- [ ] Triples extraction prompt and parser
- [ ] Cypher upsert utils; constraints
- [ ] Ontology seed; id normalization

## Phase 4 — Forensics Core (Non‑Negotiable)
- [ ] Hashing (SHA‑256) and metadata extraction for all files
- [ ] PDF structure and email header analysis
- [ ] Image authenticity: EXIF, ELA, PRNU/clone detection (where feasible)
- [ ] Financial forensics baseline: totals checks, anomalies, entity extraction
- [ ] Forensics artifact outputs per file + API endpoints

## Phase 5 — Retrieval
- [ ] Hybrid retriever; citation extraction
- [ ] Tracing of retrieval contexts
- [ ] “Cite or silence” guardrails

## Phase 6 — UI
- [ ] Chat panel with streaming
- [ ] Citations panel w/ deep links
- [ ] Timeline list bound to KG
- [ ] Forensics report views (document/image/financial)

## Phase 7 — QA & Validation
- [ ] Unit tests for loaders, graph upserts, retriever
- [ ] Integration flow on sample corpus
- [ ] E2E scripted journey
