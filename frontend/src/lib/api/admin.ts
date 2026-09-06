import { http } from '@/lib/api/http';

export async function resetAssets(confirm: string) {
  return http.post('/api/v1/admin/reset/assets', { confirm });
}

export async function resetMeta(confirm: string) {
  return http.post('/api/v1/admin/reset/meta', { confirm });
}

