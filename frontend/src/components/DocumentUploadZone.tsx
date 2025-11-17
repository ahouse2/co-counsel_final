import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../services/document_api';

interface DocumentUploadZoneProps {
  caseId: string;
  onUploadSuccess: (response: any) => void;
  onUploadError: (error: any) => void;
}

const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({ caseId, onUploadSuccess, onUploadError }) => {
  const [docType, setDocType] = useState<'my_documents' | 'opposition_documents'>('my_documents');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    // Process all accepted files
    for (const file of acceptedFiles) {
      try {
        const response = await uploadDocument(caseId, docType, file);
        onUploadSuccess(response);
      } catch (error) {
        onUploadError(error);
      }
    }
    setIsUploading(false);
  }, [caseId, docType, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true, // Allow multiple file uploads
  });

  return (
    <div className="cds-card-cinematic p-4">
      <div {...getRootProps()} className={`upload-zone-simple cursor-pointer ${isDragActive ? 'dragging' : ''} p-8 rounded-md`}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p className="text-text-secondary">Drop the files or folders here ...</p> :
            <p className="text-text-secondary">Drag 'n' drop some files or folders here, or click to select</p>
        }
        {isUploading && <p className="mt-2 text-accent-cyan">Uploading...</p>}
      </div>
      <div className="mt-4">
        <label htmlFor="docType" className="block text-sm font-medium text-text-secondary">Document Type:</label>
        <select
          id="docType"
          name="docType"
          className="cds-input-cinematic mt-1 block w-full"
          value={docType}
          onChange={(e) => setDocType(e.target.value as 'my_documents' | 'opposition_documents')}
          disabled={isUploading}
        >
          <option value="my_documents">My Documents</option>
          <option value="opposition_documents">Opposition Documents</option>
        </select>
      </div>
    </div>
  );
};

export default DocumentUploadZone;
