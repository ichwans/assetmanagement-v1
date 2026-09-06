import { Category, Location } from '@/types';

export const mockCategories: Category[] = [
  {
    id: 'CAT-001',
    name: 'Laptop',
    slug: 'laptop',
    description: 'Komputer portabel untuk keperluan kerja',
    icon: 'laptop',
  },
  {
    id: 'CAT-002',
    name: 'Proyektor',
    slug: 'proyektor',
    description: 'Perangkat untuk presentasi dan meeting',
    icon: 'projector',
  },
  {
    id: 'CAT-003',
    name: 'Kendaraan',
    slug: 'kendaraan',
    description: 'Kendaraan operasional (mobil, motor)',
    icon: 'car',
  },
  {
    id: 'CAT-004',
    name: 'Furniture',
    slug: 'furniture',
    description: 'Perabotan kantor (meja, kursi, lemari)',
    icon: 'armchair',
  },
  {
    id: 'CAT-005',
    name: 'Elektronik',
    slug: 'elektronik',
    description: 'Perangkat elektronik (AC, printer, monitor, dll)',
    icon: 'monitor',
  },
  {
    id: 'CAT-006',
    name: 'Lainnya',
    slug: 'lainnya',
    description: 'Kategori untuk asset yang tidak termasuk di atas',
    icon: 'package',
  },
];

export const mockLocations: Location[] = [
  {
    id: 'LOC-001',
    name: 'Gedung A - Ruang 101',
    building: 'Gedung A',
    floor: 'Lantai 1',
    room: 'Ruang 101',
  },
  {
    id: 'LOC-002',
    name: 'Gedung A - Ruang 102',
    building: 'Gedung A',
    floor: 'Lantai 1',
    room: 'Ruang 102',
  },
  {
    id: 'LOC-003',
    name: 'Gedung B - Ruang 201',
    building: 'Gedung B',
    floor: 'Lantai 2',
    room: 'Ruang 201',
  },
  {
    id: 'LOC-004',
    name: 'Gudang IT',
    building: 'Gedung A',
    floor: 'Basement',
    room: 'Gudang IT',
  },
  {
    id: 'LOC-005',
    name: 'Gedung A - Ruang Meeting 1',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'Ruang Meeting 1',
  },
  {
    id: 'LOC-006',
    name: 'Gedung B - Auditorium',
    building: 'Gedung B',
    floor: 'Lantai 1',
    room: 'Auditorium',
  },
  {
    id: 'LOC-007',
    name: 'Parkiran Gedung A',
    building: 'Gedung A',
    floor: 'Ground',
    room: 'Parkiran',
  },
  {
    id: 'LOC-008',
    name: 'Parkiran Gedung B',
    building: 'Gedung B',
    floor: 'Ground',
    room: 'Parkiran',
  },
  {
    id: 'LOC-009',
    name: 'Gedung A - Ruang Direktur',
    building: 'Gedung A',
    floor: 'Lantai 3',
    room: 'Ruang Direktur',
  },
  {
    id: 'LOC-010',
    name: 'Gedung A - Server Room',
    building: 'Gedung A',
    floor: 'Basement',
    room: 'Server Room',
  },
  {
    id: 'LOC-011',
    name: 'Gedung A - Ruang Marketing',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'Ruang Marketing',
  },
  {
    id: 'LOC-012',
    name: 'Gedung B - Gudang Peralatan',
    building: 'Gedung B',
    floor: 'Basement',
    room: 'Gudang Peralatan',
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return mockCategories.find((cat) => cat.slug === slug);
};

export const getLocationById = (id: string): Location | undefined => {
  return mockLocations.find((loc) => loc.id === id);
};

export const getLocationsByBuilding = (building: string): Location[] => {
  return mockLocations.filter((loc) => loc.building === building);
};
