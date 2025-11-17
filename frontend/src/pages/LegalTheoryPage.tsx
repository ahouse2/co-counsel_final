import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Network, DataSet } from 'vis-network/standalone'; // Import vis-network

interface LegalTheorySuggestion {
  cause: string;
  score: number;
  elements: Array<{ name: string; facts: Array<any>; weight: number }>;
  defenses: string[];
  indicators: string[];
  missing_elements: string[];
}

interface LegalTheorySubgraph {
  nodes: Array<any>;
  edges: Array<any>;
}

const LegalTheoryPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<LegalTheorySuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState<string | null>(null);
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const [subgraph, setSubgraph] = useState<LegalTheorySubgraph | null>(null);
  const [isLoadingSubgraph, setIsLoadingSubgraph] = useState(false);
  const [errorSubgraph, setErrorSubgraph] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setErrorSuggestions(null);
    try {
      const response = await fetch('/legal_theory/suggestions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: LegalTheorySuggestion[] = await response.json();
      setSuggestions(data);
    } catch (e: any) {
      setErrorSuggestions(e.message);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const fetchSubgraph = useCallback(async (cause: string) => {
    setIsLoadingSubgraph(true);
    setErrorSubgraph(null);
    try {
      const response = await fetch(`/legal_theory/${cause}/subgraph`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: LegalTheorySubgraph = await response.json();
      setSubgraph(data);
    } catch (e: any) {
      setErrorSubgraph(e.message);
    } finally {
      setIsLoadingSubgraph(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (selectedCause) {
      fetchSubgraph(selectedCause);
    } else {
      setSubgraph(null);
    }
  }, [selectedCause, fetchSubgraph]);

  // Effect for vis-network visualization
  useEffect(() => {
    if (subgraph && subgraph.nodes.length > 0) {
      const container = document.getElementById('legalTheorySubgraphNetwork');
      if (container) {
        const nodes = new DataSet(
          subgraph.nodes.map((node: any) => ({
            id: node.id,
            label: node.labels.join('\n'),
            title: JSON.stringify(node.properties, null, 2),
            color: '#bd93f9', // Example color for legal theory nodes
          }))
        );

        const edges = new DataSet(
          subgraph.edges.map((edge: any, index: number) => ({
            id: index.toString(),
            from: edge.source,
            to: edge.target,
            label: edge.type,
            title: JSON.stringify(edge.properties, null, 2),
            arrows: 'to',
            color: { color: '#ff79c6' }, // Example color for legal theory edges
          }))
        );

        const data = { nodes, edges };
        const options = {
          physics: {
            enabled: true,
            barnesHut: {
              gravitationalConstant: -2000,
              centralGravity: 0.3,
              springLength: 95,
              springConstant: 0.04,
              damping: 0.09,
              avoidOverlap: 0.5,
            },
            solver: 'barnesHut',
          },
          interaction: {
            navigationButtons: true,
            keyboard: true,
          },
          edges: {
            font: {
              align: 'middle',
            },
          },
        };

        const network = new Network(container, data, options);

        // Cleanup function
        return () => {
          network.destroy();
        };
      }
    }
  }, [subgraph]);

  return (
    <div className="cds-main-cinematic">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Legal Theory Formulation</h1>
      <p className="text-text-secondary mb-6">Explore suggested legal theories and their supporting evidence from the knowledge graph.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Legal Theory Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="cds-card-cinematic p-6"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4">Suggested Theories</h2>
          {isLoadingSuggestions && <p className="text-text-secondary">Loading suggestions...</p>}
          {errorSuggestions && <p className="text-accent-red">Error: {errorSuggestions}</p>}
          <ul className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.cause}
                className={`bg-background-surface p-4 rounded-lg cursor-pointer hover:bg-background-panel transition-colors ${
                  selectedCause === suggestion.cause ? 'border-2 border-accent-cyan' : 'border border-border-soft'
                }`}
                onClick={() => setSelectedCause(suggestion.cause)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCause(suggestion.cause);
                  }
                }}
              >
                <h3 className="font-semibold text-text-primary">{suggestion.cause.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <p className="text-sm text-text-secondary">Score: {suggestion.score.toFixed(2)}</p>
                <p className="text-sm text-text-tertiary mt-2">Missing Elements: {suggestion.missing_elements.join(', ') || 'None'}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Subgraph Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="cds-card-cinematic p-6"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4">Knowledge Graph Subgraph</h2>
          {isLoadingSubgraph && <p className="text-text-secondary">Loading subgraph...</p>}
          {errorSubgraph && <p className="text-accent-red">Error: {errorSubgraph}</p>}
          {!selectedCause && <p className="text-text-secondary">Select a theory to view its subgraph.</p>}
          {subgraph && (
            <div className="bg-background-panel p-4 rounded-lg h-96 overflow-auto custom-scrollbar">
              <div id="legalTheorySubgraphNetwork" className="w-full h-[500px] border border-border-default rounded-lg">
                {/* vis-network will render here */}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LegalTheoryPage;
