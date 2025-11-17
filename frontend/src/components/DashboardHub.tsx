
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { cn } from '@/lib/utils';

type Submodule = {
  id: string;
  label: string;
  description: string;
  status: string;
};

type PrimaryModule = {
  id: string;
  label: string;
  icon: string;
  synopsis: string;
  focusNode: {
    type: string;
    summary: string;
    cases: string[];
  };
  submodules: Submodule[];
};

const PRIMARY_MODULES: PrimaryModule[] = [
  {
    id: 'graph',
    label: 'Graph Explorer',
    icon: 'fa-diagram-project',
    synopsis: 'Trace relationships between witnesses, filings, and evidence clusters.',
    focusNode: {
      type: 'Document',
      summary: 'A document related to the divorce',
      cases: ['Case No-201', 'Smith v. Smith'],
    },
    submodules: [
      { id: 'vector', label: 'Vector Space View', description: 'Embeddings plotted against opposing counsel strategy vectors.', status: 'Live sampling' },
      { id: 'structured', label: 'Structured Graph View', description: 'Neo4j backed node explorer with semantic filters.', status: 'Synced • 2 mins ago' },
      { id: 'heatmap', label: 'Relationship Heatmap', description: 'Color density map of co-reference strength.', status: 'Cooling' },
      { id: 'query', label: 'Autonomous Query Panel', description: 'Launch autonomous retrieval queries with guardrails.', status: 'Idle' },
      { id: 'agents', label: 'Agent Interaction Overlay', description: 'Visualize cooperative agent negotiations.', status: 'Live' },
    ],
  },
  {
    id: 'evidence',
    label: 'Evidence Ingestion',
    icon: 'fa-cloud-arrow-up',
    synopsis: 'Pipeline for OCR, embeddings, hashing, and chain of custody.',
    focusNode: {
      type: 'Folder',
      summary: 'Batch upload queued with checksum validation.',
      cases: ['Case No-404', 'US v. Fenwick'],
    },
    submodules: [
      { id: 'folder', label: 'Folder Upload', description: 'Drag-and-drop secure batch uploader.', status: 'Ready' },
      { id: 'ocr', label: 'OCR + Embedding', description: 'GPU accelerated OCR with doc-vector fusion.', status: 'Running' },
      { id: 'metadata', label: 'Metadata Verification', description: 'Auto-detect tampering and timestamp drift.', status: 'Verifying' },
      { id: 'fault', label: 'Fault Tolerance Logs', description: 'Replay ingestion state machines.', status: 'Nominal' },
      { id: 'hash', label: 'File Hashing / Dedup', description: 'SHA-256 deduplication + parity archive.', status: 'Complete' },
    ],
  },
  {
    id: 'context',
    label: 'AI Context Engine',
    icon: 'fa-brain',
    synopsis: 'Synthesize fact patterns for active matters and cross-link strategy.',
    focusNode: {
      type: 'Insight',
      summary: 'Extracted element aligns with new affidavit testimony.',
      cases: ['Case No-078', 'Lee v. Mercer'],
    },
    submodules: [
      { id: 'fact', label: 'Fact Pattern Extraction', description: 'LLM chaining tuned to civilian statements.', status: 'Review' },
      { id: 'link', label: 'Legal Element Linking', description: 'Auto-map elements to supporting citations.', status: 'Stable' },
      { id: 'context-gen', label: 'Context Generation', description: 'Generate memos on-the-fly for counsel.', status: 'Streaming' },
      { id: 'assert', label: 'Assertion Engine', description: 'Contrastive reasoning against counterclaims.', status: 'Ready' },
      { id: 'strategy', label: 'Strategy Drafting', description: 'Storyboard arguments with evidence anchors.', status: 'Drafting' },
    ],
  },
  {
    id: 'legal-team',
    label: 'Legal Theory Team',
    icon: 'fa-scale-balanced',
    synopsis: 'Attorney-AI pairing for building persuasive theories of the case.',
    focusNode: {
      type: 'Theory',
      summary: 'Comparative negligence angle flagged for review.',
      cases: ['Case No-118', 'Ortiz v. Seattle'],
    },
    submodules: [
      { id: 'playbooks', label: 'Playbook Studio', description: 'Reusable theory templates with citations.', status: 'Updated' },
      { id: 'narratives', label: 'Narrative Builder', description: 'Arrange facts into cinematic flow.', status: 'Active' },
      { id: 'counter', label: 'Countermeasure Lab', description: 'Anticipate opposing moves.', status: 'Forecasting' },
      { id: 'briefs', label: 'Brief Assembly', description: 'Assemble outlines + argument trees.', status: 'Queued' },
      { id: 'score', label: 'Persuasion Score', description: 'Signal strength vs precedent.', status: '74%' },
    ],
  },
  {
    id: 'forensics',
    label: 'Forensics / Chain',
    icon: 'fa-magnifying-glass-chart',
    synopsis: 'Trace authenticity, metadata drift, and custody logs.',
    focusNode: {
      type: 'Chain Event',
      summary: 'Custody break detected between exhibits 14 → 18.',
      cases: ['Case No-502', 'People v. Vance'],
    },
    submodules: [
      { id: 'neo4j', label: 'Neo4j Sync', description: 'Align graph DB with custody nodes.', status: 'Syncing' },
      { id: 'alerts', label: 'Tamper Alerts', description: 'Flag anomalies + irregular hashes.', status: 'Green' },
      { id: 'sig', label: 'Signature Audit', description: 'PKI validation stream.', status: 'Running' },
      { id: 'handoff', label: 'Handoff Ledger', description: 'Chain-of-custody ledger view.', status: 'Solid' },
      { id: 'ops', label: 'Ops Replay', description: 'Recreate ingestion ops timeline.', status: 'Paused' },
    ],
  },
  {
    id: 'timeline',
    label: 'Timeline Builder',
    icon: 'fa-clock',
    synopsis: 'Spatial-temporal builder for events, citations, and transcript cues.',
    focusNode: {
      type: 'Moment',
      summary: 'Event anchor awaiting supporting audio reference.',
      cases: ['Case No-312', 'Mendez v. DOT'],
    },
    submodules: [
      { id: 'drag', label: 'Drag Nodes', description: 'Magnetic track for timecodes.', status: 'Hover' },
      { id: 'cite', label: 'Attach Citations', description: 'Link doc + transcript snippets.', status: '3 linked' },
      { id: 'preview', label: 'Preview Mode', description: 'Cinematic timeline playback.', status: 'Stage' },
      { id: 'handoff', label: 'Handoff to Trial', description: 'Send nodes to binder creator.', status: 'Ready' },
      { id: 'sync', label: 'Calendar Sync', description: 'Outlook + TrialPad export.', status: 'Scheduled' },
    ],
  },
  {
    id: 'binder',
    label: 'Trial Binder Creator',
    icon: 'fa-folder-tree',
    synopsis: 'Exhibit orchestration with export-ready structures.',
    focusNode: {
      type: 'Exhibit',
      summary: 'Exhibit 12 annotated for expert testimony.',
      cases: ['Case No-912', 'Harper v. Northwind'],
    },
    submodules: [
      { id: 'organize', label: 'Organize Exhibits', description: 'Folders, tabs, and holographic badges.', status: 'Arranging' },
      { id: 'covers', label: 'Auto Cover Sheets', description: 'Generate formatted templates.', status: 'Success' },
      { id: 'collab', label: 'Collaborative Notes', description: 'Comment + mention co-counsel.', status: 'Typing' },
      { id: 'export', label: 'TrialPad Export', description: 'One-click export to OnCue/TrialPad.', status: 'Enabled' },
      { id: 'handoff-binder', label: 'Binder Handoff', description: 'Send to courtroom devices.', status: 'Secured' },
    ],
  },
  {
    id: 'mock',
    label: 'Mock Trial Arena',
    icon: 'fa-gavel',
    synopsis: 'Agent-mediated adversarial simulations before court.',
    focusNode: {
      type: 'Simulation',
      summary: 'AI critic combat analyzing impeachment strategy.',
      cases: ['Case No-771', 'Walker v. Redline'],
    },
    submodules: [
      { id: 'critics', label: 'AI Critic Combat', description: 'Adversarial counter argumentation.', status: 'Engaged' },
      { id: 'witness', label: 'Witness Simulation', description: 'Avatar-based testimony practice.', status: 'In session' },
      { id: 'passes', label: 'Attack / Defense', description: 'Structured attack-defense passes.', status: 'Round 3' },
      { id: 'scripts', label: 'Trial Scripts', description: 'Auto-generate cross/dir outlines.', status: 'Rendering' },
      { id: 'analytics', label: 'Performance Analytics', description: 'Scorecards + attention heatmaps.', status: 'Updated' },
    ],
  },
  {
    id: 'university',
    label: 'Trial University',
    icon: 'fa-graduation-cap',
    synopsis: 'Micro-trainings, rapid refreshers, and neural rehearsal.',
    focusNode: {
      type: 'Lesson',
      summary: 'Evidentiary foundations refresher queued.',
      cases: ['Global Program', 'v3 curriculum'],
    },
    submodules: [
      { id: 'tracks', label: 'Learning Tracks', description: 'Assign modules per role.', status: 'Assigning' },
      { id: 'live', label: 'Live Holo Labs', description: 'Immersive workshop streaming.', status: 'Go live' },
      { id: 'cert', label: 'Certification', description: 'Record completions + share.', status: 'In review' },
      { id: 'sparring', label: 'Agent Sparring', description: 'Timed drills with AI coaches.', status: 'Queued' },
      { id: 'debrief', label: 'Debrief Exports', description: 'Share session highlights.', status: 'Encrypted' },
    ],
  },
  {
    id: 'research',
    label: 'Legal Research Engine',
    icon: 'fa-book',
    synopsis: 'CourtListener, statutes, and precedent cross-checks.',
    focusNode: {
      type: 'Research Node',
      summary: 'Case analog identified in Ninth Circuit 2018.',
      cases: ['Case No-640', 'Refer to Redwood v. Diaz'],
    },
    submodules: [
      { id: 'case-search', label: 'Case Law Search', description: 'Hybrid semantic + boolean search.', status: '42 hits' },
      { id: 'precedent', label: 'Precedent Extraction', description: 'Pull controlling holdings.', status: 'Filtering' },
      { id: 'statutes', label: 'Statutes & Codes', description: 'Surface statutory hooks.', status: 'Updated' },
      { id: 'api', label: 'CourtListener API', description: 'Live feed of docket changes.', status: 'Polling' },
      { id: 'knowledge', label: 'Knowledge Graph Sync', description: 'Align knowledge base with research.', status: 'Synced' },
    ],
  },
];

