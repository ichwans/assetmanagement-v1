import { http } from './http';
import type { ApiEnvelope } from './envelope';
import type { Category, Location } from '@/types';

export async function listCategories() {
  const { data } = await http.get<ApiEnvelope<Category[]>>('/api/v1/meta/categories');
  return data;
}

export async function listLocations() {
  const { data } = await http.get<ApiEnvelope<Location[]>>('/api/v1/meta/locations');
  return data;
}

