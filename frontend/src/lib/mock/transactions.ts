import {
  BlockchainTransaction,
  TransferRecord,
  MaintenanceRecord,
  AssetHistoryEvent,
} from '@/types';

// Helper to generate mock hashes
const generateHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

const generateTxId = () => {
  const chars = '0123456789abcdef';
  let txId = '';
  for (let i = 0; i < 64; i++) {
    txId += chars[Math.floor(Math.random() * chars.length)];
  }
  return txId;
};

// ============================================
// BLOCKCHAIN TRANSACTIONS
// ============================================

export const mockTransactions: BlockchainTransaction[] = [
  {
    txId: 'tx_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    blockNumber: 1250,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'TRANSFER',
    assetId: 'AST-001',
    assetName: 'Laptop Dell Latitude 5520',
    timestamp: '2024-03-25T10:30:00Z',
    payload: {
      fromOwner: 'Andi Wijaya',
      toOwner: 'Budi Santoso',
      fromLocation: 'Gedung B - Ruang 205',
      toLocation: 'Gedung A - Ruang 101',
      transferType: 'permanent',
      notes: 'Pengembalian setelah selesai project',
    },
    status: 'committed',
  },
  {
    txId: 'tx_3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    blockNumber: 1245,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'MAINTENANCE',
    assetId: 'AST-008',
    assetName: 'Proyektor Sony VPL-EX455',
    timestamp: '2024-03-25T15:00:00Z',
    payload: {
      type: 'repair',
      notes: 'Ganti lampu proyektor dan pembersihan filter',
      cost: 2500000,
      technician: 'Teknisi Sony',
    },
    status: 'committed',
  },
  {
    txId: 'tx_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    blockNumber: 1240,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'CREATE',
    assetId: 'AST-020',
    assetName: 'Sound System Portable JBL EON715',
    timestamp: '2024-03-05T11:00:00Z',
    payload: {
      name: 'Sound System Portable JBL EON715',
      category: 'lainnya',
      acquisitionPrice: 15000000,
      vendor: 'PT. Audio Visual Indonesia',
    },
    status: 'committed',
  },
  {
    txId: 'tx_9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    blockNumber: 1235,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'TRANSFER',
    assetId: 'AST-019',
    assetName: 'Drone DJI Mavic 3',
    timestamp: '2024-03-28T08:00:00Z',
    payload: {
      fromOwner: 'Admin Sistem',
      toOwner: 'Deni Pratama',
      transferType: 'borrow',
      borrowDuration: 7,
      notes: 'Peminjaman untuk shooting event outdoor',
    },
    status: 'committed',
  },
  {
    txId: 'tx_5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    blockNumber: 1230,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'DISPOSE',
    assetId: 'AST-005',
    assetName: 'Laptop Acer Aspire 5',
    timestamp: '2024-03-01T10:00:00Z',
    payload: {
      reason: 'damaged_unrepairable',
      notes: 'Motherboard rusak, biaya perbaikan melebihi nilai asset',
      approvedBy: 'Admin Sistem',
    },
    status: 'committed',
  },
  {
    txId: 'tx_2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
    blockNumber: 1225,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'MAINTENANCE',
    assetId: 'AST-004',
    assetName: 'Laptop ASUS ZenBook 14',
    timestamp: '2024-03-28T16:00:00Z',
    payload: {
      type: 'repair',
      notes: 'Ganti baterai dan thermal paste',
      cost: 1500000,
      vendor: 'ASUS Service Center',
    },
    status: 'committed',
  },
  {
    txId: 'tx_8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    blockNumber: 1220,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'TRANSFER',
    assetId: 'AST-007',
    assetName: 'Proyektor BenQ MH733',
    timestamp: '2024-03-20T09:00:00Z',
    payload: {
      fromOwner: 'Admin Sistem',
      toOwner: 'Eva Susanti',
      transferType: 'borrow',
      borrowDuration: 14,
      notes: 'Untuk keperluan seminar di auditorium',
    },
    status: 'committed',
  },
  {
    txId: 'tx_4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
    blockNumber: 1215,
    blockHash: generateHash(),
    previousHash: generateHash(),
    type: 'CREATE',
    assetId: 'AST-019',
    assetName: 'Drone DJI Mavic 3',
    timestamp: '2024-03-01T10:00:00Z',
    payload: {
      name: 'Drone DJI Mavic 3',
      category: 'lainnya',
      acquisitionPrice: 35000000,
      vendor: 'PT. Aerial Tech',
    },
    status: 'committed',
  },
];