const CONTROL_ACTIONS = [
  { label: 'Filter', icon: 'fa-filter' },
  { label: 'Clusters', icon: 'fa-sitemap' },
  { label: 'Run Agents', icon: 'fa-robot' },
  { label: 'Export', icon: 'fa-download' },
  { label: 'History', icon: 'fa-clock-rotate-left' },
];

const ORBIT_NODES = Array.from({ length: 11 }).map((_, index) => ({
  id: `orbit-${index}`,
  angle: (index / 11) * Math.PI * 2,
}));

export default function DashboardHub(): JSX.Element {
  const [activeModuleId, setActiveModuleId] = useState(PRIMARY_MODULES[0].id);
  const [activeSubmoduleId, setActiveSubmoduleId] = useState(PRIMARY_MODULES[0].submodules[0].id);

  const activeModule = useMemo(
    () => PRIMARY_MODULES.find((module) => module.id === activeModuleId) ?? PRIMARY_MODULES[0],
    [activeModuleId]
  );

  const activeSubmodule = useMemo(
    () =>
      activeModule.submodules.find((submodule) => submodule.id === activeSubmoduleId) ??
      activeModule.submodules[0],
    [activeModule, activeSubmoduleId]
  );

  useEffect(() => {
    setActiveSubmoduleId(activeModule.submodules[0].id);
  }, [activeModule.id]);

  return (
    <motion.section
      className="halo-interface"
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="halo-column halo-column-left">
        <p className="eyebrow">Primary Modules</p>
        <ul className="halo-node-list">
          {PRIMARY_MODULES.map((module, index) => (
            <li key={module.id}>
              <button
                type="button"
                className={cn(
                  'halo-node',
                  module.id === activeModule.id && 'active'
                )}
                style={{ '--node-index': index } as CSSProperties}
                onClick={() => setActiveModuleId(module.id)}
              >
                <span className="halo-node-dot" aria-hidden />
                <div>
                  <span>{module.label}</span>
                  <small>{module.synopsis}</small>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="halo-orbit-stack">
        <div className="halo-orbit">
          <svg viewBox="0 0 400 400" role="presentation" aria-hidden>
            <defs>
              <radialGradient id="halo-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0, 214, 255, 0.9)" />
                <stop offset="70%" stopColor="rgba(0, 214, 255, 0.2)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id="halo-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(0, 214, 255, 0.25)" strokeWidth="1" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0, 214, 255, 0.15)" strokeWidth="1.5" strokeDasharray="6 12" />
            {ORBIT_NODES.map((node) => {
              const radius = 145;
              const x = 200 + Math.cos(node.angle) * radius;
              const y = 200 + Math.sin(node.angle) * radius;
              return (
                <g key={node.id}>
                  <line
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke="rgba(0, 214, 255, 0.25)"
                    strokeWidth="0.5"
                  />
                  <circle cx={x} cy={y} r="5" fill="rgba(0, 214, 255, 0.8)" filter="url(#halo-blur)" />
                </g>
              );
            })}
            <circle cx="200" cy="200" r="14" fill="url(#halo-glow)" />
          </svg>

          <motion.div
            className="halo-core"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
          />

          <div className="halo-viewport-info">
            <p className="eyebrow">Active Submodule</p>
            <h3>{activeSubmodule.label}</h3>
            <p>{activeSubmodule.description}</p>
            <span className="halo-status-chip">{activeSubmodule.status}</span>
          </div>
        </div>
        <div className="halo-module-meta">
          <p className="eyebrow">Module Synopsis</p>
          <p>{activeModule.synopsis}</p>
        </div>
      </div>

      <div className="halo-right">
        <div className="halo-subnodes">
          <p className="eyebrow">Submodules</p>
          <ul>
            {activeModule.submodules.map((submodule) => (
              <li key={submodule.id}>
                <button
                  type="button"
                  className={cn(
                    'halo-subnode',
                    submodule.id === activeSubmodule.id && 'active'
                  )}
                  onClick={() => setActiveSubmoduleId(submodule.id)}
                >
                  <span className="halo-subnode-dot" aria-hidden />
                  <div>
                    <span>{submodule.label}</span>
                    <small>{submodule.status}</small>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="halo-info-stack">
          <div className="halo-node-card">
            <p className="eyebrow">Node</p>
            <h4>{activeModule.focusNode.type}</h4>
            <p className="halo-node-summary">{activeModule.focusNode.summary}</p>
            <div className="halo-node-meta">
              <p>Related Cases</p>
              <ul>
                {activeModule.focusNode.cases.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
            <button type="button" className="halo-secondary-btn">
              View Document
            </button>
          </div>

          <div className="halo-control-card">
            <p className="eyebrow">Node Tools</p>
            <ul>
              {CONTROL_ACTIONS.map((action) => (
                <li key={action.label}>
                  <button type="button">
                    <i className={`fa-solid ${action.icon}`} aria-hidden />
                    <span>{action.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
