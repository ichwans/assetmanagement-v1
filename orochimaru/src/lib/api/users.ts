import { http } from './http';
import type { ApiEnvelope } from './envelope';

export type UserRoleServer = 'admin' | 'user' | 'auditor' | 'head_unit' | 'purchasing' | 'admin_asset';

export interface UserListItem {
  id: string;
  uuid: string;
  fullName: string;
  email: string;
  msisdn: string;
  userType: UserRoleServer;
  status: string;
  tier: string;
  identityType: string;
  reviewedBy: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface UserDetailItem {
  id: number | string;
  uuid: string;
  fullName: string;
  email: string;
  msisdn: string;
  birthDate: string;
  gender: string;
  country: string;
  address: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  identityType: string;
  identityNumber: string;
  selfieImage: string;
  identityImage: string;
  userType: UserRoleServer;
  status: string;
  reviewedBy: string;
  state: string;
  stateDetail: { updatedBy: string; reason: string };
  createdAt: string;
  updatedAt: string;
}

type PageData<T> = { results: T[]; pagination: { page: number; totalPages: number; totalItems: number; limit: number; hasNext: boolean; hasPrevious: boolean } };

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  state?: string;
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Returns server DefaultResponse with pagination data in data.results
export async function getUsersApi(query: GetUsersQuery = {}) {
  const params = new URLSearchParams();

  // Set default date range if not provided (backend requires these)
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const startDate = query.startDate || formatDate(oneYearAgo);
  const endDate = query.endDate || formatDate(today);

  params.set('startDate', startDate);
  params.set('endDate', endDate);

  // Debug: log the dates being sent
  console.log('[getUsersApi] Dates:', { startDate, endDate });

  // Add pagination (backend expects numeric strings; default when missing)
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  params.set('page', String(page));
  params.set('limit', String(limit));

  // Add filters
  if (query.search) params.set('search', query.search);
  if (query.state) params.set('state', query.state);

  const { data } = await http.get<ApiEnvelope<PageData<UserListItem>>>(`/api/v1/users?${params.toString()}`);
  return data;
}

export async function getUserDetailApi(id: string) {
  const { data } = await http.get<ApiEnvelope<UserDetailItem>>(`/api/v1/users/${encodeURIComponent(id)}`);
  return data;
}

export interface CreateUserBody {
  fullName: string;
  email: string;
  password: string;
  userType: UserRoleServer;
}

export async function createUserApi(body: CreateUserBody) {
  const { data } = await http.post<ApiEnvelope<{ email: string; userType: UserRoleServer }>>(`/api/v1/users`, body);
  return data;
}

export interface UpdateUserBody {
  fullName?: string;
  userType?: UserRoleServer;
}

export async function updateUserApi(id: string, body: UpdateUserBody) {
  const { data } = await http.patch<ApiEnvelope<unknown>>(`/api/v1/users/${encodeURIComponent(id)}`, body);
  return data;
}

export interface ChangeUserStatusBody {
  status: 'inactive' | 'banned' | 'active';
  reason?: string;
}

export async function changeUserStatusApi(id: string, body: ChangeUserStatusBody) {
  const { data } = await http.post<ApiEnvelope<unknown>>(`/api/v1/users/${encodeURIComponent(id)}/status`, body);
  return data;
}

export interface ChangeMyPasswordBody { currentPassword: string; newPassword: string }

export async function changeMyPasswordApi(body: ChangeMyPasswordBody) {
  const { data } = await http.post<ApiEnvelope<unknown>>('/api/v1/me/password', body);
  return data;
}