// ============================================
// TRANSFER RECORDS
// ============================================

export const mockTransfers: TransferRecord[] = [
  {
    id: 'TRF-001',
    assetId: 'AST-001',
    assetName: 'Laptop Dell Latitude 5520',
    fromOwner: 'USR-001',
    fromOwnerName: 'Admin Sistem',
    toOwner: 'USR-002',
    toOwnerName: 'Budi Santoso',
    fromLocation: 'Gudang IT',
    toLocation: 'Gedung A - Ruang 101',
    transferType: 'permanent',
    notes: 'Penyerahan laptop untuk staff baru',
    date: '2024-01-20T11:00:00Z',
    txId: generateTxId(),
    blockNumber: 105,
  },
  {
    id: 'TRF-002',
    assetId: 'AST-001',
    assetName: 'Laptop Dell Latitude 5520',
    fromOwner: 'USR-002',
    fromOwnerName: 'Budi Santoso',
    toOwner: 'USR-003',
    toOwnerName: 'Andi Wijaya',
    fromLocation: 'Gedung A - Ruang 101',
    toLocation: 'Gedung B - Ruang 205',
    transferType: 'borrow',
    borrowDuration: 30,
    dueDate: '2024-03-15',
    notes: 'Peminjaman untuk project khusus',
    date: '2024-02-15T09:00:00Z',
    txId: generateTxId(),
    blockNumber: 135,
  },
  {
    id: 'TRF-003',
    assetId: 'AST-001',
    assetName: 'Laptop Dell Latitude 5520',
    fromOwner: 'USR-003',
    fromOwnerName: 'Andi Wijaya',
    toOwner: 'USR-002',
    toOwnerName: 'Budi Santoso',
    fromLocation: 'Gedung B - Ruang 205',
    toLocation: 'Gedung A - Ruang 101',
    transferType: 'permanent',
    notes: 'Pengembalian setelah project selesai',
    date: '2024-03-25T10:30:00Z',
    txId: generateTxId(),
    blockNumber: 1250,
  },
  {
    id: 'TRF-004',
    assetId: 'AST-007',
    assetName: 'Proyektor BenQ MH733',
    fromOwner: 'USR-001',
    fromOwnerName: 'Admin Sistem',
    toOwner: 'USR-006',
    toOwnerName: 'Eva Susanti',
    fromLocation: 'Gudang IT',
    toLocation: 'Gedung B - Auditorium',
    transferType: 'borrow',
    borrowDuration: 14,
    dueDate: '2024-04-03',
    notes: 'Untuk keperluan seminar di auditorium',
    date: '2024-03-20T09:00:00Z',
    txId: generateTxId(),
    blockNumber: 1220,
  },
  {
    id: 'TRF-005',
    assetId: 'AST-019',
    assetName: 'Drone DJI Mavic 3',
    fromOwner: 'USR-001',
    fromOwnerName: 'Admin Sistem',
    toOwner: 'USR-005',
    toOwnerName: 'Deni Pratama',
    fromLocation: 'Gudang IT',
    toLocation: 'Gedung A - Ruang Marketing',
    transferType: 'borrow',
    borrowDuration: 7,
    dueDate: '2024-04-04',
    notes: 'Peminjaman untuk shooting event outdoor',
    date: '2024-03-28T08:00:00Z',
    txId: generateTxId(),
    blockNumber: 1235,
  },
];

