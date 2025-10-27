name: "Spec — Co-Counsel (MVP)"
version: 0.1

## APIs
- POST /ingest
  - Request body
    ```json
    {
      "sources": [
        {"type": "local", "path": "./data"},
        {"type": "sharepoint", "credRef": "secret-handle"}
      ]
    }
    ```
  - Success: **202 Accepted**
    ```json
    {"job_id": "uuid", "status": "queued|completed"}
    ```
  - Error: **400 Bad Request** when sources missing/invalid; **404 Not Found** for missing local path; **422 Unprocessable Entity** for unsupported source type.
- GET /query
  - Query params: `q` (string, required)
  - Success: **200 OK**
    ```json
    {
      "answer": "string summary",
      "citations": [{"docId": "...", "span": "...", "uri": "optional"}],
      "traces": {
        "vector": [{"id": "point-id", "score": 0.42, "docId": "..."}],
        "graph": {
          "nodes": [{"id": "entity-id", "type": "Entity", "properties": {...}}],
          "edges": [{"source": "doc", "target": "entity", "type": "MENTIONS", "properties": {...}}]
        }
      }
    }
    ```
  - Error: **200 OK** with fallback message when no evidence; **500 Internal Server Error** surfaces unexpected retrieval failures.
- GET /timeline
  - Success: **200 OK**
    ```json
    {
      "events": [
        {"id": "doc::event::0", "ts": "2024-10-26T00:00:00Z", "title": "string", "summary": "string", "citations": ["docId"]}
      ]
    }
    ```
  - Empty dataset returns an empty `events` array.
- GET /graph/neighbor
  - Query params: `id` (required node identifier)
  - Success: **200 OK**
    ```json
    {
      "nodes": [{"id": "entity::Acme", "type": "Entity", "properties": {"label": "Acme"}}],
      "edges": [{"source": "docId", "target": "entity::Acme", "type": "MENTIONS", "properties": {"evidence": "Acme"}}]
    }
    ```
  - Error: **404 Not Found** when the requested node is absent.
- GET /forensics/document
  - Query params: `id` (document identifier)
  - Success: **200 OK** with payload `{ "hashes": {...}, "metadata": {...}, "structure": {...}, "authenticity": {...} }`
  - Error: **404 Not Found** when no artifact recorded.
- GET /forensics/image
  - Query params: `id`
  - Success: **200 OK** returning `{ "metadata": {...}, "ela": {...}, "clones": [...], "authenticity_score": number }`
  - Error: **404 Not Found** if artifact missing.
- GET /forensics/financial
  - Query params: `id`
  - Success: **200 OK** returning `{ "totals": {...}, "anomalies": [...], "entities": [...], "summary": "..." }`
  - Error: **404 Not Found** when dataset has not been processed.

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
