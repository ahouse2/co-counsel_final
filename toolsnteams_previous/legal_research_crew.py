from crewai import Crew, Process
from agents import LegalDiscoveryAgents
from tasks import LegalDiscoveryTasks
from toolsnteams_previous.knowledge_ingestion_task import KnowledgeIngestionTask

class LegalResearchCrew:
    def __init__(self):
        self.agents = LegalDiscoveryAgents()
        self.tasks = LegalDiscoveryTasks()
        self.knowledge_ingestion_task = KnowledgeIngestionTask()

    def crew(self):
        _crew = Crew(
            agents=[
                self.agents.case_law_research_agent(),
                self.agents.statute_regulation_research_agent(),
                self.agents.procedure_court_rules_agent(),
                self.agents.evidence_law_expert_agent(),
                self.agents.legal_history_context_agent(),
                self.agents.research_coordinator_integrator_agent()
            ],
            tasks=[
                self.tasks.case_law_research_task(),
                self.tasks.statute_regulation_research_task(),
                self.tasks.procedure_rules_research_task(),
                self.tasks.evidence_law_research_task(),
                self.tasks.legal_history_research_task(),
                self.tasks.compile_research_report_task()
            ],
            process=Process.hierarchical,
            manager_llm=self.agents.research_coordinator_integrator_agent().llm,
            verbose=True
        )
        
        # In a real scenario, the compile_research_report_task would return structured results.
        # For now, we'll use a placeholder and simulate the ingestion.
        # TODO: Replace this placeholder with actual output from compile_research_report_task
        # that is structured for ingestion.
        placeholder_research_results = [
            {
                "category": "case_law",
                "title": "Simulated Case Law Result",
                "text": "This is a simulated summary of a case law research result.",
                "url": "http://example.com/simulated_case",
                "retrieved_at": "2025-11-12 10:00:00",
                "theories": ["Simulated Legal Theory 1"]
            },
            {
                "category": "statute",
                "title": "Simulated Statute Result",
                "text": "This is a simulated summary of a statutory research result.",
                "url": "http://example.com/simulated_statute",
                "retrieved_at": "2025-11-12 10:05:00",
                "theories": ["Simulated Legal Theory 2"]
            }
        ]
        
        # Simulate ingestion after the crew has "completed" its research tasks
        # In a real CrewAI setup, this would be part of a subsequent task or a callback.
        self.knowledge_ingestion_task.ingest_research_results(placeholder_research_results)
        
        return _crew

