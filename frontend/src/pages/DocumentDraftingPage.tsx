import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Mock motion types - these should ideally come from the backend
const MOTION_TYPES = [
  "motion_to_dismiss",
  "motion_for_summary_judgment",
  "motion_in_limine",
  "motion_to_compel",
  "motion_for_protective_order",
  "declaration_in_support_of_rfo_move_away",
  "motion_to_set_aside_or_vacate_judgment",
  "trial_brief",
  "motion_for_sanctions",
  "motion_for_injunction",
  "motion_to_seal",
  "motion_to_reopen_discovery",
  "motion_to_shorten_time",
];

export default function DocumentDraftingPage() {
  const [selectedMotionType, setSelectedMotionType] = useState(MOTION_TYPES[0]);
  const [caseId, setCaseId] = useState('');
  const [facts, setFacts] = useState('');
  const [theories, setTheories] = useState('');
  const [conflicts, setConflicts] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDraftDocument = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!caseId || !selectedMotionType) {
      setError("Please provide a Case ID and select a Motion Type.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/draft-document', { // Use the new backend endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motion_type: selectedMotionType,
          case_id: caseId,
          data: {
            facts: facts,
            theories: theories,
            conflicts: conflicts,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to draft document: ${response.statusText}`);
      }

      // Trigger file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'document.docx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `Document "${filename}" drafted and downloaded successfully!` });
    } catch (err: any) {
      setError(err.message);
      setMessage({ type: 'error', text: `Drafting failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMotionType, caseId, facts, theories, conflicts]);

  return (
    <div className="bg-background-canvas text-text-primary h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="panel-shell"
      >
        <header>
          <h2>AI-Assisted Document Drafting</h2>
          <p className="panel-subtitle">Draft legal documents with the help of AI.</p>
        </header>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {message && (
              <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-accent-green/20 text-accent-green border border-accent-green/40' : 'bg-accent-red/20 text-accent-red border border-accent-red/40'}`}>
                {message.text}
              </div>
            )}
            <div>
              <label htmlFor="motionType" className="block text-sm font-medium text-text-secondary mb-1">Motion Type</label>
              <select
                id="motionType"
                className="cds-input-cinematic w-full"
                value={selectedMotionType}
                onChange={(e) => setSelectedMotionType(e.target.value)}
                disabled={isLoading}
              >
                {MOTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="caseId" className="block text-sm font-medium text-text-secondary mb-1">Case ID</label>
              <input
                type="text"
                id="caseId"
                className="cds-input-cinematic w-full"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="Enter Case ID"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="facts" className="block text-sm font-medium text-text-secondary mb-1">Facts</label>
              <textarea
                id="facts"
                rows={5}
                className="cds-input-cinematic w-full"
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                placeholder="Enter relevant facts..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="theories" className="block text-sm font-medium text-text-secondary mb-1">Legal Theories</label>
              <textarea
                id="theories"
                rows={5}
                className="cds-input-cinematic w-full"
                value={theories}
                onChange={(e) => setTheories(e.target.value)}
                placeholder="Enter accepted legal theories..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="conflicts" className="block text-sm font-medium text-text-secondary mb-1">Opposition/Conflicts</label>
              <textarea
                id="conflicts"
                rows={5}
                className="cds-input-cinematic w-full"
                value={conflicts}
                onChange={(e) => setConflicts(e.target.value)}
                placeholder="Enter opposition arguments or conflicts..."
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleDraftDocument}
              className="c-btn shimmer-btn w-full"
              disabled={isLoading || !caseId || !selectedMotionType}
            >
              {isLoading ? 'Drafting Document...' : 'Draft Document'}
            </button>
          </div>
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Drafting Guide</h3>
            <div className="bg-background-surface p-4 rounded-lg text-sm text-text-secondary space-y-3">
              <p>Use this section to generate various legal documents. Select a motion type and provide the necessary details in the fields below.</p>
              <p><strong>Motion Type:</strong> Choose the type of legal document you wish to draft.</p>
              <p><strong>Case ID:</strong> The identifier for the case this document pertains to.</p>
              <p><strong>Facts:</strong> Summarize the key factual background relevant to the document.</p>
              <p><strong>Legal Theories:</strong> Outline the legal arguments or theories supporting your position.</p>
              <p><strong>Opposition/Conflicts:</strong> Describe any opposing arguments or conflicting information that needs to be addressed.</p>
              <p>Click "Draft Document" to generate a Word document (.docx) based on your input and the selected template.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}