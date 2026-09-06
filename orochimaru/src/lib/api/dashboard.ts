import { http } from './http';
import type { ApiEnvelope } from './envelope';
import type { AssetHistoryEvent } from '@/types';

export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  borrowedAssets: number;
  maintenanceAssets: number;
  disposedAssets: number;
  totalValue: number;
}

export interface CategoryCount { slug: string; name: string; count: number }

export async function getDashboardStats() {
  const { data } = await http.get<ApiEnvelope<DashboardStats>>('/api/v1/dashboard/stats');
  return data;
}

export async function getAssetsByCategory() {
  const { data } = await http.get<ApiEnvelope<CategoryCount[]>>('/api/v1/dashboard/assets-by-category');
  return data;
}

export async function getRecentActivity(limit = 10) {
  const { data } = await http.get<ApiEnvelope<AssetHistoryEvent[]>>(`/api/v1/dashboard/recent-activity?limit=${limit}`);
  return data;
}

// Explorer summary types
export interface ExplorerSummary {
  ok: boolean;
  network: { org?: string; peers?: number; orderers?: number; height?: string };
  latestBlocks: Array<{ number: string; txCount: number; txs: Array<{ txId: string; timestamp?: string; type?: string }> }>;
  recentEvents: Array<{ txId: string; kind: string; assetId: string; date: string; blockNumber?: string }>;
}

export async function getExplorerSummary(limit = 10, blocks = 5) {
  const { data } = await http.get<ApiEnvelope<ExplorerSummary>>(`/api/v1/explorer/summary?limit=${limit}&blocks=${blocks}`);
  return data;
}

export async function getExplorerTx(txId: string) {
  const { data } = await http.get<ApiEnvelope<any>>(`/api/v1/explorer/tx/${encodeURIComponent(txId)}`);
  return data;
}

export async function getExplorerBlockByTx(txId: string) {
  const { data } = await http.get<ApiEnvelope<any>>(`/api/v1/explorer/blockByTx/${encodeURIComponent(txId)}`);
  return data;
}
