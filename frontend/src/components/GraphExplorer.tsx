import { motion } from 'framer-motion';
import React, { useState, useCallback, useEffect } from 'react';
import { Network, DataSet } from 'vis-network/standalone'; // Import vis-network

interface GraphNode {
  id: string;
  labels: string[];
  properties: { [key: string]: any };
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: { [key: string]: any };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function GraphExplorer() {
  const [cypherQuery, setCypherQuery] = useState('MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    setGraphData(null);
    try {
      const response = await fetch('/knowledge-graph/cypher-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: cypherQuery, params: {} }), // Assuming no dynamic params for now
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to execute query: ${response.statusText}`);
      }

      const rawData: Array<any> = await response.json();
      
      const nodesMap = new Map<string, GraphNode>();
      const edges: GraphEdge[] = [];

      rawData.forEach(record => {
        // Extract nodes and relationships from the record
        // This parsing logic might need to be more sophisticated depending on the Cypher RETURN clause
        for (const key in record) {
          const item = record[key];
          if (item && typeof item === 'object' && item.identity !== undefined && item.labels !== undefined) {
            // It's a node
            const nodeId = String(item.identity);
            if (!nodesMap.has(nodeId)) {
              nodesMap.set(nodeId, {
                id: nodeId,
                labels: item.labels,
                properties: item.properties,
              });
            }
          } else if (item && typeof item === 'object' && item.start !== undefined && item.end !== undefined && item.type !== undefined) {
            // It's a relationship
            edges.push({
              source: String(item.start),
              target: String(item.end),
              type: item.type,
              properties: item.properties,
            });
          }
        }
      });

      setGraphData({ nodes: Array.from(nodesMap.values()), edges: edges });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cypherQuery]);

  useEffect(() => {
    executeQuery(); // Execute default query on component mount
  }, [executeQuery]);

  // Effect for vis-network visualization
  useEffect(() => {
    if (graphData && graphData.nodes.length > 0) {
      const container = document.getElementById('mynetwork');
      if (container) {
        const nodes = new DataSet(
          graphData.nodes.map((node) => ({
            id: node.id,
            label: node.labels.join('\n'),
            title: JSON.stringify(node.properties, null, 2),
            color: '#8be9fd', // Example color
          }))
        );

        const edges = new DataSet(
          graphData.edges.map((edge, index) => ({
            id: index.toString(),
            from: edge.source,
            to: edge.target,
            label: edge.type,
            title: JSON.stringify(edge.properties, null, 2),
            arrows: 'to',
            color: { color: '#f1fa8c' }, // Example color
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
  }, [graphData]);

  return (
    <motion.div
      className="graph-explorer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
    >
      <div className="graph-header">
        <h2 className="text-text-primary">Graph Explorer</h2>
        <p className="text-text-secondary">Visualize connections between entities using Cypher queries.</p>
      </div>
      <div className="mt-4">
        <label htmlFor="cypherQuery" className="block text-sm font-medium text-text-secondary mb-1">Cypher Query</label>
        <textarea
          id="cypherQuery"
          rows={5}
          className="cds-input-cinematic w-full"
          value={cypherQuery}
          onChange={(e) => setCypherQuery(e.target.value)}
          placeholder="Enter your Cypher query here..."
          disabled={loading}
        />
        <button
          onClick={executeQuery}
          className="c-btn shimmer-btn mt-2"
          disabled={loading}
        >
          {loading ? 'Executing Query...' : 'Execute Query'}
        </button>
      </div>
      <div className="graph-canvas bg-background-surface p-4 mt-4 rounded-lg min-h-[400px] overflow-auto custom-scrollbar">
        {loading && <span className="text-text-tertiary">Loading Graph...</span>}
        {error && <span className="text-accent-red">Error: {error}</span>}
        {graphData && graphData.nodes.length > 0 && (
          <div id="mynetwork" className="w-full h-[500px] border border-border-default rounded-lg">
            {/* vis-network will render here */}
          </div>
        )}
        {!loading && !error && (!graphData || graphData.nodes.length === 0) && (
          <span className="text-text-tertiary">No Graph Data Available. Try a different query.</span>
        )}
      </div>
    </motion.div>
  );
}
