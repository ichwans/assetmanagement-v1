import { http } from './http';
import type { ApiEnvelope } from './envelope';
import type { Asset, AssetHistoryEvent, MaintenanceRecord, DocumentItem, CreateAssetForm, MaintenanceForm } from '@/types';

type PageData<T> = { results: T[]; pagination: { page: number; totalPages: number; totalItems: number; limit: number; hasNext: boolean; hasPrevious: boolean } };
export type ListAssetsQuery = Partial<{ page: number; limit: number; search: string; status: string; category: string; location: string; owner: string }>;

export async function listAssets(params?: ListAssetsQuery) {
  const query = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const path = query.toString() ? `/api/v1/assets?${query.toString()}` : '/api/v1/assets';
  const { data } = await http.get<ApiEnvelope<PageData<Asset>>>(path);
  return data;
}

export async function getAssetDetail(id: string) {
  const { data } = await http.get<ApiEnvelope<Asset>>(`/api/v1/assets/${encodeURIComponent(id)}`);
  return data;
}

export async function getAssetHistoryApi(id: string) {
  const { data } = await http.get<ApiEnvelope<AssetHistoryEvent[]>>(`/api/v1/assets/${encodeURIComponent(id)}/history`);
  return data;
}

export async function getAssetMaintenanceApi(id: string) {
  const { data } = await http.get<ApiEnvelope<MaintenanceRecord[]>>(`/api/v1/assets/${encodeURIComponent(id)}/maintenance`);
  return data;
}

export async function getAssetDocumentsApi(id: string) {
  const { data } = await http.get<ApiEnvelope<DocumentItem[]>>(`/api/v1/assets/${encodeURIComponent(id)}/documents`);
  return data;
}

export async function uploadAssetDocumentApi(id: string, body: Pick<DocumentItem, 'fileName'|'type'> & { ipfsCid: string; hashSha256: string }) {
  const { data } = await http.post<ApiEnvelope<DocumentItem>>(`/api/v1/assets/${encodeURIComponent(id)}/documents`, body);
  return data;
}

export async function uploadAssetDocumentFile(id: string, file: File, type: string) {
  const form = new FormData();
  form.append('file', file, file.name);
  form.append('type', type);
  // Do NOT set Content-Type manually; the browser will set the proper
  // multipart/form-data boundary automatically for FormData.
  const { data } = await http.post<ApiEnvelope<DocumentItem>>(`/api/v1/assets/${encodeURIComponent(id)}/documents/upload`, form);
  return data;
}

export async function createAssetApi(body: CreateAssetForm) {
  const { data } = await http.post<ApiEnvelope<Asset>>('/api/v1/assets', body);
  return data;
}

export async function addMaintenanceApi(id: string, body: Omit<MaintenanceForm, 'assetId'>) {
  const { data } = await http.post<ApiEnvelope<MaintenanceRecord>>(`/api/v1/assets/${encodeURIComponent(id)}/maintenance`, body);
  return data;
}

export async function updateAssetStatusApi(id: string, status: 'active'|'borrowed'|'maintenance'|'disposed'|'transfer_pending') {
  const { data } = await http.post<ApiEnvelope<unknown>>(`/api/v1/assets/${encodeURIComponent(id)}/status`, { status });
  return data;
}

export async function completeMaintenanceApi(id: string, body: { date?: string; notes?: string }) {
  const { data } = await http.post<ApiEnvelope<{ txId?: string }>>(`/api/v1/assets/${encodeURIComponent(id)}/maintenance/complete`, body);
  return data;
}
