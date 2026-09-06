import { http } from './http';
import type { ApiEnvelope } from './envelope';

/**
 * Fetch a protected file as Blob via backend files endpoint.
 * - Path: /api/v1/files/:cid
 * - Query: filename (mime hint), optional path (for directory CIDs)
 */
export async function getFileBlob(cid: string, filename: string, path?: string): Promise<Blob> {
  const qs = new URLSearchParams();
  if (filename) qs.set('filename', filename);
  if (path) qs.set('path', path);
  const url = `/api/v1/files/${encodeURIComponent(cid)}?${qs.toString()}`;
  const res = await http.get(url, { responseType: 'blob' });
  return res.data as Blob;
}

/**
 * Request a temporary signed URL that can be used directly in <img> or <a> without auth headers.
 * GET /api/v1/files/signed?cid=&path=&filename=&expires=
 */
export async function getSignedFileUrl(params: { cid: string; filename: string; path?: string; expires?: number }): Promise<string> {
  const qs = new URLSearchParams();
  qs.set('cid', params.cid);
  if (params.path) qs.set('path', params.path);
  if (params.filename) qs.set('filename', params.filename);
  if (params.expires != null) qs.set('expires', String(params.expires));
  const url = `/api/v1/files/signed?${qs.toString()}`;
  const res = await http.get<ApiEnvelope<{ url: string } | string>>(url);
  const envelope = res.data as unknown as ApiEnvelope<{ url: string } | string>;
  const payload = envelope?.data;
  if (typeof payload === 'string') return payload;
  if (payload && typeof (payload as any).url === 'string') return (payload as any).url;
  throw new Error('Signed URL tidak valid');
}
