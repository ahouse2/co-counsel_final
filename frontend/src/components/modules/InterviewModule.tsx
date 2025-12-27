import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2,
    SkipForward,
    HelpCircle,
    RefreshCw,
    Loader2,
    Brain,
    Users,
    FileText,
    Clock,
    AlertTriangle,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { endpoints } from '../../services/api';
import { useHalo } from '../../context/HaloContext';

interface InterviewQuestion {
    id: string;
    question: string;
    context: string;
    category: string;
    priority: number;
    related_entities: string[];
    related_docs: string[];
    status: 'pending' | 'answered' | 'skipped' | 'unknown';
    response: string | null;
}

interface FactPattern {
    id: string;
    pattern_type: string;
    description: string;
    confidence: number;
    entities_involved: string[];
    date_range: string | null;
}

interface InterviewStatus {
    total_questions: number;
    answered: number;
    skipped: number;
    unknown: number;
    pending: number;
    is_complete: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
    relationship: <Users size={16} />,
    timeline: <Clock size={16} />,
    document: <FileText size={16} />,
    contradiction: <AlertTriangle size={16} />,
    clarification: <HelpCircle size={16} />,
    missing_evidence: <FileText size={16} />,
};

const categoryColors: Record<string, string> = {
    relationship: 'text-blue-400 bg-blue-500/20',
    timeline: 'text-purple-400 bg-purple-500/20',
    document: 'text-green-400 bg-green-500/20',
    contradiction: 'text-red-400 bg-red-500/20',
    clarification: 'text-yellow-400 bg-yellow-500/20',
    missing_evidence: 'text-orange-400 bg-orange-500/20',
};

