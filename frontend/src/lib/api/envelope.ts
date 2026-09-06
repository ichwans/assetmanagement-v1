export type ApiStatus =
  | 'AP00000'  // Success
  | 'AP00400'  // Bad Request
  | 'AP00401'  // Unauthorized
  | 'AP00403'  // Forbidden
  | 'AP00404'  // Not Found
  | 'AP00409'  // Conflict (duplicate)
  | 'AP00422'  // Unprocessable Entity
  | 'AP00500'  // Internal Server Error
  | 'AP99999'; // Unknown Error

export interface ApiEnvelope<T> {
  status: ApiStatus;
  message: string;
  data: T;
  errors: Array<{ code: string; title: string; message: string }>;
}

export function isOk(status: ApiStatus): boolean {
  return status === 'AP00000';
}

