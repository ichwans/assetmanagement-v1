import { http, TOKEN_STORAGE_KEY } from './http';
import type { ApiEnvelope } from './envelope';

type LoginRes = {
  token: string;
  expires: number;
  profile: { email: string; role: string };
};

type MeRes = {
  id: string;
  email: string;
  role: string;
};

export async function loginApi(email: string, password: string): Promise<LoginRes> {
  const { data } = await http.post<ApiEnvelope<LoginRes>>('/api/v1/auth/login', { email, password });
  if (data.status !== 'AP00000') throw new Error(data.message || 'Login failed');
  localStorage.setItem(TOKEN_STORAGE_KEY, data.data.token);
  return data.data;
}

export async function meApi(): Promise<MeRes> {
  const { data } = await http.get<ApiEnvelope<MeRes>>('/api/v1/me');
  if (data.status !== 'AP00000') throw new Error(data.message || 'Unauthorized');
  return data.data;
}

// send a password reset link to the provided email address
export async function forgotPasswordApi(email: string): Promise<{status:string; message:string}> {
  const { data } = await http.post<ApiEnvelope<null>>('/api/v1/auth/forgot-password', { email });
  // always return the status & message so caller can make a decision
  return { status: data.status, message: data.message };
}

// update the password using token from reset link
export async function resetPasswordApi(token: string, password: string): Promise<void> {
  const { data } = await http.post<ApiEnvelope<null>>('/api/v1/auth/reset-password', { token, password });
  if (data.status !== 'AP00000') throw new Error(data.message || 'Gagal mereset password');
}