export const InterviewModule: React.FC = () => {
    const { caseId } = useHalo();
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [factPatterns, setFactPatterns] = useState<FactPattern[]>([]);
    const [status, setStatus] = useState<InterviewStatus | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'interview' | 'patterns'>('interview');

    const fetchData = useCallback(async () => {
        if (!caseId) return;
        setLoading(true);
        try {
            const [questionsRes, statusRes, patternsRes] = await Promise.all([
                endpoints.interview.getQuestions(caseId),
                endpoints.interview.getStatus(caseId),
                endpoints.interview.getFactPatterns(caseId)
            ]);
            setQuestions(questionsRes.data || []);
            setStatus(statusRes.data);
            setFactPatterns(patternsRes.data || []);

            // Find first pending question
            const pending = (questionsRes.data || []).findIndex((q: InterviewQuestion) => q.status === 'pending');
            if (pending >= 0) setCurrentIndex(pending);
        } catch (error) {
            console.error('Failed to fetch interview data:', error);
        } finally {
            setLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGenerateQuestions = async () => {
        if (!caseId) return;
        setGenerating(true);
        try {
            await endpoints.interview.generateQuestions(caseId, 10);
            await fetchData();
        } catch (error) {
            console.error('Failed to generate questions:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleExtractPatterns = async () => {
        if (!caseId) return;
        setGenerating(true);
        try {
            await endpoints.interview.extractFactPatterns(caseId);
            await fetchData();
        } catch (error) {
            console.error('Failed to extract patterns:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmitResponse = async (questionId: string, responseText: string | null, status: string) => {
        if (!caseId) return;
        setSubmitting(true);
        try {
            await endpoints.interview.submitResponse(caseId, questionId, responseText, status);
            setResponse('');
            await fetchData();
            // Move to next pending question
            const nextPending = questions.findIndex((q, i) => i > currentIndex && q.status === 'pending');
            if (nextPending >= 0) setCurrentIndex(nextPending);
        } catch (error) {
            console.error('Failed to submit response:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const currentQuestion = questions[currentIndex];
    const pendingQuestions = questions.filter(q => q.status === 'pending');

    return (
        <div className="w-full h-full p-8 overflow-y-auto">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-light text-white mb-2 flex items-center gap-3">
                    <Brain className="text-halo-cyan" />
                    Case Intelligence Interview
                </h1>
                <p className="text-halo-muted">
                    Help the AI understand your case better with guided questions
                </p>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('interview')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'interview'
                        ? 'bg-halo-cyan/20 text-halo-cyan border border-halo-cyan/50'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                >
                    <HelpCircle className="inline mr-2" size={18} />
                    Interview ({pendingQuestions.length} pending)
                </button>
                <button
                    onClick={() => setActiveTab('patterns')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'patterns'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                >
                    <Sparkles className="inline mr-2" size={18} />
                    Fact Patterns ({factPatterns.length})
                </button>
            </div>

            {activeTab === 'interview' ? (
                <>
                    {/* Progress Bar */}
                    {status && status.total_questions > 0 && (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-halo-muted">Interview Progress</span>
                                <span className="text-sm text-halo-cyan">
                                    {status.answered} / {status.total_questions} answered
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-halo-cyan to-purple-500 transition-all duration-500"
                                    style={{ width: `${(status.answered / status.total_questions) * 100}%` }}
                                />
                            </div>
                            <div className="flex gap-4 mt-3 text-xs">
                                <span className="text-green-400">✓ {status.answered} answered</span>
                                <span className="text-yellow-400">→ {status.skipped} skipped</span>
                                <span className="text-gray-400">? {status.unknown} unknown</span>
                            </div>
                        </div>
                    )}

                    {/* No Questions State */}
                    {questions.length === 0 && !loading && (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-12 text-center">
                            <Brain size={64} className="mx-auto text-halo-cyan/50 mb-4" />
                            <h2 className="text-2xl font-light text-white mb-2">No Interview Questions Yet</h2>
                            <p className="text-halo-muted mb-6">
                                Generate guided questions based on your uploaded evidence
                            </p>
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={generating}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-halo-cyan to-purple-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                Generate Interview Questions
                            </button>
                        </div>
                    )}

                    {/* Current Question */}
                    {currentQuestion && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Question Panel */}
                            <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className={`p-2 rounded-lg ${categoryColors[currentQuestion.category] || 'bg-gray-500/20 text-gray-400'}`}>
                                        {categoryIcons[currentQuestion.category] || <HelpCircle size={16} />}
                                    </span>
                                    <span className="text-sm text-halo-muted capitalize">{currentQuestion.category.replace('_', ' ')}</span>
                                    <span className="ml-auto text-xs px-2 py-1 bg-white/5 rounded">
                                        Priority: {currentQuestion.priority}/5
                                    </span>
                                </div>

                                <h2 className="text-2xl font-light text-white mb-4 leading-relaxed">
                                    {currentQuestion.question}
                                </h2>

                                <p className="text-sm text-halo-muted mb-6 italic">
                                    "{currentQuestion.context}"
                                </p>

                                {currentQuestion.related_entities.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {currentQuestion.related_entities.map((entity, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                                                {entity}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Response Input */}
                                <textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-halo-cyan/50 focus:outline-none resize-none"
                                />

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => handleSubmitResponse(currentQuestion.id, response, 'answered')}
                                        disabled={!response.trim() || submitting}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-halo-cyan to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                        Submit Answer
                                    </button>
                                    <button
                                        onClick={() => handleSubmitResponse(currentQuestion.id, null, 'skipped')}
                                        disabled={submitting}
                                        className="px-6 py-3 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors flex items-center gap-2"
                                    >
                                        <SkipForward size={18} />
                                        Skip
                                    </button>
                                    <button
                                        onClick={() => handleSubmitResponse(currentQuestion.id, null, 'unknown')}
                                        disabled={submitting}
                                        className="px-6 py-3 rounded-xl bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30 transition-colors flex items-center gap-2"
                                    >
                                        <HelpCircle size={18} />
                                        I Don't Know
                                    </button>
                                </div>
                            </div>

                            {/* Question Navigator */}
                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <HelpCircle size={20} className="text-halo-cyan" />
                                    All Questions
                                </h3>
                                <div className="space-y-2">
                                    {questions.map((q, i) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`w-full p-3 rounded-lg text-left transition-all ${i === currentIndex
                                                ? 'bg-halo-cyan/20 border border-halo-cyan/50'
                                                : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {q.status === 'answered' && <CheckCircle2 size={14} className="text-green-400" />}
                                                {q.status === 'skipped' && <SkipForward size={14} className="text-yellow-400" />}
                                                {q.status === 'unknown' && <HelpCircle size={14} className="text-gray-400" />}
                                                {q.status === 'pending' && <ChevronRight size={14} className="text-halo-cyan" />}
                                                <span className="text-xs text-halo-muted capitalize">{q.category}</span>
                                            </div>
                                            <p className="text-sm text-white mt-1 line-clamp-2">{q.question}</p>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleGenerateQuestions}
                                    disabled={generating}
                                    className="w-full mt-4 py-2 rounded-lg bg-white/5 border border-white/10 text-halo-muted hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                                    Regenerate Questions
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Fact Patterns Tab */
                <div className="space-y-4">
                    {factPatterns.length === 0 && !loading && (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-12 text-center">
                            <Sparkles size={64} className="mx-auto text-purple-400/50 mb-4" />
                            <h2 className="text-2xl font-light text-white mb-2">No Fact Patterns Extracted</h2>
                            <p className="text-halo-muted mb-6">
                                Extract key fact patterns from your evidence
                            </p>
                            <button
                                onClick={handleExtractPatterns}
                                disabled={generating}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                Extract Fact Patterns
                            </button>
                        </div>
                    )}

                    {factPatterns.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {factPatterns.map((pattern) => (
                                <div key={pattern.id} className="bg-black/40 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full capitalize">
                                            {pattern.pattern_type}
                                        </span>
                                        <span className={`text-xs font-mono ${pattern.confidence > 0.8 ? 'text-green-400' :
                                            pattern.confidence > 0.5 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {(pattern.confidence * 100).toFixed(0)}% confidence
                                        </span>
                                    </div>
                                    <p className="text-white text-sm leading-relaxed mb-3">
                                        {pattern.description}
                                    </p>
                                    {pattern.entities_involved.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {pattern.entities_involved.map((entity, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded">
                                                    {entity}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {pattern.date_range && (
                                        <div className="mt-2 text-xs text-halo-muted flex items-center gap-1">
                                            <Clock size={12} />
                                            {pattern.date_range}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {factPatterns.length > 0 && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handleExtractPatterns}
                                disabled={generating}
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-halo-muted hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
                                Re-analyze Evidence
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
