import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentType: string | null;
  documentName: string | null;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentType,
  documentName,
}) => {
  if (!isOpen || !documentUrl) return null;

  const renderContent = () => {
    if (!documentType) return <p className="text-text-secondary">Unknown document type.</p>;

    switch (documentType) {
      case 'image':
        return <img src={documentUrl} alt={documentName || 'Document Preview'} className="max-w-full max-h-full object-contain" />;
      case 'pdf':
      case 'my_documents':
      case 'opposition_documents':
        return <iframe src={documentUrl} className="w-full h-full border-none" title={documentName || 'Document Preview'} />;
      case 'video':
        return <video src={documentUrl} controls className="max-w-full max-h-full object-contain" />;
      default:
        return <p className="text-text-secondary">Unsupported document type: {documentType}</p>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background-surface rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
          >
            <div className="flex justify-between items-center p-4 border-b border-border-default">
              <h3 id="document-preview-title" className="text-lg font-semibold text-text-primary">
                {documentName || 'Document Preview'}
              </h3>
              <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-grow p-4 overflow-hidden">
              {renderContent()}
            </div>
            {/* TODO: Add advanced features here:
                - Zoom, pan, rotate for PDFs
                - Text search and highlighting
                - Annotation tools
                - Side-by-side comparison of documents
                - Integration with a dedicated PDF viewer library (e.g., react-pdf, PDF.js)
            */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentPreviewModal;
