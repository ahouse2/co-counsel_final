import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentPreviewModal from '@/components/common/DocumentPreviewModal'; // Import the new modal

interface Evidence {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video' | 'my_documents' | 'opposition_documents';
  url: string;
  annotation?: string; // Added for presentation notes
}

interface Case {
  id: string;
}

export default function InCourtPresentationPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentationItems, setPresentationItems] = useState<Evidence[]>([]);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [modalDocumentUrl, setModalDocumentUrl] = useState<string | null>(null);
  const [modalDocumentType, setModalDocumentType] = useState<string | null>(null);
  const [modalDocumentName, setModalDocumentName] = useState<string | null>(null);

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cases');
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      const data = await response.json();
      setCases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidence = async (caseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch evidence');
      }
      const data = await response.json();
      setEvidence(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      fetchEvidence(selectedCase.id);
    }
  }, [selectedCase]);

  const addToPresentation = useCallback(() => {
    if (selectedEvidence && !presentationItems.some(item => item.id === selectedEvidence.id)) {
      setPresentationItems(prev => [...prev, { ...selectedEvidence, annotation: '' }]);
    }
  }, [selectedEvidence, presentationItems]);

  const removeFromPresentation = useCallback((id: string) => {
    setPresentationItems(prev => prev.filter(item => item.id !== id));
    if (currentPresentationIndex >= presentationItems.length - 1 && presentationItems.length > 1) {
      setCurrentPresentationIndex(presentationItems.length - 2);
    } else if (presentationItems.length === 1) {
      setCurrentPresentationIndex(0);
    }
  }, [presentationItems, currentPresentationIndex]);

  const updateAnnotation = useCallback((id: string, annotation: string) => {
    setPresentationItems(prev =>
      prev.map(item => (item.id === id ? { ...item, annotation } : item))
    );
  }, []);

  const movePresentationItem = useCallback((index: number, direction: 'up' | 'down') => {
    const newItems = [...presentationItems];
    if (direction === 'up' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setPresentationItems(newItems);
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      setPresentationItems(newItems);
    }
  }, [presentationItems]);

  const currentPresentationEvidence = presentationItems[currentPresentationIndex];

  const handleNext = useCallback(() => {
    setCurrentPresentationIndex(prev => (prev + 1) % presentationItems.length);
  }, [presentationItems]);

  const handlePrevious = useCallback(() => {
    setCurrentPresentationIndex(prev => (prev - 1 + presentationItems.length) % presentationItems.length);
  }, [presentationItems]);

  const handlePrepareBinder = useCallback(async () => {
    if (!selectedCase || presentationItems.length === 0) {
      alert('Please select a case and add evidence to the presentation first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/prepare-binder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_name: selectedCase.id,
          evidence_list: presentationItems.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            url: item.url,
            annotation: item.annotation,
          })),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to prepare binder');
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Trial_Binder.docx';
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

      alert('Trial binder prepared and downloaded successfully!');
    } catch (err: any) {
      setError(err.message);
      alert('Error preparing binder');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCase, presentationItems]);

  const renderEvidencePreview = (item: Evidence | null, className: string = "w-full h-full") => {
    if (!item) {
      return (
        <div className="flex items-center justify-center h-full bg-background-panel rounded-lg">
          <p className="text-text-secondary">Select an exhibit or start presentation.</p>
        </div>
      );
    }
    switch (item.type) {
      case 'image':
        return <img src={item.url} alt={item.name} className={`${className} object-contain`} />;
      case 'pdf':
      case 'my_documents':
      case 'opposition_documents':
        return <iframe src={item.url} className={className} />;
      case 'video':
        return <video src={item.url} controls className={className} />;
      default:
        return <p className="text-text-secondary">Unsupported evidence type.</p>;
    }
  };

  return (
    <div className="bg-background-canvas text-text-primary h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="panel-shell"
      >
        <header>
          <h2>In-Court Presentation</h2>
          <p className="panel-subtitle">Present your evidence with clarity and impact.</p>
        </header>

        {!isPresenterMode ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Case and Evidence Selection */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold">Cases</h3>
              {isLoading && <p>Loading...</p>}
              {error && <p className="text-accent-red text-sm mt-2">Error: {error}</p>}
              <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {cases.map((caseItem) => (
                  <li
                    key={caseItem.id}
                    className={`bg-background-surface p-2 rounded-lg cursor-pointer hover:bg-background-panel transition-colors`}
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    {caseItem.id}
                  </li>
                ))}
              </ul>

              <h3 className="text-lg font-semibold mt-8">Available Evidence</h3>
              {isLoading && <p>Loading...</p>}
              {error && <p className="text-accent-red text-sm mt-2">Error: {error}</p>}
              <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {evidence.map((item) => (
                  <li
                    key={item.id}
                    className={`bg-background-surface p-2 rounded-lg cursor-pointer hover:bg-background-panel transition-colors flex justify-between items-center`}
                    onClick={() => setSelectedEvidence(item)}
                  >
                    <span>{item.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToPresentation(); }}
                      className="ml-2 px-3 py-1 text-xs rounded-md bg-accent-blue hover:bg-accent-blue/80 transition-colors"
                      disabled={!selectedEvidence || presentationItems.some(p => p.id === item.id)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Presentation Builder */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold">Presentation Builder</h3>
              <div className="mt-4 bg-background-surface p-4 rounded-lg min-h-[400px] max-h-[700px] overflow-y-auto custom-scrollbar">
                {presentationItems.length === 0 ? (
                  <p className="text-text-secondary">Add evidence to your presentation.</p>
                ) : (
                  <ul className="space-y-3">
                    <AnimatePresence>
                      {presentationItems.map((item, index) => (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-background-panel p-3 rounded-lg flex flex-col space-y-2"
                          >
                            <li
                              draggable
                              onDragStart={(e: React.DragEvent<HTMLLIElement>) => e.dataTransfer.setData('itemId', item.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e: React.DragEvent<HTMLLIElement>) => {
                                const draggedItemId = e.dataTransfer.getData('itemId');
                                const draggedItemIndex = presentationItems.findIndex(i => i.id === draggedItemId);
                                const droppedItemIndex = index;
                                if (draggedItemIndex === -1 || droppedItemIndex === -1) return;
                                const newItems = [...presentationItems];
                                const [reorderedItem] = newItems.splice(draggedItemIndex, 1);
                                newItems.splice(droppedItemIndex, 0, reorderedItem);
                                setPresentationItems(newItems);
                              }}
                              className="flex flex-col space-y-2 w-full"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-text-primary">{index + 1}. {item.name}</span>
                                <div className="flex items-center space-x-2">
                                  <button onClick={() => movePresentationItem(index, 'up')} disabled={index === 0} className="text-text-secondary hover:text-accent-blue disabled:opacity-50"><i className="fas fa-arrow-up"></i></button>
                                  <button onClick={() => movePresentationItem(index, 'down')} disabled={index === presentationItems.length - 1} className="text-text-secondary hover:text-accent-blue disabled:opacity-50"><i className="fas fa-arrow-down"></i></button>
                                  <button onClick={() => removeFromPresentation(item.id)} className="text-accent-red hover:text-accent-red/80"><i className="fas fa-trash"></i></button>
                                </div>
                              </div>
                              <textarea
                                className="cds-input-cinematic w-full text-sm"
                                placeholder="Add annotation for this evidence..."
                                value={item.annotation || ''}
                                onChange={(e) => updateAnnotation(item.id, e.target.value)}
                                rows={2}
                              />
                            </li>
                          </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => setIsPresenterMode(true)}
                  className="c-btn shimmer-btn w-1/2"
                  disabled={presentationItems.length === 0}
                >
                  Start Presentation
                </button>
                <button
                  onClick={handlePrepareBinder}
                  className="c-btn bg-accent-violet w-1/2"
                  disabled={presentationItems.length === 0 || !selectedCase}
                >
                  Prepare Binder
                </button>
              </div>
            </div>

            {/* Current Evidence Preview */}
            <div className="md:col-span-1 bg-background-surface p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Selected Evidence Preview</h3>
              <div className="w-full h-64 border border-border-default rounded-lg overflow-hidden">
                {renderEvidencePreview(selectedEvidence)}
              </div>
              {selectedEvidence && (
                <button
                  onClick={() => {
                    window.open(selectedEvidence.url, '_blank', 'noopener,noreferrer,width=800,height=600');
                  }}
                  className="c-btn mt-4 w-full text-sm"
                >
                  Popout Document
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="relative w-full max-w-4xl h-3/4 bg-background-surface rounded-lg shadow-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPresentationEvidence?.id || 'empty'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {renderEvidencePreview(currentPresentationEvidence, "w-full h-full")}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xl font-semibold text-text-primary">
                {currentPresentationEvidence?.name || 'No Evidence Selected'}
              </p>
              <p className="text-text-secondary mt-2 max-w-2xl">
                {currentPresentationEvidence?.annotation || 'No annotation for this evidence.'}
              </p>
            </div>
            <div className="flex space-x-4 mt-6">
              <button onClick={handlePrevious} disabled={presentationItems.length === 0} className="c-btn">
                Previous
              </button>
              <button onClick={handleNext} disabled={presentationItems.length === 0} className="c-btn">
                Next
              </button>
              <button onClick={() => setIsPresenterMode(false)} className="c-btn bg-accent-red">
                Exit Presentation
              </button>
            </div>
          </div>
        )}
      </motion.div>
      <DocumentPreviewModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        documentUrl={modalDocumentUrl}
        documentType={modalDocumentType}
        documentName={modalDocumentName}
      />
    </div>
  );
}
