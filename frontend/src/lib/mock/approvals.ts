import { ApprovalItem, ApprovalStatus, ApprovalType } from '@/types';
import { updateAssetStatus, updateAssetOwnerAndLocation } from './assets';

let approvals: ApprovalItem[] = [
  {
    id: 'APP-001',
    type: 'transfer',
    assetId: 'AST-002',
    assetName: 'Laptop HP EliteBook 840 G8',
    requesterId: 'USR-001',
    requesterName: 'Admin Sistem',
    fromUnit: 'IT Department',
    toUnit: 'Unit A',
    reason: 'Mutasi inventaris',
    createdAt: '2025-01-20T06:00:00Z',
    status: 'PENDING',
    notes: [],
  },
  {
    id: 'APP-002',
    type: 'dispose',
    assetId: 'AST-005',
    assetName: 'Laptop Acer Aspire 5',
    requesterId: 'USR-007',
    requesterName: 'Fajar Hidayat',
    fromUnit: 'IT Department',
    reason: 'Rusak berat',
    createdAt: '2025-01-22T08:15:00Z',
    status: 'PENDING',
    notes: [],
  },
];

export function getApprovals(status: ApprovalStatus = 'PENDING'): ApprovalItem[] {
  return approvals.filter((a) => a.status === status).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getApprovalById(id: string): ApprovalItem | undefined {
  return approvals.find((a) => a.id === id);
}

export function decideApproval(id: string, decision: 'APPROVE' | 'REJECT', note?: string): ApprovalItem | undefined {
  const item = approvals.find((a) => a.id === id);
  if (!item) return undefined;
  item.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  if (note) item.notes?.push(note);
  // Apply side-effects (mock): update asset status on approval
  if (decision === 'APPROVE') {
    if (item.type === 'transfer') {
      // Update owner & location if provided
      if (item.toOwnerId && item.toLocationId) {
        updateAssetOwnerAndLocation(item.assetId, item.toOwnerId, item.toLocationId);
      }
      // Set to borrowed if transferType = borrow, otherwise active
      updateAssetStatus(item.assetId, item.transferType === 'borrow' ? 'borrowed' : 'active');
    } else if (item.type === 'dispose') {
      updateAssetStatus(item.assetId, 'disposed');
    }
  } else if (decision === 'REJECT' && item.type === 'transfer') {
    // Revert transfer pending to active on reject
    updateAssetStatus(item.assetId, 'active');
  }
  return item;
}

const makeId = () => `APP-${Math.floor(Math.random() * 900 + 100)}`;

export function createTransferApproval(params: {
  assetId: string;
  assetName: string;
  requesterId: string;
  requesterName: string;
  fromUnit?: string;
  toUnit?: string;
  reason?: string;
  transferType?: 'borrow' | 'permanent';
  toOwnerId?: string;
  toLocationId?: string;
}): ApprovalItem {
  const item: ApprovalItem = {
    id: makeId(),
    type: 'transfer',
    assetId: params.assetId,
    assetName: params.assetName,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    fromUnit: params.fromUnit,
    toUnit: params.toUnit,
    reason: params.reason,
    transferType: params.transferType,
    toOwnerId: params.toOwnerId,
    toLocationId: params.toLocationId,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    notes: [],
  };
  approvals.push(item);
  return item;
}

export function createDisposeApproval(params: {
  assetId: string;
  assetName: string;
  requesterId: string;
  requesterName: string;
  reason?: string;
}): ApprovalItem {
  const item: ApprovalItem = {
    id: makeId(),
    type: 'dispose',
    assetId: params.assetId,
    assetName: params.assetName,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    reason: params.reason,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    notes: [],
  };
  approvals.push(item);
  return item;
}
