import { http } from './http';
import type { ApiEnvelope } from './envelope';
import type { ApprovalItem } from '@/types';

export async function listApprovals(status?: 'PENDING'|'APPROVED'|'REJECTED') {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const { data } = await http.get<ApiEnvelope<ApprovalItem[]>>(`/api/v1/approvals${qs}`);
  return data;
}

export async function getApprovalByIdApi(id: string) {
  const { data } = await http.get<ApiEnvelope<ApprovalItem>>(`/api/v1/approvals/${encodeURIComponent(id)}`);
  return data;
}

export async function decideApprovalApi(id: string, decision: 'APPROVE'|'REJECT', note?: string) {
  const { data } = await http.post<ApiEnvelope<ApprovalItem>>(`/api/v1/approvals/${encodeURIComponent(id)}/decision`, { decision, note });
  return data;
}

export interface CreateTransferApprovalBody {
  assetId: string;
  assetName: string;
  requesterName: string;
  transferType: 'borrow'|'permanent';
  toOwnerId: string;
  toLocationId: string;
  borrowDuration?: number;
  notes?: string;
}

export async function createTransferApprovalApi(body: CreateTransferApprovalBody) {
  const { data } = await http.post<ApiEnvelope<ApprovalItem>>(`/api/v1/approvals/transfer`, body);
  return data;
}

export interface CreateDisposeApprovalBody {
  assetId: string;
  assetName: string;
  requesterName: string;
  reason: string;
  notes: string;
}

export async function createDisposeApprovalApi(body: CreateDisposeApprovalBody) {
  const { data } = await http.post<ApiEnvelope<ApprovalItem>>(`/api/v1/approvals/dispose`, body);
  return data;
}
