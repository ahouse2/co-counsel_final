# Agent & Tool Registry (Initial)

Purpose: Central map of agents and tools with ownership, inputs/outputs, and validation.

## Agents (initial roles)
- Coordinator/Co‑Counsel — orchestrates workflows; delegates; aggregates responses
- IngestionAgent — loaders, OCR, chunk, embed, persist
- GraphBuilderAgent — triples extract; ontology map; Neo4j upserts
- ResearchAgent — hybrid retrieval; citations; reasoning summary
- DraftingAgent — memos/briefs; cites + graph paths
- TimelineAgent — builds event timeline; provides API data
- QAAgent — rubric scoring; citation coverage; regression checks
- VoiceAgent — Whisper STT; Coqui TTS; session state
 - DocumentForensicsAgent — hashing, metadata, PDF/email structure
 - ImageForensicsAgent — EXIF, ELA, PRNU/clone detection
 - FinancialForensicsAgent — totals checks, anomalies, entities; optional leads

## Tools (seed list)
- Loaders — LlamaHub connectors (local, SharePoint/OneDrive/Outlook/Gmail/Slack/Confluence/Jira/GitHub/Google Drive/S3)
- OCR — Tesseract wrapper (optional)
- Embeddings — HF BGE small (default) pluggable
- Vector Stores — Qdrant/Chroma adapters
- Graph Store — Neo4j driver + Cypher utils
- Case Law — CourtListener/Web search adapters (as allowed)
- Security — redaction, privilege detector (stubs → prod)
- Forensics — media/doc/financial analysis stubs
 - Forensics Core — sha256 hasher; EXIF extractor; PDF parser; ELA; clone detection; email header parser; financial parsers

Notes
- Source references under `agents and tools/` (autogen, prior agents); integrate incrementally.
- Every tool must define: schema, security scope, observability fields, and tests.
