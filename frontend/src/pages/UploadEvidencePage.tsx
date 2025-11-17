import React, { useState } from 'react';
import DocumentUploadZone from '../components/DocumentUploadZone';

interface UploadedDocument {
  doc_id: string;
  file_name: string;
  doc_type: string;
  ingestion_status: string;
  pipeline_result: string[];
}

const UploadEvidencePage: React.FC = () => {
  const [caseId, setCaseId] = useState('default-case-id'); // Placeholder for case ID
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUploadSuccess = (response: any) => {
    setUploadedDocuments((prevDocs) => [...prevDocs, {
      doc_id: response.data.doc_id,
      file_name: response.data.file_name,
      doc_type: response.data.doc_type,
      ingestion_status: response.data.ingestion_status,
      pipeline_result: response.data.pipeline_result,
    }]);
    setMessage({ type: 'success', text: response.message });
  };

  const handleUploadError = (error: any) => {
    console.error('Upload error:', error);
    setMessage({ type: 'error', text: `Upload failed: ${error.response?.data?.detail || error.message}` });
  };

  return (
    <div className="cds-main-cinematic">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Upload Evidence</h1>

      {message && (
        <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-accent-green/20 text-accent-green border border-accent-green/40' : 'bg-accent-red/20 text-accent-red border border-accent-red/40'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="caseId" className="block text-sm font-medium text-text-secondary">Case ID:</label>
        <input
          type="text"
          id="caseId"
          className="cds-input-cinematic mt-1 block w-full"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        />
      </div>

      <DocumentUploadZone
        caseId={caseId}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      <h2 className="text-xl font-bold text-text-primary mt-8 mb-4">Uploaded Documents</h2>
      {
        uploadedDocuments.length === 0 ? (
          <p className="text-text-secondary">No documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto cds-card-cinematic p-4">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-background-panel">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">File Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Categories</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Doc ID</th>
                </tr>
              </thead>
              <tbody className="bg-background-surface divide-y divide-border-subtle">
                {uploadedDocuments.map((doc) => (
                  <tr key={doc.doc_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{doc.file_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{doc.doc_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{doc.ingestion_status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{doc.pipeline_result.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{doc.doc_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
};

export default UploadEvidencePage;
