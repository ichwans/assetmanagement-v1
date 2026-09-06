import { Asset, AssetStatus, AssetCategory } from '@/types';
import { mockUsers } from './users';
import { mockLocations } from './categories';

// Helper to generate mock transaction ID
const generateTxId = () => {
  const chars = '0123456789abcdef';
  let txId = '';
  for (let i = 0; i < 64; i++) {
    txId += chars[Math.floor(Math.random() * chars.length)];
  }
  return txId;
};

export const mockAssets: Asset[] = [
  // LAPTOPS
  {
    assetId: 'AST-001',
    name: 'Laptop Dell Latitude 5520',
    category: 'laptop',
    description: 'Laptop untuk keperluan kantor dengan spesifikasi Intel Core i5, 16GB RAM, 512GB SSD',
    serialNumber: 'DELL-SN-001234',
    owner: 'USR-002',
    ownerName: 'Budi Santoso',
    location: 'LOC-001',
    locationDetail: 'Gedung A - Ruang 101',
    status: 'active',
    acquisitionDate: '2024-01-15',
    acquisitionPrice: 15000000,
    vendor: 'PT. Komputer Jaya',
    invoiceNumber: 'INV-2024-001',
    txId: generateTxId(),
    blockNumber: 100,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-20T14:15:00Z',
  },
  {
    assetId: 'AST-002',
    name: 'Laptop HP EliteBook 840 G8',
    category: 'laptop',
    description: 'Laptop dengan Intel Core i7, 16GB RAM, 512GB SSD',
    serialNumber: 'HP-SN-005678',
    owner: 'USR-003',
    ownerName: 'Andi Wijaya',
    location: 'LOC-002',
    locationDetail: 'Gedung A - Ruang 102',
    status: 'borrowed',
    acquisitionDate: '2024-01-20',
    acquisitionPrice: 18000000,
    vendor: 'PT. Komputer Jaya',
    invoiceNumber: 'INV-2024-002',
    txId: generateTxId(),
    blockNumber: 105,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-03-25T11:00:00Z',
  },
  {
    assetId: 'AST-003',
    name: 'Laptop Lenovo ThinkPad X1 Carbon',
    category: 'laptop',
    description: 'Ultrabook premium dengan Intel Core i7, 32GB RAM, 1TB SSD',
    serialNumber: 'LNV-SN-009012',
    owner: 'USR-004',
    ownerName: 'Citra Dewi',
    location: 'LOC-003',
    locationDetail: 'Gedung B - Ruang 201',
    status: 'active',
    acquisitionDate: '2024-02-01',
    acquisitionPrice: 25000000,
    vendor: 'PT. Teknologi Maju',
    invoiceNumber: 'INV-2024-010',
    txId: generateTxId(),
    blockNumber: 120,
    createdAt: '2024-02-01T08:30:00Z',
    updatedAt: '2024-02-01T08:30:00Z',
  },
  {
    assetId: 'AST-004',
    name: 'Laptop ASUS ZenBook 14',
    category: 'laptop',
    description: 'Laptop ringan dengan AMD Ryzen 7, 16GB RAM, 512GB SSD',
    serialNumber: 'ASUS-SN-003456',
    owner: 'USR-001',
    ownerName: 'Admin Sistem',
    location: 'LOC-004',
    locationDetail: 'Gudang IT',
    status: 'maintenance',
    acquisitionDate: '2024-02-10',
    acquisitionPrice: 14000000,
    vendor: 'PT. Komputer Jaya',
    invoiceNumber: 'INV-2024-015',
    txId: generateTxId(),
    blockNumber: 130,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-03-28T16:00:00Z',
  },
  {
    assetId: 'AST-005',
    name: 'Laptop Acer Aspire 5',
    category: 'laptop',
    description: 'Laptop entry-level Intel Core i5, 8GB RAM, 256GB SSD',
    serialNumber: 'ACER-SN-007890',
    owner: 'USR-001',
    ownerName: 'Admin Sistem',
    location: 'LOC-004',
    locationDetail: 'Gudang IT',
    status: 'disposed',
    acquisitionDate: '2022-06-15',
    acquisitionPrice: 8000000,
    vendor: 'PT. Komputer Murah',
    invoiceNumber: 'INV-2022-050',
    txId: generateTxId(),
    blockNumber: 50,
    createdAt: '2022-06-15T09:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },

  // PROYEKTOR
  {
    assetId: 'AST-006',
    name: 'Proyektor Epson EB-X51',
    category: 'proyektor',
    description: 'Proyektor 3800 lumens, XGA resolution, HDMI input',
    serialNumber: 'EPS-SN-001122',
    owner: 'USR-005',
    ownerName: 'Deni Pratama',
    location: 'LOC-005',
    locationDetail: 'Gedung A - Ruang Meeting 1',
    status: 'active',
    acquisitionDate: '2024-01-25',
    acquisitionPrice: 7500000,
    vendor: 'PT. Audio Visual Indonesia',
    invoiceNumber: 'INV-2024-005',
    txId: generateTxId(),
    blockNumber: 110,
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-01-25T11:00:00Z',
  },
  {
    assetId: 'AST-007',
    name: 'Proyektor BenQ MH733',
    category: 'proyektor',
    description: 'Proyektor Full HD 4000 lumens dengan wireless projection',
    serialNumber: 'BNQ-SN-003344',
    owner: 'USR-006',
    ownerName: 'Eva Susanti',
    location: 'LOC-006',
    locationDetail: 'Gedung B - Auditorium',
    status: 'borrowed',
    acquisitionDate: '2024-02-05',
    acquisitionPrice: 12000000,
    vendor: 'PT. Audio Visual Indonesia',
    invoiceNumber: 'INV-2024-012',
    txId: generateTxId(),
    blockNumber: 125,
    createdAt: '2024-02-05T14:00:00Z',
    updatedAt: '2024-03-20T09:00:00Z',
  },
  {
    assetId: 'AST-008',
    name: 'Proyektor Sony VPL-EX455',
    category: 'proyektor',
    description: 'Proyektor 3600 lumens dengan fitur presentasi jaringan',
    serialNumber: 'SNY-SN-005566',
    owner: 'USR-001',
    ownerName: 'Admin Sistem',
    location: 'LOC-005',
    locationDetail: 'Gedung A - Ruang Meeting 1',
    status: 'maintenance',
    acquisitionDate: '2023-06-10',
    acquisitionPrice: 9000000,
    vendor: 'PT. Elektronik Sentral',
    invoiceNumber: 'INV-2023-045',
    txId: generateTxId(),
    blockNumber: 45,
    createdAt: '2023-06-10T10:00:00Z',
    updatedAt: '2024-03-25T15:00:00Z',
  },

  // KENDARAAN
  {
    assetId: 'AST-009',
    name: 'Motor Honda Vario 160',
    category: 'kendaraan',
    description: 'Motor matic untuk keperluan operasional kantor',
    serialNumber: 'B-1234-XYZ',
    owner: 'USR-002',
    ownerName: 'Budi Santoso',
    location: 'LOC-007',
    locationDetail: 'Parkiran Gedung A',
    status: 'active',
    acquisitionDate: '2024-02-15',
    acquisitionPrice: 28000000,
    vendor: 'Honda Dealer Resmi',
    invoiceNumber: 'INV-2024-020',
    txId: generateTxId(),
    blockNumber: 140,
    createdAt: '2024-02-15T13:00:00Z',
    updatedAt: '2024-02-15T13:00:00Z',
  },
  {
    assetId: 'AST-010',
    name: 'Mobil Toyota Avanza 2023',
    category: 'kendaraan',
    description: 'Mobil operasional untuk antar-jemput tamu dan keperluan dinas',
    serialNumber: 'B-5678-ABC',
    owner: 'USR-006',
    ownerName: 'Eva Susanti',
    location: 'LOC-008',
    locationDetail: 'Parkiran Gedung B',
    status: 'active',
    acquisitionDate: '2023-12-01',
    acquisitionPrice: 250000000,
    vendor: 'Toyota Dealer Resmi',
    invoiceNumber: 'INV-2023-100',
    txId: generateTxId(),
    blockNumber: 80,
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  {
    assetId: 'AST-011',
    name: 'Motor Yamaha NMAX 155',
    category: 'kendaraan',
    description: 'Motor matic premium untuk keperluan kurir dokumen',
    serialNumber: 'B-9012-DEF',
    owner: 'USR-005',
    ownerName: 'Deni Pratama',
    location: 'LOC-007',
    locationDetail: 'Parkiran Gedung A',
    status: 'borrowed',
    acquisitionDate: '2024-01-10',
    acquisitionPrice: 32000000,
    vendor: 'Yamaha Dealer Resmi',
    invoiceNumber: 'INV-2024-003',
    txId: generateTxId(),
    blockNumber: 95,
    createdAt: '2024-01-10T11:00:00Z',
    updatedAt: '2024-03-15T14:00:00Z',
  },

  // FURNITURE
  {
    assetId: 'AST-012',
    name: 'Meja Kerja Executive',
    category: 'furniture',
    description: 'Meja kerja kayu jati ukuran 160x80cm dengan laci',
    serialNumber: 'FRN-001',
    owner: 'USR-007',
    ownerName: 'Fajar Hidayat',
    location: 'LOC-009',
    locationDetail: 'Gedung A - Ruang Direktur',
    status: 'active',
    acquisitionDate: '2024-01-05',
    acquisitionPrice: 5000000,
    vendor: 'CV. Mebel Indah',
    invoiceNumber: 'INV-2024-001-F',
    txId: generateTxId(),
    blockNumber: 90,
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-05T08:00:00Z',
  },
  {
    assetId: 'AST-013',
    name: 'Kursi Ergonomis Herman Miller',
    category: 'furniture',
    description: 'Kursi kantor ergonomis dengan adjustable armrest dan lumbar support',
    serialNumber: 'FRN-002',
    owner: 'USR-007',
    ownerName: 'Fajar Hidayat',
    location: 'LOC-009',
    locationDetail: 'Gedung A - Ruang Direktur',
    status: 'active',
    acquisitionDate: '2024-01-05',
    acquisitionPrice: 18000000,
    vendor: 'PT. Office Solutions',
    invoiceNumber: 'INV-2024-002-F',
    txId: generateTxId(),
    blockNumber: 91,
    createdAt: '2024-01-05T08:30:00Z',
    updatedAt: '2024-01-05T08:30:00Z',
  },

  // ELEKTRONIK
  {
    assetId: 'AST-014',
    name: 'AC Daikin 2 PK Inverter',
    category: 'elektronik',
    description: 'Air Conditioner hemat energi untuk ruangan 20-30m2',
    serialNumber: 'AC-DKN-001',
    owner: 'USR-001',
    ownerName: 'Admin Sistem',
    location: 'LOC-001',
    locationDetail: 'Gedung A - Ruang 101',
    status: 'active',
    acquisitionDate: '2024-02-20',
    acquisitionPrice: 12000000,
    vendor: 'CV. Sejuk Selalu',
    invoiceNumber: 'INV-2024-025',
    txId: generateTxId(),
    blockNumber: 145,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  {
    assetId: 'AST-015',
    name: 'Printer HP LaserJet Pro M404dn',
    category: 'elektronik',
    description: 'Printer laser monochrome dengan duplex printing dan ethernet',
    serialNumber: 'HP-PRT-001',
    owner: 'USR-002',
    ownerName: 'Budi Santoso',
    location: 'LOC-001',
    locationDetail: 'Gedung A - Ruang 101',
    status: 'active',
    acquisitionDate: '2024-01-18',
    acquisitionPrice: 5500000,
    vendor: 'PT. Komputer Jaya',
    invoiceNumber: 'INV-2024-004',
    txId: generateTxId(),
    blockNumber: 108,
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T09:00:00Z',
  },
  {
    assetId: 'AST-016',
    name: 'Monitor LG 27" 4K',
    category: 'elektronik',
    description: 'Monitor 27 inch 4K UHD dengan USB-C connectivity',
    serialNumber: 'LG-MON-001',
    owner: 'USR-003',
    ownerName: 'Andi Wijaya',
    location: 'LOC-002',
    locationDetail: 'Gedung A - Ruang 102',
    status: 'active',
    acquisitionDate: '2024-02-25',
    acquisitionPrice: 6500000,
    vendor: 'PT. Elektronik Sentral',
    invoiceNumber: 'INV-2024-028',
    txId: generateTxId(),
    blockNumber: 150,
    createdAt: '2024-02-25T11:00:00Z',
    updatedAt: '2024-02-25T11:00:00Z',
  },
  {
    assetId: 'AST-017',
    name: 'UPS APC 1500VA',
    category: 'elektronik',
    description: 'Uninterruptible Power Supply untuk backup server',
    serialNumber: 'APC-UPS-001',
    owner: 'USR-001',
    ownerName: 'Admin Sistem',
    location: 'LOC-010',
    locationDetail: 'Gedung A - Server Room',
    status: 'active',
    acquisitionDate: '2024-01-22',
    acquisitionPrice: 4500000,
    vendor: 'PT. Power Solutions',
    invoiceNumber: 'INV-2024-006',
    txId: generateTxId(),
    blockNumber: 112,
    createdAt: '2024-01-22T14:00:00Z',
    updatedAt: '2024-01-22T14:00:00Z',
  },

  // LAINNYA
  {
    assetId: 'AST-018',
    name: 'Kamera DSLR Canon EOS 90D',
    category: 'lainnya',
    description: 'Kamera DSLR untuk dokumentasi kegiatan organisasi',
    serialNumber: 'CAN-CAM-001',
    owner: 'USR-005',
    ownerName: 'Deni Pratama',
    location: 'LOC-011',
    locationDetail: 'Gedung A - Ruang Marketing',
    status: 'active',
    acquisitionDate: '2024-02-28',
    acquisitionPrice: 22000000,
    vendor: 'PT. Foto Teknik',
    invoiceNumber: 'INV-2024-030',
    txId: generateTxId(),
    blockNumber: 155,
    createdAt: '2024-02-28T09:00:00Z',
    updatedAt: '2024-02-28T09:00:00Z',
  },
  {
    assetId: 'AST-019',
    name: 'Drone DJI Mavic 3',
    category: 'lainnya',
    description: 'Drone untuk aerial photography dan videography',
    serialNumber: 'DJI-DRN-001',
    owner: 'USR-005',
    ownerName: 'Deni Pratama',
    location: 'LOC-011',
    locationDetail: 'Gedung A - Ruang Marketing',
    status: 'borrowed',
    acquisitionDate: '2024-03-01',
    acquisitionPrice: 35000000,
    vendor: 'PT. Aerial Tech',
    invoiceNumber: 'INV-2024-035',
    txId: generateTxId(),
    blockNumber: 160,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-28T08:00:00Z',
  },
  {
    assetId: 'AST-020',
    name: 'Sound System Portable JBL EON715',
    category: 'lainnya',
    description: 'Speaker portable 1300W untuk kegiatan outdoor',
    serialNumber: 'JBL-SND-001',
    owner: 'USR-006',
    ownerName: 'Eva Susanti',
    location: 'LOC-012',
    locationDetail: 'Gedung B - Gudang Peralatan',
    status: 'active',
    acquisitionDate: '2024-03-05',
    acquisitionPrice: 15000000,
    vendor: 'PT. Audio Visual Indonesia',
    invoiceNumber: 'INV-2024-040',
    txId: generateTxId(),
    blockNumber: 165,
    createdAt: '2024-03-05T11:00:00Z',
    updatedAt: '2024-03-05T11:00:00Z',
  },
];

// Helper functions
export const getAssetById = (assetId: string): Asset | undefined => {
  return mockAssets.find((asset) => asset.assetId === assetId);
};

export const getAssetsByOwner = (ownerId: string): Asset[] => {
  return mockAssets.filter((asset) => asset.owner === ownerId);
};

export const getAssetsByStatus = (status: AssetStatus): Asset[] => {
  return mockAssets.filter((asset) => asset.status === status);
};

export const getAssetsByCategory = (category: AssetCategory): Asset[] => {
  return mockAssets.filter((asset) => asset.category === category);
};

export const getActiveAssets = (): Asset[] => {
  return mockAssets.filter((asset) => asset.status !== 'disposed');
};

export const searchAssets = (query: string): Asset[] => {
  const lowerQuery = query.toLowerCase();
  return mockAssets.filter(
    (asset) =>
      asset.assetId.toLowerCase().includes(lowerQuery) ||
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.ownerName.toLowerCase().includes(lowerQuery) ||
      asset.category.toLowerCase().includes(lowerQuery)
  );
};

// Stats calculation
export const calculateStats = () => {
  const total = mockAssets.length;
  const active = mockAssets.filter((a) => a.status === 'active').length;
  const borrowed = mockAssets.filter((a) => a.status === 'borrowed').length;
  const maintenance = mockAssets.filter((a) => a.status === 'maintenance').length;
  const disposed = mockAssets.filter((a) => a.status === 'disposed').length;
  const totalValue = mockAssets
    .filter((a) => a.status !== 'disposed')
    .reduce((sum, a) => sum + a.acquisitionPrice, 0);

  return {
    totalAssets: total,
    activeAssets: active,
    borrowedAssets: borrowed,
    maintenanceAssets: maintenance,
    disposedAssets: disposed,
    totalValue,
  };
};

// Update helpers (mock)
export const updateAssetStatus = (assetId: string, status: AssetStatus): Asset | undefined => {
  const a = mockAssets.find((x) => x.assetId === assetId);
  if (a) {
    a.status = status;
    a.updatedAt = new Date().toISOString();
  }
  return a;
};

export const updateAssetOwnerAndLocation = (assetId: string, ownerId: string, locationId: string): Asset | undefined => {
  const a = mockAssets.find((x) => x.assetId === assetId);
  if (!a) return undefined;
  const user = mockUsers.find((u) => u.id === ownerId);
  const loc = mockLocations.find((l) => l.id === locationId);
  if (user) {
    a.owner = user.id;
    a.ownerName = user.name;
  }
  if (loc) {
    a.location = loc.id;
    a.locationDetail = loc.name;
  }
  a.updatedAt = new Date().toISOString();
  return a;
};
