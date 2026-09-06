// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole =
  | 'admin'            // existing admin
  | 'staff'            // existing staff
  | 'admin_asset'      // new: asset admin
  | 'purchasing'       // new: purchasing
  | 'head_unit'        // new: head unit approver
  | 'auditor';         // new: auditor

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatar?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// ASSET TYPES
// ============================================

export type AssetStatus = 'active' | 'borrowed' | 'maintenance' | 'disposed' | 'transfer_pending';

export type AssetCategory =
  | 'laptop'
  | 'proyektor'
  | 'kendaraan'
  | 'furniture'
  | 'elektronik'
  | 'lainnya';

export interface Asset {
  assetId: string;
  name: string;
  category: AssetCategory;
  description?: string;
  serialNumber?: string;

  // Ownership & Location
  owner: string; // User ID
  ownerName: string;
  location: string;
  locationDetail?: string;
  status: AssetStatus;

  // Acquisition Info
  acquisitionDate: string;
  acquisitionPrice: number;
  vendor?: string;
  invoiceNumber?: string;

  // Blockchain Info (mock)
  txId?: string;
  blockNumber?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TRANSACTION / BLOCKCHAIN TYPES
// ============================================

export type TransactionType =
  | 'CREATE'
  | 'TRANSFER'
  | 'MAINTENANCE'
  | 'DISPOSE';

export interface BlockchainTransaction {
  txId: string;
  blockNumber: number;
  blockHash: string;
  previousHash: string;
  type: TransactionType;
  assetId: string;
  assetName: string;
  timestamp: string;
  payload: Record<string, unknown>;
  status: 'committed' | 'pending' | 'failed';
}

// ============================================
// TRANSFER TYPES
// ============================================

export type TransferType = 'borrow' | 'permanent';

export interface TransferRecord {
  id: string;
  assetId: string;
  assetName: string;
  fromOwner: string;
  fromOwnerName: string;
  toOwner: string;
  toOwnerName: string;
  fromLocation: string;
  toLocation: string;
  transferType: TransferType;
  borrowDuration?: number; // days
  dueDate?: string;
  notes?: string;
  date: string;
  txId: string;
  blockNumber: number;
}

// ============================================
// MAINTENANCE TYPES
// ============================================

export type MaintenanceType =
  | 'routine'
  | 'repair'
  | 'upgrade'
  | 'calibration';

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  type: MaintenanceType;
  date: string;
  notes: string;
  cost: number;
  technician?: string;
  vendor?: string;
  txId: string;
  blockNumber: number;
}

// ============================================
// ASSET HISTORY / TIMELINE
// ============================================

export type HistoryEventType =
  | 'create'
  | 'assign'
  | 'transfer'
  | 'maintenance'
  | 'maintenance_complete'
  | 'return'
  | 'dispose';

export interface AssetHistoryEvent {
  id: string;
  assetId: string;
  eventType: HistoryEventType;
  date: string;
  description: string;
  details?: Record<string, unknown>;
  txId: string;
  blockNumber: number;
}

// ============================================
// DISPOSAL TYPES
// ============================================

export type DisposalReason =
  | 'damaged_unrepairable'
  | 'obsolete'
  | 'sold'
  | 'donated'
  | 'lost';

export interface DisposalRecord {
  id: string;
  assetId: string;
  assetName: string;
  reason: DisposalReason;
  notes: string;
  date: string;
  approvedBy: string;
  approvedByName: string;
  txId: string;
  blockNumber: number;
}

// ============================================
// CATEGORY & LOCATION (OFF-CHAIN)
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: AssetCategory;
  description?: string;
  icon?: string;
}

export interface Location {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  borrowedAssets: number;
  maintenanceAssets: number;
  disposedAssets: number;
  totalValue: number;
}

// ============================================
// API / SERVICE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// FORM TYPES
// ============================================

// ============================================
// DOCUMENT TYPES (OFF-CHAIN)
// ============================================

export type DocumentType =
  | 'image'
  | 'invoice'
  | 'warranty'
  | 'berita_acara'
  | 'maintenance_receipt'
  | 'handover_borrow'
  | 'handover_return';

export interface DocumentItem {
  id: string;
  assetId: string;
  fileName: string;
  type: DocumentType;
  ipfsCid: string;
  hashSha256: string;
  uploadedBy: string; // user id (mock)
  createdAt: string;
}

// ============================================
// APPROVAL TYPES
// ============================================

export type ApprovalType = 'transfer' | 'dispose';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  assetId: string;
  assetName: string;
  requesterId: string;
  requesterName: string;
  toUnit?: string;
  fromUnit?: string;
  reason?: string;
  // for transfer approvals
  transferType?: 'borrow' | 'permanent';
  toOwnerId?: string;
  toLocationId?: string;
  createdAt: string;
  status: ApprovalStatus;
  notes?: string[]; // approvals notes
  // quorum (optional, if provided by backend)
  requiredApprovals?: number;
  approvedCount?: number;
  votes?: Array<{ user: string; decision: 'APPROVE' | 'REJECT'; at: string; note?: string }>;
}

export interface CreateAssetForm {
  name: string;
  category: AssetCategory;
  description?: string;
  serialNumber?: string;
  acquisitionDate: string;
  acquisitionPrice: number;
  vendor?: string;
  invoiceNumber?: string;
  location: string;
  owner: string;
}

export interface TransferAssetForm {
  assetId: string;
  toOwner: string;
  toLocation: string;
  transferType: TransferType;
  borrowDuration?: number;
  notes?: string;
}

export interface MaintenanceForm {
  assetId: string;
  type: MaintenanceType;
  date: string;
  notes: string;
  cost: number;
  technician?: string;
  vendor?: string;
}

export interface DisposeAssetForm {
  assetId: string;
  reason: DisposalReason;
  notes: string;
  approvedBy: string;
}
