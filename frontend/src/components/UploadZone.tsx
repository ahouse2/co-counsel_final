import { motion } from 'framer-motion';
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { JSX } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUploadEvidence, useIngestionStatus } from '@/hooks/useIngestion';
import type { IngestionJobStatus } from '@/types/ingestion';

type UploadEntry = {
  documentId: string;
  fileName: string;
  relativePath?: string;
  jobId?: string;
  status: IngestionJobStatus;
  error?: string;
};

const STATUS_LABELS: Record<IngestionJobStatus, string> = {
  queued: 'Queued',
  running: 'Processing',
  succeeded: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const STATUS_CLASS: Partial<Record<IngestionJobStatus, string>> = {
  queued: 'status-pill pending',
  running: 'status-pill running',
  succeeded: 'status-pill success',
  failed: 'status-pill error',
  cancelled: 'status-pill error',
};

const TERMINAL_STATUSES: IngestionJobStatus[] = [
  'succeeded',
  'failed',
  'cancelled',
];

const formatTimestamp = (value?: string): string => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleTimeString();
};

export function UploadZone(): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const uploadMutation = useUploadEvidence();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const documentIds = useMemo(
    () => uploads.map((upload) => upload.documentId),
    [uploads]
  );

  const statusQueries = useIngestionStatus(documentIds);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const extendedFile = file as File & { webkitRelativePath?: string };
      const relativePath = extendedFile.webkitRelativePath || undefined;
      const documentId = uuidv4();

      setUploads((current) => [
        ...current,
        {
          documentId,
          fileName: file.name,
          relativePath,
          status: 'queued',
        },
      ]);

      try {
        const response = await uploadMutation.mutateAsync({
          file,
          documentId,
          relativePath,
        });
        setUploads((current) =>
          current.map((entry) =>
            entry.documentId === documentId
              ? {
                  ...entry,
                  jobId: response.job_id,
                  status: response.status,
                }
              : entry
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Upload failed';
        setGlobalError(message);
        setUploads((current) =>
          current.map((entry) =>
            entry.documentId === documentId
              ? {
                  ...entry,
                  status: 'failed',
                  error: message,
                }
              : entry
          )
        );
      }
    },
    [uploadMutation]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      setGlobalError(null);
      for (const file of files) {
        await processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (event.dataTransfer?.files?.length) {
        void processFiles(Array.from(event.dataTransfer.files));
      }
    },
    [processFiles]
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        void processFiles(Array.from(files));
      }
      // Reset the input so the same file can be selected again
      event.target.value = '';
    },
    [processFiles]
  );

  const isUploading = uploadMutation.isPending;
  const zoneClassName = `upload-zone ${isDragging ? 'dragging' : ''} ${
    isUploading ? 'uploading' : ''
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="evidence-upload"
    >
      <div className="upload-intro">
        <h2>Evidence Upload & File Intelligence</h2>
        <p>Securely ingest folders or single documents for AI processing.</p>
      </div>
      <div
        className={zoneClassName}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          multiple
          webkitdirectory="true"
          directory="true"
        />
        <div className="upload-copy">
          <div className="upload-icon text-accent-cyan">
            {isUploading ? (
              <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />
            ) : (
              <i className="fa-solid fa-file-arrow-up" aria-hidden />
            )}
          </div>
          <p className="upload-title">
            {isDragging ? 'Drop to ingest' : 'Drag & Drop or Browse Files'}
          </p>
          <p className="upload-subtitle text-text-secondary">
            Supports entire folders, PDF, video, audio, and image evidence.
          </p>
          {globalError && (
            <p className="text-accent-red text-sm mt-2">Error: {globalError}</p>
          )}
        </div>
        <div className="upload-ring">
          <div className="ring-glow"></div>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="uploaded-files">
          {uploads.map((upload) => {
            const statusQuery = statusQueries[upload.documentId];
            const status =
              statusQuery?.data?.status ?? upload.status ?? 'queued';
            const jobId =
              statusQuery?.data?.job_id ?? upload.jobId ?? 'pending';
            const statusDetails = statusQuery?.data?.status_details;
            const isTerminal = TERMINAL_STATUSES.includes(status);
            const queryError =
              statusQuery?.error instanceof Error
                ? statusQuery.error.message
                : undefined;
            const effectiveError = upload.error ?? queryError;

            return (
              <div key={upload.documentId} className="uploaded-file">
                <header>
                  <div>
                    <span className="file-name">{upload.fileName}</span>
                    {upload.relativePath && (
                      <p className="text-xs text-text-tertiary">
                        {upload.relativePath}
                      </p>
                    )}
                  </div>
                  <span
                    className={`${STATUS_CLASS[status] ?? 'status-pill'}`}
                    aria-live="polite"
                  >
                    {statusQuery?.isFetching && !isTerminal ? (
                      <i className="fa-solid fa-circle-notch fa-spin mr-1" />
                    ) : null}
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </header>
                <p className="text-xs text-text-tertiary">
                  Job ID: {jobId} • Updated:{' '}
                  {formatTimestamp(statusQuery?.data?.updated_at)}
                </p>
                {statusDetails && (
                  <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary mt-3">
                    <div>
                      <p className="font-semibold text-text-primary">
                        Ingestion
                      </p>
                      <p>
                        Documents:{' '}
                        {statusDetails.ingestion?.documents ?? '—'}
                      </p>
                      <p>
                        Timeline:{' '}
                        {statusDetails.timeline?.events ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Graph & Forensics
                      </p>
                      <p>Nodes: {statusDetails.graph?.nodes ?? '—'}</p>
                      <p>
                        Artifacts:{' '}
                        {statusDetails.forensics?.artifacts?.length ?? 0}
                      </p>
                    </div>
                  </div>
                )}
                {effectiveError && (
                  <p className="text-accent-red text-xs mt-3">
                    {effectiveError}
                  </p>
                )}
                {isTerminal && !effectiveError && status === 'succeeded' && (
                  <p className="text-xs text-accent-green mt-3">
                    Pipeline completed successfully. You can now explore this
                    evidence in the halo modules.
                  </p>
                )}
                {!isTerminal && (
                  <p className="text-xs text-text-secondary mt-3">
                    Monitoring ingestion... next update in a few seconds.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
