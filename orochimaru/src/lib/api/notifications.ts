import { http } from '@/lib/api/http';

export type NotificationItem = {
  id: string;
  type: 'transfer' | 'maintenance' | 'asset' | 'approval' | 'system' | string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

export type ListParams = {
  type?: string;
  read?: 'true' | 'false';
  page?: number;
  limit?: number;
};

export type NotificationListResponse = {
  results: NotificationItem[];
  pagination: { page: number; totalPages: number; totalItems: number; limit: number; hasNext?: boolean; hasPrevious?: boolean };
};

export async function listNotifications(params: ListParams = {}): Promise<NotificationListResponse> {
  const res = await http.get('/api/v1/notifications', { params });
  const data = res.data?.data as NotificationListResponse;
  return data;
}

export async function markRead(ids: string[]) {
  return http.post('/api/v1/notifications/mark-read', { ids });
}

export async function markAllRead() {
  return http.post('/api/v1/notifications/mark-all-read');
}
