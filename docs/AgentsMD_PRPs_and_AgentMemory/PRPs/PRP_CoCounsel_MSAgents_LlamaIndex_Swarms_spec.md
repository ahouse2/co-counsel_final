name: "Spec — Co-Counsel (MVP)"
version: 0.1

## APIs
- POST /ingest
  - Body: { sources: [ {type:"local", path:"./data"}, {type:"sharepoint", credRef:"..."} ] }
  - 202 Accepted; job id returned
- GET /query
  - Params: q (string)
  - 200: { answer: string, citations: [ {docId, span, url?} ], traces: {vector: [...], graph: [...]}}
- GET /timeline
  - 200: { events: [ {id, ts, title, summary, citations: [...] } ] }
- GET /graph/neighbor
  - Params: id (entity id)
  - 200: { nodes: [...], edges: [...] }
 - GET /forensics/document
   - Params: id (file id)
   - 200: { hash: {...}, metadata: {...}, structure: {...}, authenticity: {...} }
 - GET /forensics/image
   - Params: id (file id)
   - 200: { exif: {...}, ela: {...}, prnu?: {...}, clones?: [...], authenticity_score: number }
 - GET /forensics/financial
   - Params: id (file id)
   - 200: { totals: {...}, anomalies: [...], entities: [...], summary: string }

## Data Models (sketch)
- Document { id, uri, type, metadata }
- Chunk { id, docId, text, embedding, metadata }
- Entity(node) { id, type, props }
- Relation(edge) { src, rel, dst, props }
 - ForensicsArtifact { fileId, hashes, metadata, structure, authenticity, financial }

## Constraints
- Neo4j: unique(id) per Entity; rel types UPPER_SNAKE_CASE
- Vector store path: ./storage/vector (configurable)
 - Forensics artifacts written per file under ./storage/forensics/{fileId}/

## Agents Workflow (MS Agents)
- Nodes: Ingestion -> GraphBuilder -> Research -> Timeline
- Context: case_id, run_id, user_id; persisted in thread/memory
- Telemetry: OTel spans; logs include retrieval contexts + token usage
 - Forensics nodes: DocumentForensicsAgent, ImageForensicsAgent, FinancialForensicsAgent (run post‑ingest for applicable files)

## Retrieval Logic
1) vector_results = VectorSearch(q, top_k=8)
2) graph_context = GraphNeighborhood(entities_from(vector_results), radius=2)
3) prompt LLM with q + vector snippets + graph triples
4) enforce cite-or-silence; produce structured output with citations

## Non-Functional
- Local-first, offline-capable for core flows
- Reproducible runs; deterministic seeds where possible
- Reasonable perf on laptop-scale corpora
 - Provider policy: default Gemini‑2.5‑Flash; optional GPT‑5.0 via config
