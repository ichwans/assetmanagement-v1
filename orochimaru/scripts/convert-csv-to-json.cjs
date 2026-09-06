const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '..', 'Asset IT - Aset PC & Laptop Novemver 2025.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const assets = [];
const categories = new Set();
const locations = new Set();

// Map status from Indonesian to English
const statusMap = {
  'Baik': 'active',
  'Cukup Baik': 'active',
  'Rusak': 'disposed',
  'rusak': 'disposed',
  'Mati': 'disposed',
};

// Skip header rows (first 2 lines)
for (let i = 3; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  // Parse CSV with comma handling in quotes
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());

  // Skip if no number (empty row)
  const no = parts[1];
  if (!no || isNaN(parseInt(no))) continue;

  const brand = parts[2] || '';
  const type = parts[3] || '';
  const spec = parts[4] || '';
  const user = parts[5] || '';
  const division = parts[6] || '';
  const department = parts[7] || '';
  const qty = parseInt(parts[8]) || 1;
  const dateOfPurchase = parts[9] || '';
  const status = parts[10] || 'Baik';
  const keterangan = parts[11] || '';

  // Skip if no brand
  if (!brand) continue;

  // Generate asset ID
  const assetId = `AST-IT-${String(no).padStart(4, '0')}`;

  // Generate name
  const name = `${brand} ${type}`.trim() || `PC/Laptop ${no}`;

  // Determine category
  let category = 'laptop'; // Default to laptop as most are laptops
  const nameLower = name.toLowerCase();
  const typeLower = type.toLowerCase();

  // Check if it's a desktop PC
  if (nameLower.includes('desktop') || nameLower.includes('slimline') ||
      nameLower.includes('all in one') || nameLower.includes('veriton') ||
      typeLower.includes('desktop') || typeLower.includes('slimline') ||
      typeLower.includes('h310m') || typeLower.includes('h110m') ||
      brand === 'OEM' && !typeLower.includes('ideapad') && !typeLower.includes('vivobook')) {
    category = 'desktop';
  }
  // Chromebook is a laptop
  else if (nameLower.includes('chromebook') || typeLower.includes('chromebook')) {
    category = 'chromebook';
  }
  // Macbook is a laptop
  else if (nameLower.includes('macbook') || typeLower.includes('macbook')) {
    category = 'laptop';
  }
  categories.add(category);

  // Generate location ID from division + department
  const divSlug = division ? division.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : 'unknown';
  const deptSlug = department ? department.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : divSlug;
  const locationId = `loc-${divSlug}-${deptSlug}`.replace(/-+/g, '-').replace(/-$/, '');

  if (division) {
    locations.add(JSON.stringify({
      id: locationId,
      name: `${division}${department && department !== division ? ' - ' + department : ''}`,
      building: 'Main Building',
      floor: '1',
      room: department || division
    }));
  }

  // Parse date
  let acquisitionDate = '';
  if (dateOfPurchase) {
    if (dateOfPurchase.match(/^\d{4}$/)) {
      acquisitionDate = `${dateOfPurchase}-01-01`;
    } else if (dateOfPurchase.match(/\d+\s+\w+\s+\d{4}/)) {
      // Parse "18 Maret 2025" format
      const months = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
        'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
        'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
      };
      const match = dateOfPurchase.match(/(\d+)\s+(\w+)\s+(\d{4})/i);
      if (match) {
        const day = String(match[1]).padStart(2, '0');
        const month = months[match[2].toLowerCase()] || '01';
        const year = match[3];
        acquisitionDate = `${year}-${month}-${day}`;
      }
    }
  }

  // Map status
  const mappedStatus = statusMap[status] || 'active';

  // Create asset object
  const asset = {
    assetId,
    name,
    category,
    description: `${spec}${keterangan ? ' - ' + keterangan : ''}`.trim(),
    serialNumber: '',
    owner: user ? `user-${user.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}` : '',
    ownerName: user,
    location: locationId,
    locationDetail: department || '',
    status: mappedStatus,
    acquisitionDate: acquisitionDate || '2020-01-01',
    acquisitionPrice: 0,
    vendor: brand,
    invoiceNumber: '',
    createdAt: acquisitionDate ? `${acquisitionDate}T00:00:00Z` : '2020-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  };

  assets.push(asset);
}

// Create categories array
const categoriesArray = [
  { id: 'cat-laptop', name: 'Laptop', slug: 'laptop', description: 'Laptop dan Notebook', icon: 'Laptop' },
  { id: 'cat-desktop', name: 'Desktop PC', slug: 'desktop', description: 'Desktop dan All-in-One PC', icon: 'Monitor' },
  { id: 'cat-chromebook', name: 'Chromebook', slug: 'chromebook', description: 'Chromebook dan Mini PC', icon: 'Laptop' },
];

// Create locations array
const locationsArray = Array.from(locations).map(l => JSON.parse(l));

// Write output files
const outputDir = path.join(__dirname, '..', 'import-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'assets.json'),
  JSON.stringify(assets, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'categories.json'),
  JSON.stringify(categoriesArray, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'locations.json'),
  JSON.stringify(locationsArray, null, 2)
);

console.log(`Converted ${assets.length} assets`);
console.log(`Categories: ${categoriesArray.length}`);
console.log(`Locations: ${locationsArray.length}`);
console.log(`\nFiles saved to: ${outputDir}`);
console.log('- assets.json');
console.log('- categories.json');
console.log('- locations.json');
