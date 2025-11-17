import {
  useMutation,
  useQueries,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiClient, type UploadEvidenceParams } from '@/lib/apiClient';
import type {
  IngestionResponse,
  IngestionStatusResponse,
  IngestionJobStatus,
} from '@/types/ingestion';

const TERMINAL_STATUSES: IngestionJobStatus[] = [
  'succeeded',
  'failed',
  'cancelled',
];

export function useUploadEvidence(): UseMutationResult<
  UploadEvidenceResult,
  unknown,
  UploadEvidenceParams,
  unknown
> {
  return useMutation<UploadEvidenceResult, unknown, UploadEvidenceParams>({
    mutationFn: apiClient.uploadEvidence,
  });
}

export function useIngestionStatus(
  documentIds: string[]
): Record<string, UseQueryResult<IngestionStatusResponse>> {
  const queries = useQueries({
    queries: documentIds.map((documentId) => ({
      queryKey: ['ingestion-status', documentId],
      queryFn: () => apiClient.getIngestionStatus(documentId),
      enabled: Boolean(documentId),
      refetchInterval: (query: {
        state: { data?: IngestionStatusResponse | undefined };
      }) => {
        const status = query.state.data?.status;
        if (!status) {
          return 5_000;
        }
        return TERMINAL_STATUSES.includes(status) ? false : 5_000;
      },
    })),
  });

  return documentIds.reduce<
    Record<string, UseQueryResult<IngestionStatusResponse>>
  >((acc, documentId, index) => {
    acc[documentId] = queries[index] as UseQueryResult<IngestionStatusResponse>;
    return acc;
  }, {});
}

export type UploadEvidenceResult = IngestionResponse;

