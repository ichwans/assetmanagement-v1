import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'USR-001',
    email: 'admin@assethub.com',
    name: 'Admin Sistem',
    role: 'admin',
    department: 'IT Department',
    avatarUrl: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'USR-009',
    email: 'kepala.unit@assethub.com',
    name: 'Kepala Unit A',
    role: 'head_unit',
    department: 'Unit A',
    avatarUrl: undefined,
    createdAt: '2024-02-12T00:00:00Z',
    updatedAt: '2024-02-12T00:00:00Z',
  },
  {
    id: 'USR-010',
    email: 'purchasing@assethub.com',
    name: 'Staf Purchasing',
    role: 'purchasing',
    department: 'Procurement',
    avatarUrl: undefined,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'USR-011',
    email: 'auditor@assethub.com',
    name: 'Auditor Internal',
    role: 'auditor',
    department: 'Audit',
    avatarUrl: undefined,
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'USR-002',
    email: 'budi.santoso@assethub.com',
    name: 'Budi Santoso',
    role: 'staff',
    department: 'IT Department',
    avatarUrl: undefined,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'USR-003',
    email: 'andi.wijaya@assethub.com',
    name: 'Andi Wijaya',
    role: 'staff',
    department: 'Finance',
    avatarUrl: undefined,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'USR-004',
    email: 'citra.dewi@assethub.com',
    name: 'Citra Dewi',
    role: 'staff',
    department: 'HR',
    avatarUrl: undefined,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'USR-005',
    email: 'deni.pratama@assethub.com',
    name: 'Deni Pratama',
    role: 'staff',
    department: 'Marketing',
    avatarUrl: undefined,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'USR-006',
    email: 'eva.susanti@assethub.com',
    name: 'Eva Susanti',
    role: 'staff',
    department: 'Operations',
    avatarUrl: undefined,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'USR-007',
    email: 'fajar.hidayat@assethub.com',
    name: 'Fajar Hidayat',
    role: 'admin',
    department: 'IT Department',
    avatarUrl: undefined,
    createdAt: '2024-02-05T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
  },
  {
    id: 'USR-008',
    email: 'gita.permata@assethub.com',
    name: 'Gita Permata',
    role: 'staff',
    department: 'Akademik',
    avatarUrl: undefined,
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
];

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find((user) => user.email === email);
};

export const getStaffUsers = (): User[] => {
  return mockUsers.filter((user) => user.role === 'staff');
};

// ------------------------------------------------------------------
// password reset helpers for mock environment
// ------------------------------------------------------------------

// map token -> email
export const mockResetTokens: Record<string, string> = {};

export function createResetToken(email: string): string {
  const token = Math.random().toString(36).substring(2, 12);
  mockResetTokens[token] = email;
  return token;
}

export function validateResetToken(token: string): string | undefined {
  return mockResetTokens[token];
}

export function consumeResetToken(token: string) {
  delete mockResetTokens[token];
}

export const getAdminUsers = (): User[] => {
  return mockUsers.filter((user) => user.role === 'admin');
};

// Mock credentials for login
export const mockCredentials: Record<string, string> = {
  'admin@assethub.com': 'admin123',
  'budi.santoso@assethub.com': 'staff123',
  'andi.wijaya@assethub.com': 'staff123',
  'kepala.unit@assethub.com': 'head123',
  'purchasing@assethub.com': 'purch123',
  'auditor@assethub.com': 'audit123',
};
