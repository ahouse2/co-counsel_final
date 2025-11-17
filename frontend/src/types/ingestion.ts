export type IngestionJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface IngestionResponse {
  job_id: string;
  status: IngestionJobStatus;
}

export interface IngestionDocumentModel {
  id: string;
  title: string;
  type: string;
  uri?: string;
  metadata: Record<string, unknown>;
}

export interface IngestionErrorModel {
  code: string;
  message: string;
  source?: string;
}

export interface IngestionStatusDetailsModel {
  ingestion?: {
    documents: number;
    skipped: Array<Record<string, unknown>>;
  };
  timeline?: {
    events: number;
  };
  forensics?: {
    artifacts: Array<Record<string, unknown>>;
    last_run_at: string | null;
  };
  graph?: {
    nodes: number;
    edges: number;
    triples: number;
  };
}

export interface IngestionStatusResponse {
  job_id: string;
  status: IngestionJobStatus;
  submitted_at: string;
  updated_at: string;
  documents: IngestionDocumentModel[];
  errors: IngestionErrorModel[];
  status_details: IngestionStatusDetailsModel;
}

