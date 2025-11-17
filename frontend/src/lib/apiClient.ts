import type {
  IngestionResponse,
  IngestionStatusResponse,
} from '@/types/ingestion';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const API_BASE_URL =
  RAW_BASE_URL === '/' || RAW_BASE_URL === ''
    ? ''
    : RAW_BASE_URL.replace(/\/$/, '');

export class ApiError<T = unknown> extends Error {
  public readonly status: number;
  public readonly info?: T;

  constructor(message: string, status: number, info?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.info = info;
  }
}

async function parseResponse<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as unknown as T;
}

function buildUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...init,
  });

  const payload = await parseResponse<T>(response);

  if (!response.ok) {
    const message =
      (payload as { detail?: string })?.detail ??
      response.statusText ??
      'Request failed';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export type UploadEvidenceParams = {
  file: File;
  documentId: string;
  relativePath?: string;
};

async function uploadEvidence({
  file,
  documentId,
  relativePath,
}: UploadEvidenceParams): Promise<IngestionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_id', documentId);
  if (relativePath) {
    formData.append('relative_path', relativePath);
  }

  return apiFetch<IngestionResponse>('/ingestion', {
    method: 'POST',
    body: formData,
  });
}

function getIngestionStatus(
  documentId: string
): Promise<IngestionStatusResponse> {
  return apiFetch<IngestionStatusResponse>(`/ingestion/${documentId}/status`);
}

export const apiClient = {
  uploadEvidence,
  getIngestionStatus,
};

