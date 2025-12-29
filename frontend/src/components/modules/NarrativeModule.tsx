import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RefreshCw, AlertTriangle, GitBranch, TrendingUp } from 'lucide-react';
import { endpoints as api } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Contradiction {
  id: string;
  description: string;
  source_a: string;
  source_b: string;
  confidence: number;
  severity: 'high' | 'medium' | 'low';
}

interface StoryPoint {
  timestamp: string;
  event: string;
  tension_level: number;
}

interface NarrativeModuleProps {
  caseId: string;
  isActive: boolean;
}

export const NarrativeModule: React.FC<NarrativeModuleProps> = ({ caseId, isActive }) => {
  const [narrative, setNarrative] = useState<string>("");
  const [perspective, setPerspective] = useState<'neutral' | 'prosecution' | 'defense'>('neutral');
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'narrative' | 'contradictions' | 'branching' | 'story_arc'>('narrative');

  // Narrative Generation
  const fetchNarrative = async (selectedPerspective: string = perspective) => {
    setIsLoading(true);
    try {
      const res = await api.timeline.narrative.generate(caseId, selectedPerspective);
      setNarrative(res.data.narrative);
    } catch (error) {
      console.error("Failed to fetch narrative", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerspectiveChange = (newPerspective: 'neutral' | 'prosecution' | 'defense') => {
    setPerspective(newPerspective);
    fetchNarrative(newPerspective);
  };

  // Contradictions
  const fetchContradictions = async () => {
    setIsLoading(true);
    try {
      const res = await api.timeline.narrative.contradictions(caseId);
      setContradictions(res.data);
    } catch (error) {
      console.error("Failed to fetch contradictions", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Branching Narrative
  const [branchingResult, setBranchingResult] = useState<any | null>(null);
  const [pivotPoint, setPivotPoint] = useState('');
  const [altFact, setAltFact] = useState('');
  const [isBranchingLoading, setIsBranchingLoading] = useState(false);

  const generateBranching = async () => {
    if (!pivotPoint || !altFact) return;
    setIsBranchingLoading(true);
    try {
      const res = await api.timeline.narrative.branching(caseId, pivotPoint, altFact);
      setBranchingResult(res.data);
    } catch (error) {
      console.error("Failed to fetch branching narrative", error);
    } finally {
      setIsBranchingLoading(false);
    }
  };

  // Story Arc
  const [storyArc, setStoryArc] = useState<StoryPoint[]>([]);
  const [isArcLoading, setIsArcLoading] = useState(false);

  const fetchStoryArc = async () => {
    setIsArcLoading(true);
    try {
      const res = await api.timeline.narrative.storyArc(caseId);
      setStoryArc(res.data);
    } catch (error) {
      console.error("Failed to fetch story arc", error);
    } finally {
      setIsArcLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      if (!narrative) fetchNarrative();
      if (contradictions.length === 0) fetchContradictions();
    }
  }, [isActive, caseId]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-400" />
          Narrative Weaver
        </h2>

        {/* Perspective Selector (Only visible on Narrative tab) */}
        {activeTab === 'narrative' && (
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {(['neutral', 'prosecution', 'defense'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePerspectiveChange(p)}
                className={`px-3 py-1.5 rounded-md text-sm capitalize transition-all ${perspective === p
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if (activeTab === 'narrative') fetchNarrative();
            else if (activeTab === 'contradictions') fetchContradictions();
            else if (activeTab === 'story_arc') fetchStoryArc();
          }}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          title="Regenerate"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading || isArcLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('narrative')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'narrative'
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
            : 'hover:bg-slate-800 text-slate-400'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          Case Narrative
        </button>
        <button
          onClick={() => setActiveTab('contradictions')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'contradictions'
            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
            : 'hover:bg-slate-800 text-slate-400'
            }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Contradictions
          {contradictions.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
              {contradictions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('branching')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'branching'
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
            : 'hover:bg-slate-800 text-slate-400'
            }`}
        >
          <GitBranch className="w-4 h-4" />
          Branching Narratives
        </button>
        <button
          onClick={() => { setActiveTab('story_arc'); fetchStoryArc(); }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'story_arc'
            ? 'bg-green-500/20 text-green-300 border border-green-500/50'
            : 'hover:bg-slate-800 text-slate-400'
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          Story Arc
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
        <AnimatePresence mode="wait">

          {/* NARRATIVE TAB */}
          {activeTab === 'narrative' && (
            <motion.div
              key="narrative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {isLoading && !narrative ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 text-purple-500" />
                  <p>Weaving {perspective} narrative...</p>
                </div>
              ) : (
                <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap text-lg text-slate-300 shadow-inner">
                  {narrative || "No narrative generated yet."}
                </div>
              )}
            </motion.div>
          )}

          {/* CONTRADICTIONS TAB */}
          {activeTab === 'contradictions' && (
            <motion.div
              key="contradictions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isLoading && contradictions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                  <p>Analyzing contradictions...</p>
                </div>
              ) : contradictions.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No contradictions detected.</p>
                </div>
              ) : (
                contradictions.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${item.severity === 'high' ? 'bg-red-950/20 border-red-500/30' :
                      item.severity === 'medium' ? 'bg-orange-950/20 border-orange-500/30' :
                        'bg-yellow-950/20 border-yellow-500/30'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-200">{item.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${item.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        item.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        {item.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          Source A
                        </div>
                        <p className="text-slate-300">{item.source_a}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <div className="w-2 h-2 rounded-full bg-purple-400" />
                          Source B
                        </div>
                        <p className="text-slate-300">{item.source_b}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* BRANCHING TAB */}
          {activeTab === 'branching' && (
            <motion.div
              key="branching"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Create "What If" Scenario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Pivot Point (Event)</label>
                    <input
                      type="text"
                      value={pivotPoint}
                      onChange={(e) => setPivotPoint(e.target.value)}
                      placeholder="e.g., The meeting on Jan 5th"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Alternative Fact</label>
                    <input
                      type="text"
                      value={altFact}
                      onChange={(e) => setAltFact(e.target.value)}
                      placeholder="e.g., The meeting never happened"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={generateBranching}
                  disabled={isBranchingLoading || !pivotPoint || !altFact}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isBranchingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                  Generate Scenario
                </button>
              </div>

              {branchingResult && (
                <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/30 flex-1 overflow-y-auto">
                  <h4 className="text-xl font-bold text-blue-300 mb-4">Alternative Timeline</h4>
                  <div className="prose prose-invert max-w-none mb-6">
                    {branchingResult.narrative}
                  </div>

                  {branchingResult.implications && (
                    <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                      <h5 className="font-semibold text-slate-300 mb-2">Strategic Implications</h5>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        {branchingResult.implications.map((imp: string, i: number) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STORY ARC TAB */}
          {activeTab === 'story_arc' && (
            <motion.div
              key="story_arc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold mb-6 text-green-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Narrative Tension Arc
                </h3>

                {isArcLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : storyArc.length > 0 ? (
                  <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={storyArc} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTension" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#94a3b8"
                          tickFormatter={(val) => new Date(val).toLocaleDateString()}
                          minTickGap={30}
                        />
                        <YAxis stroke="#94a3b8" domain={[0, 1]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                          itemStyle={{ color: '#22c55e' }}
                          labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Area
                          type="monotone"
                          dataKey="tension_level"
                          stroke="#22c55e"
                          fillOpacity={1}
                          fill="url(#colorTension)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500">
                    No story arc data available.
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};