// ============================================
// MAINTENANCE RECORDS
// ============================================

export const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'MNT-001',
    assetId: 'AST-001',
    assetName: 'Laptop Dell Latitude 5520',
    type: 'routine',
    date: '2024-01-20T14:00:00Z',
    notes: 'Service rutin awal tahun: pembersihan internal dan update driver',
    cost: 250000,
    technician: 'Teknisi Internal',
    txId: generateTxId(),
    blockNumber: 520,
  },
  {
    id: 'MNT-002',
    assetId: 'AST-001',
    assetName: 'Laptop Dell Latitude 5520',
    type: 'upgrade',
    date: '2024-03-10T14:00:00Z',
    notes: 'Upgrade RAM dari 8GB ke 16GB dan ganti thermal paste',
    cost: 800000,
    vendor: 'Dell Service Center',
    txId: generateTxId(),
    blockNumber: 1180,
  },
  {
    id: 'MNT-003',
    assetId: 'AST-004',
    assetName: 'Laptop ASUS ZenBook 14',
    type: 'repair',
    date: '2024-03-28T16:00:00Z',
    notes: 'Ganti baterai dan thermal paste',
    cost: 1500000,
    vendor: 'ASUS Service Center',
    txId: generateTxId(),
    blockNumber: 1225,
  },
  {
    id: 'MNT-004',
    assetId: 'AST-008',
    assetName: 'Proyektor Sony VPL-EX455',
    type: 'repair',
    date: '2024-03-25T15:00:00Z',
    notes: 'Ganti lampu proyektor dan pembersihan filter',
    cost: 2500000,
    technician: 'Teknisi Sony',
    txId: generateTxId(),
    blockNumber: 1245,
  },
  {
    id: 'MNT-005',
    assetId: 'AST-010',
    assetName: 'Mobil Toyota Avanza 2023',
    type: 'routine',
    date: '2024-01-10T08:00:00Z',
    notes: 'Service berkala 10.000 km: ganti oli, filter, dan cek rem',
    cost: 850000,
    vendor: 'Toyota Service Center',
    txId: generateTxId(),
    blockNumber: 95,
  },
  {
    id: 'MNT-006',
    assetId: 'AST-015',
    assetName: 'Printer HP LaserJet Pro M404dn',
    type: 'routine',
    date: '2024-02-15T10:00:00Z',
    notes: 'Ganti toner dan pembersihan drum',
    cost: 450000,
    technician: 'Teknisi Internal',
    txId: generateTxId(),
    blockNumber: 140,
  },
];

// ============================================
// ASSET HISTORY (For Timeline View)
// ============================================

