"""End-to-end LlamaIndex ingestion orchestration."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Sequence

from importlib import import_module
from importlib.util import find_spec

from backend.app.models.api import IngestionSource
from backend.app.utils.triples import EntitySpan, Triple, extract_entities, extract_triples
from backend.app.forensics.analyzer import ForensicAnalyzer
from backend.app.forensics.crypto_tracer import CryptoTracer
from backend.app.forensics.models import ForensicAnalysisResult, CryptoTracingResult

from .loader_registry import LoadedDocument, LoaderRegistry
from .llama_index_factory import (
    configure_global_settings,
    create_embedding_model,
    create_sentence_splitter,
    create_llm_service, # Added
    BaseLlmService, # Added
)
from .metrics import record_document_yield, record_node_yield, record_pipeline_metrics
from .settings import LlamaIndexRuntimeConfig
from .fallback import MetadataModeEnum
from .categorization import categorize_document, tag_document

import re # Added for regex
import logging # Added for logging

logger = logging.getLogger(__name__) # Initialize logger

def _has_spec(path: str) -> bool:
    try:
        return find_spec(path) is not None
    except ModuleNotFoundError:
        return False


def _resolve_metadata_mode() -> object:
    if not _has_spec("llama_index.core.schema"):
        return MetadataModeEnum
    try:
        module = import_module("llama_index.core.schema")
        return getattr(module, "MetadataMode")
    except (ModuleNotFoundError, AttributeError):
        return MetadataModeEnum


MetadataMode = _resolve_metadata_mode()
METADATA_MODE_ALL = getattr(MetadataMode, "ALL", MetadataModeEnum.ALL)


@dataclass
class PipelineNodeRecord:
    node_id: str
    text: str
    embedding: List[float]
    metadata: Dict[str, object]
    chunk_index: int


@dataclass
class DocumentPipelineResult:
    loaded: LoadedDocument
    nodes: List[PipelineNodeRecord]
    entities: List[EntitySpan]
    triples: List[Triple] = field(default_factory=list)
    categories: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    forensic_analysis_result: Optional[ForensicAnalysisResult] = None # Added
    crypto_tracing_result: Optional[CryptoTracingResult] = None # Added


@dataclass
class PipelineResult:
    job_id: str
    source: IngestionSource
    documents: List[DocumentPipelineResult] = field(default_factory=list)

    @property
    def node_count(self) -> int:
        return sum(len(doc.nodes) for doc in self.documents)


def _extract_legal_metadata(text: str, llm_service: BaseLlmService) -> Dict[str, Any]:
    """
    Extracts legal-specific metadata from the document text.
    For now, this uses simple regex. In a more advanced implementation, this would
    involve more sophisticated NLP or LLM calls.
    """
    metadata = {}

    # Example: Extract a date (very basic, needs improvement for real-world use)
    date_match = re.search(r'\b(\d{1,2}/\d{1,2}/\d{2,4}|\d{4}-\d{2}-\d{2})\b', text)
    if date_match:
        metadata["document_date"] = date_match.group(0)

    # Example: Extract a case number (placeholder)
    case_number_match = re.search(r'Case No\.\s*([A-Z0-9-]+)', text, re.IGNORECASE)
    if case_number_match:
        metadata["case_number"] = case_number_match.group(1)
    
    # Example: Extract parties (placeholder, highly complex in reality)
    # This would typically require advanced NLP to identify plaintiffs, defendants, etc.
    # For now, we'll just add a placeholder.
    metadata["parties"] = ["Plaintiff (Placeholder)", "Defendant (Placeholder)"]

    # Example: Extract jurisdiction (placeholder)
    metadata["jurisdiction"] = "Federal (Placeholder)"

    # In a real application, you might use the LLM service here for more accurate extraction:
    # try:
    #     llm_response = llm_service.generate_text(f"Extract key legal metadata (date, parties, jurisdiction, case_name, case_number) from the following text:\n\n{text}")
    #     # Parse llm_response to populate metadata
    # except Exception as e:
    #     print(f"LLM metadata extraction failed: {e}")

    return metadata


def _clean_document_text(text: str) -> str:
    """
    Performs basic cleaning and normalization on document text.
    - Removes excessive whitespace.
    - Standardizes line endings.
    - (Future) Could remove common boilerplate text.
    """
    # Remove excessive whitespace (multiple spaces/tabs to single space)
    text = re.sub(r'\s+', ' ', text).strip()
    # Standardize line endings to a single newline character
    text = re.sub(r'(\r\n|\r|\n)+', '\n', text)
    return text


def run_ingestion_pipeline(
    job_id: str,
    materialized_root: Path,
    source: IngestionSource,
    origin: str,
    *,
    registry: LoaderRegistry,
    runtime_config: LlamaIndexRuntimeConfig,
) -> PipelineResult:
    """Materialise documents, chunk into nodes, and enrich with embeddings."""

    configure_global_settings(runtime_config)
    splitter = create_sentence_splitter(runtime_config.tuning)
    embedding_model = create_embedding_model(runtime_config.embedding)
    llm_service = create_llm_service(runtime_config.llm) # Create LLM service

    with record_pipeline_metrics(source.type.lower(), job_id):
        try:
            loaded_documents = registry.load_documents(materialized_root, source, origin=origin)
            logger.info(f"Loaded {len(loaded_documents)} documents for job {job_id}")
        except Exception as e:
            logger.error(f"Error loading documents for job {job_id}: {e}", exc_info=True)
            raise

        record_document_yield(len(loaded_documents), source_type=source.type.lower(), job_id=job_id)
        
        documents = []
        for loaded in loaded_documents:
            try:
                processed_doc = _process_loaded_document(loaded, splitter, embedding_model, llm_service)
                documents.append(processed_doc)
            except Exception as e:
                logger.error(f"Error processing document {loaded.path} for job {job_id}: {e}", exc_info=True)
                # Depending on policy, might continue or re-raise
                continue # Continue processing other documents even if one fails

        total_nodes = sum(len(doc.nodes) for doc in documents)
        record_node_yield(total_nodes, source_type=source.type.lower(), job_id=job_id)
        logger.info(f"Ingestion pipeline completed for job {job_id} with {total_nodes} nodes.")
        return PipelineResult(job_id=job_id, source=source, documents=documents)


def _process_loaded_document(
    loaded: LoadedDocument,
    splitter,
    embedding_model,
    llm_service: BaseLlmService, # Accept LLM service
) -> DocumentPipelineResult:
    logger.info(f"Processing document: {loaded.path}")
    
    try:
        # Clean and normalize document text
        cleaned_text = _clean_document_text(loaded.text)
    except Exception as e:
        logger.warning(f"Error cleaning document text for {loaded.path}: {e}", exc_info=True)
        cleaned_text = loaded.text # Fallback to original text

    try:
        nodes = _split_nodes(splitter, loaded.document)
        pipeline_nodes: List[PipelineNodeRecord] = []
    except Exception as e:
        logger.error(f"Error splitting document {loaded.path} into nodes: {e}", exc_info=True)
        nodes = [] # Continue with empty nodes if splitting fails

    try:
        # Extract legal-specific metadata
        legal_metadata = _extract_legal_metadata(cleaned_text, llm_service)
    except Exception as e:
        logger.warning(f"Error extracting legal metadata for {loaded.path}: {e}", exc_info=True)
        legal_metadata = {} # Continue with empty metadata

    for index, node in enumerate(nodes):
        try:
            text = node.get_content(metadata_mode=METADATA_MODE_ALL)
            vector = embedding_model.get_text_embedding(text)
            metadata = dict(getattr(node, "metadata", {}) or {})
            metadata.setdefault("source_path", str(loaded.path))
            metadata.setdefault("source_type", loaded.source.type.lower())
            
            # Add extracted legal metadata to each node's metadata
            metadata.update(legal_metadata)

            pipeline_nodes.append(
                PipelineNodeRecord(
                    node_id=node.node_id,
                    text=text,
                    embedding=vector,
                    metadata=metadata,
                    chunk_index=index,
                )
            )
        except Exception as e:
            logger.warning(f"Error processing node {index} for document {loaded.path}: {e}", exc_info=True)
            continue # Continue to next node

    try:
        entities = extract_entities(cleaned_text)
    except Exception as e:
        logger.warning(f"Error extracting entities for {loaded.path}: {e}", exc_info=True)
        entities = []

    try:
        triples = extract_triples(cleaned_text)
    except Exception as e:
        logger.warning(f"Error extracting triples for {loaded.path}: {e}", exc_info=True)
        triples = []
    
    try:
        # Categorization and Tagging
        categories = categorize_document(cleaned_text, llm_service) # Use llm_service
        tags = tag_document(cleaned_text, llm_service) # Use llm_service
    except Exception as e:
        logger.warning(f"Error categorizing/tagging document {loaded.path}: {e}", exc_info=True)
        categories = []
        tags = []

    forensic_analysis_result = None
    crypto_tracing_result = None

    doc_type = loaded.source.metadata.get("doc_type")
    if doc_type == "opposition_documents":
        try:
            forensic_analyzer = ForensicAnalyzer()
            forensic_analysis_result = forensic_analyzer.analyze_document(
                document_id=loaded.source.source_id,
                document_content=loaded.document.text.encode('utf-8'), # Assuming text can be encoded
                metadata=loaded.source.metadata,
            )
        except Exception as e:
            logger.warning(f"Error during forensic analysis for {loaded.path}: {e}", exc_info=True)
        
        try:
            crypto_tracer = CryptoTracer()
            crypto_tracing_result = crypto_tracer.trace_document_for_crypto(
                document_content=loaded.document.text,
                document_id=loaded.source.source_id,
            )
        except Exception as e:
            logger.warning(f"Error during crypto tracing for {loaded.path}: {e}", exc_info=True)

    logger.info(f"Successfully processed document: {loaded.path}")
    return DocumentPipelineResult(
        loaded=loaded,
        nodes=pipeline_nodes,
        entities=entities,
        triples=triples,
        categories=categories,
        tags=tags,
        forensic_analysis_result=forensic_analysis_result, # Added
        crypto_tracing_result=crypto_tracing_result, # Added
    )


def _split_nodes(splitter, document) -> Sequence[Any]:
    nodes = splitter.get_nodes_from_documents([document])
    return nodes


__all__ = ["PipelineResult", "run_ingestion_pipeline"]
