import os
from typing import List, Dict, Any
from toolsnteams_previous.knowledge_graph_manager import KnowledgeGraphManager

class KnowledgeIngestionTask:
    def __init__(self):
        self.kg_manager = KnowledgeGraphManager()

    def ingest_research_results(self, research_results: List[Dict[str, Any]]):
        """
        Ingests structured legal research results into the Knowledge Graph.

        Args:
            research_results: A list of dictionaries, where each dictionary represents
                              a piece of legal research (e.g., case law, statute).
                              Expected format for each item:
                              {
                                  "category": "case_law" or "statute",
                                  "title": "Case Name / Statute Title",
                                  "text": "Summary or relevant text",
                                  "url": "URL to source",
                                  "retrieved_at": "YYYY-MM-DD HH:MM:SS",
                                  "theories": ["theory1", "theory2"] # Optional
                              }
        """
        print(f"Ingesting {len(research_results)} research results into the Knowledge Graph...")
        for result in research_results:
            try:
                self.kg_manager.add_legal_reference(
                    category=result["category"],
                    title=result["title"],
                    text=result["text"],
                    url=result["url"],
                    retrieved_at=result["retrieved_at"],
                    theories=result.get("theories")
                )
                print(f"Successfully ingested: {result['title']}")
            except Exception as e:
                print(f"Error ingesting {result.get('title', 'unknown')}: {e}")
        print("Knowledge Graph ingestion complete.")

# Example usage (for testing purposes)
if __name__ == "__main__":
    # Ensure NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD are set in your environment
    # For local testing, you might need to run a Neo4j instance (e.g., via Docker)
    # docker run --name neo4j-test -p 7687:7687 -p 7474:7474 -e NEO4J_AUTH=neo4j/password neo4j:latest

    # Mock research results
    mock_results = [
        {
            "category": "case_law",
            "title": "Roe v. Wade",
            "text": "A landmark decision by the United States Supreme Court.",
            "url": "https://en.wikipedia.org/wiki/Roe_v._Wade",
            "retrieved_at": "1973-01-22 00:00:00",
            "theories": ["Right to Privacy", "Abortion Rights"]
        },
        {
            "category": "statute",
            "title": "Civil Rights Act of 1964",
            "text": "Outlaws discrimination based on race, color, religion, sex, national origin.",
            "url": "https://en.wikipedia.org/wiki/Civil_Rights_Act_of_1964",
            "retrieved_at": "1964-07-02 00:00:00",
            "theories": ["Equal Protection", "Anti-Discrimination"]
        }
    ]

    ingestion_task = KnowledgeIngestionTask()
    ingestion_task.ingest_research_results(mock_results)