export const mockAssetHistory: Record<string, AssetHistoryEvent[]> = {
  'AST-001': [
    {
      id: 'HIS-001-1',
      assetId: 'AST-001',
      eventType: 'create',
      date: '2024-01-15T10:30:00Z',
      description: 'Asset didaftarkan ke sistem blockchain',
      details: {
        acquisitionPrice: 15000000,
        vendor: 'PT. Komputer Jaya',
      },
      txId: generateTxId(),
      blockNumber: 100,
    },
    {
      id: 'HIS-001-2',
      assetId: 'AST-001',
      eventType: 'assign',
      date: '2024-01-20T11:00:00Z',
      description: 'Asset diserahkan ke Budi Santoso (IT Department)',
      details: {
        location: 'Gedung A - Ruang 101',
      },
      txId: generateTxId(),
      blockNumber: 105,
    },
    {
      id: 'HIS-001-3',
      assetId: 'AST-001',
      eventType: 'maintenance',
      date: '2024-01-20T14:00:00Z',
      description: 'Service rutin awal tahun: pembersihan internal dan update driver',
      details: {
        cost: 250000,
        type: 'routine',
      },
      txId: generateTxId(),
      blockNumber: 520,
    },
    {
      id: 'HIS-001-4',
      assetId: 'AST-001',
      eventType: 'transfer',
      date: '2024-02-15T09:00:00Z',
      description: 'Dipinjamkan ke Andi Wijaya untuk project khusus',
      details: {
        fromOwner: 'Budi Santoso',
        toOwner: 'Andi Wijaya',
        borrowDuration: 30,
      },
      txId: generateTxId(),
      blockNumber: 135,
    },
    {
      id: 'HIS-001-5',
      assetId: 'AST-001',
      eventType: 'maintenance',
      date: '2024-03-10T14:00:00Z',
      description: 'Upgrade RAM dari 8GB ke 16GB dan ganti thermal paste',
      details: {
        cost: 800000,
        type: 'upgrade',
      },
      txId: generateTxId(),
      blockNumber: 1180,
    },
    {
      id: 'HIS-001-6',
      assetId: 'AST-001',
      eventType: 'return',
      date: '2024-03-25T10:30:00Z',
      description: 'Dikembalikan oleh Andi Wijaya ke Budi Santoso',
      details: {
        fromOwner: 'Andi Wijaya',
        toOwner: 'Budi Santoso',
        notes: 'Pengembalian setelah project selesai',
      },
      txId: generateTxId(),
      blockNumber: 1250,
    },
  ],
  'AST-005': [
    {
      id: 'HIS-005-1',
      assetId: 'AST-005',
      eventType: 'create',
      date: '2022-06-15T09:00:00Z',
      description: 'Asset didaftarkan ke sistem blockchain',
      details: {
        acquisitionPrice: 8000000,
        vendor: 'PT. Komputer Murah',
      },
      txId: generateTxId(),
      blockNumber: 50,
    },
    {
      id: 'HIS-005-2',
      assetId: 'AST-005',
      eventType: 'assign',
      date: '2022-06-20T10:00:00Z',
      description: 'Asset diserahkan ke Staff Lama',
      details: {
        location: 'Gedung A - Ruang 103',
      },
      txId: generateTxId(),
      blockNumber: 52,
    },
    {
      id: 'HIS-005-3',
      assetId: 'AST-005',
      eventType: 'maintenance',
      date: '2023-08-15T14:00:00Z',
      description: 'Perbaikan: Ganti keyboard dan LCD',
      details: {
        cost: 2000000,
        type: 'repair',
      },
      txId: generateTxId(),
      blockNumber: 65,
    },
    {
      id: 'HIS-005-4',
      assetId: 'AST-005',
      eventType: 'dispose',
      date: '2024-03-01T10:00:00Z',
      description: 'Asset dihapus karena motherboard rusak tidak bisa diperbaiki',
      details: {
        reason: 'damaged_unrepairable',
        approvedBy: 'Admin Sistem',
      },
      txId: generateTxId(),
      blockNumber: 1230,
    },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getTransactionsByAssetId = (assetId: string): BlockchainTransaction[] => {
  return mockTransactions.filter((tx) => tx.assetId === assetId);
};

export const getTransfersByAssetId = (assetId: string): TransferRecord[] => {
  return mockTransfers.filter((tr) => tr.assetId === assetId);
};

export const getMaintenanceByAssetId = (assetId: string): MaintenanceRecord[] => {
  return mockMaintenanceRecords.filter((mr) => mr.assetId === assetId);
};

export const getAssetHistory = (assetId: string): AssetHistoryEvent[] => {
  return mockAssetHistory[assetId] || [];
};

export const getRecentTransactions = (limit: number = 10): BlockchainTransaction[] => {
  return [...mockTransactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const getTotalMaintenanceCost = (assetId: string): number => {
  return mockMaintenanceRecords
    .filter((mr) => mr.assetId === assetId)
    .reduce((sum, mr) => sum + mr.cost, 0);
};
