export const brands = [
  { id: 'b1', name: 'Brighto', color: '#4f8ef7' },
  { id: 'b2', name: 'Hoshi', color: '#a78bfa' },
];

export const categories = [
  { id: 'c1',  name: 'LED Bulbs',            icon: '💡' },
  { id: 'c2',  name: 'Panel Lights',          icon: '🔆' },
  { id: 'c3',  name: 'Cables & Wires',        icon: '🔌' },
  { id: 'c4',  name: 'Switches & Sockets',    icon: '🔧' },
  { id: 'c5',  name: 'DB Boxes & Boards',     icon: '📦' },
  { id: 'c6',  name: 'Tube Lights / Battens', icon: '🕯️' },
  { id: 'c7',  name: 'Downlights / Spotlights',icon: '🔦' },
  { id: 'c8',  name: 'Street & Flood Lights', icon: '🌕' },
  { id: 'c9',  name: 'Fans',                  icon: '🌀' },
  { id: 'c10', name: 'MCBs & Breakers',       icon: '⚡' },
  { id: 'c11', name: 'Conduit & Accessories', icon: '🔩' },
  { id: 'c12', name: 'Connectors & Terminals',icon: '🔗' },
  { id: 'c13', name: 'Extension Leads & Boards',icon: '🔌' },
  { id: 'c14', name: 'Sensors & Controllers', icon: '📡' },
  { id: 'c15', name: 'SKD Components',        icon: '⚙️' },
];

export const suppliers = [
  { id: 's1', name: 'Guangzhou Lighting Co.', country: 'China', contact: 'Wei Zhang', phone: '+86-20-8888-1234', totalOwed: 480000, totalPaid: 320000 },
  { id: 's2', name: 'Shenzhen ElecPro', country: 'China', contact: 'Li Ming', phone: '+86-755-9876-5432', totalOwed: 210000, totalPaid: 210000 },
  { id: 's3', name: 'Karachi Wholesale Hub', country: 'Pakistan', contact: 'Tariq Mehmood', phone: '+92-21-3456789', totalOwed: 95000, totalPaid: 80000 },
  { id: 's4', name: 'Yiwu Electric Trading', country: 'China', contact: 'Chen Jing', phone: '+86-579-8765-4321', totalOwed: 320000, totalPaid: 150000 },
  { id: 's5', name: 'Lahore Hardware Mart', country: 'Pakistan', contact: 'Khalid Rehman', phone: '+92-42-1234567', totalOwed: 60000, totalPaid: 60000 },
];

export const products = [
  // ── LED Bulbs (c1) ────────────────────────────────────────────────────────
  { id: 'p1',  name: '3W LED Bulb',      sku: 'BRT-LED-3W',   brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 28,  sellingPrice: 45,   stock: 0, variants: [
    { id: 'v1a', name: 'E27 Base – Warm White', sku: 'BRT-LED-3W-E27-WW', sellingPrice: 45, stock: 0 },
    { id: 'v1b', name: 'E27 Base – Cool White', sku: 'BRT-LED-3W-E27-CW', sellingPrice: 45, stock: 0},
    { id: 'v1c', name: 'B22 Base – Warm White', sku: 'BRT-LED-3W-B22-WW', sellingPrice: 48, stock: 0},
  ]},
  { id: 'p2',  name: '5W LED Bulb',      sku: 'BRT-LED-5W',   brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 35,  sellingPrice: 55,   stock: 0, variants: [
    { id: 'v2a', name: 'E27 – Warm White', sku: 'BRT-LED-5W-WW', sellingPrice: 55, stock: 0 },
    { id: 'v2b', name: 'E27 – Cool White', sku: 'BRT-LED-5W-CW', sellingPrice: 55, stock: 0},
    { id: 'v2c', name: 'B22 – Warm White', sku: 'BRT-LED-5W-B22', sellingPrice: 58, stock: 0},
  ]},
  { id: 'p3',  name: '7W LED Bulb',      sku: 'BRT-LED-7W',   brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 45,  sellingPrice: 70,   stock: 0, variants: [
    { id: 'v3a', name: 'E27 – Warm White', sku: 'BRT-LED-7W-WW', sellingPrice: 70,  stock: 0},
    { id: 'v3b', name: 'E27 – Cool White', sku: 'BRT-LED-7W-CW', sellingPrice: 70,  stock: 0},
    { id: 'v3c', name: 'B22 – Warm White', sku: 'BRT-LED-7W-B22', sellingPrice: 72, stock: 0},
  ]},
  { id: 'p4',  name: '9W LED Bulb',      sku: 'BRT-LED-9W',   brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 55,  sellingPrice: 85,   stock: 0, variants: [
    { id: 'v4a', name: 'E27 – Warm White', sku: 'BRT-LED-9W-WW', sellingPrice: 85, stock: 0 },
    { id: 'v4b', name: 'E27 – Cool White', sku: 'BRT-LED-9W-CW', sellingPrice: 85, stock: 0 },
    { id: 'v4c', name: 'B22 – Daylight',   sku: 'BRT-LED-9W-DL', sellingPrice: 88, stock: 0 },
  ]},
  { id: 'p5',  name: '12W LED Bulb',     sku: 'BRT-LED-12W',  brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 95,  sellingPrice: 150,  stock: 0, variants: [
    { id: 'v5a', name: 'E27 – Warm White 3000K', sku: 'BRT-LED-12W-WW', sellingPrice: 150, stock: 0 },
    { id: 'v5b', name: 'E27 – Cool White 6500K', sku: 'BRT-LED-12W-CW', sellingPrice: 150, stock: 0 },
    { id: 'v5c', name: 'B22 – Warm White',        sku: 'BRT-LED-12W-B22',sellingPrice: 155, stock: 0 },
  ]},
  { id: 'p6',  name: '15W LED Bulb',     sku: 'BRT-LED-15W',  brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 120, sellingPrice: 185,  stock: 0, variants: [] },
  { id: 'p7',  name: '18W LED Bulb',     sku: 'BRT-LED-18W',  brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 145, sellingPrice: 220,  stock: 0, variants: [] },
  { id: 'p8',  name: '7W LED Bulb',      sku: 'HSH-LED-7W',   brandId: 'b2', categoryId: 'c1', unit: 'pcs', avgCost: 65,  sellingPrice: 100,  stock: 0, variants: [
    { id: 'v8a', name: 'E27 – Warm White', sku: 'HSH-LED-7W-WW', sellingPrice: 100, stock: 0 },
    { id: 'v8b', name: 'E27 – Cool White', sku: 'HSH-LED-7W-CW', sellingPrice: 100, stock: 0 },
  ]},
  { id: 'p9',  name: '12W LED Bulb',     sku: 'HSH-LED-12W',  brandId: 'b2', categoryId: 'c1', unit: 'pcs', avgCost: 90,  sellingPrice: 140,  stock: 0, variants: [] },
  { id: 'p10', name: '18W LED Bulb',     sku: 'HSH-LED-18W',  brandId: 'b2', categoryId: 'c1', unit: 'pcs', avgCost: 140, sellingPrice: 210,  stock: 0, variants: [] },

  // ── Panel Lights (c2) ─────────────────────────────────────────────────────
  { id: 'p11', name: '12W Panel Light Round',  sku: 'BRT-PNL-12R', brandId: 'b1', categoryId: 'c2', unit: 'pcs', avgCost: 220, sellingPrice: 350, stock: 0, variants: [
    { id: 'v11a', name: 'Warm White 3000K', sku: 'BRT-PNL-12R-WW', sellingPrice: 350, stock: 0 },
    { id: 'v11b', name: 'Cool White 6500K', sku: 'BRT-PNL-12R-CW', sellingPrice: 350, stock: 0 },
  ]},
  { id: 'p12', name: '18W Panel Light Round',  sku: 'BRT-PNL-18R', brandId: 'b1', categoryId: 'c2', unit: 'pcs', avgCost: 320, sellingPrice: 500, stock: 0, variants: [
    { id: 'v12a', name: 'Warm White', sku: 'BRT-PNL-18R-WW', sellingPrice: 500, stock: 0 },
    { id: 'v12b', name: 'Cool White', sku: 'BRT-PNL-18R-CW', sellingPrice: 500, stock: 0 },
  ]},
  { id: 'p13', name: '24W Panel Light Square', sku: 'BRT-PNL-24S', brandId: 'b1', categoryId: 'c2', unit: 'pcs', avgCost: 420, sellingPrice: 650, stock: 0, variants: [] },
  { id: 'p14', name: '36W Panel Light Square', sku: 'BRT-PNL-36S', brandId: 'b1', categoryId: 'c2', unit: 'pcs', avgCost: 580, sellingPrice: 900, stock: 0, variants: [] },
  { id: 'p15', name: '24W Panel Light',        sku: 'HSH-PNL-24W', brandId: 'b2', categoryId: 'c2', unit: 'pcs', avgCost: 420, sellingPrice: 650, stock: 0, variants: [] },
  { id: 'p16', name: '48W Panel Light',        sku: 'HSH-PNL-48W', brandId: 'b2', categoryId: 'c2', unit: 'pcs', avgCost: 780, sellingPrice: 1200,stock: 0, variants: [] },

  // ── Cables & Wires (c3) ───────────────────────────────────────────────────
  { id: 'p17', name: '1mm Single Core Cable (100m)',  sku: 'CBL-1MM-100',  brandId: 'b1', categoryId: 'c3', unit: 'roll', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p18', name: '1.5mm Single Core Cable (100m)',sku: 'CBL-15MM-100', brandId: 'b1', categoryId: 'c3', unit: 'roll', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p19', name: '2.5mm Single Core Cable (100m)',sku: 'CBL-25MM-100', brandId: 'b1', categoryId: 'c3', unit: 'roll', avgCost: 2800, sellingPrice: 3500, stock: 0, variants: [] },
  { id: 'p20', name: '4mm Single Core Cable (100m)',  sku: 'CBL-4MM-100',  brandId: 'b1', categoryId: 'c3', unit: 'roll', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p21', name: '6mm Single Core Cable (100m)',  sku: 'CBL-6MM-100',  brandId: 'b1', categoryId: 'c3', unit: 'roll', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p22', name: '3-Core Flexible Cable 1.5mm (100m)',sku:'CBL-3C-15',brandId:'b1',categoryId:'c3',unit:'roll',avgCost:0,sellingPrice:0,stock:0},
  { id: 'p23', name: '3-Core Flexible Cable 2.5mm (100m)',sku:'CBL-3C-25',brandId:'b1',categoryId:'c3',unit:'roll',avgCost:0,sellingPrice:0,stock:0},

  // ── Switches & Sockets (c4) ───────────────────────────────────────────────
  { id: 'p24', name: '1-Gang 1-Way Switch',     sku: 'SW-1G1W',   brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p25', name: '1-Gang 2-Way Switch',     sku: 'SW-1G2W',   brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p26', name: '2-Gang Switch',           sku: 'SW-2G',     brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p27', name: '3-Pin Socket 13A',        sku: 'SCK-3P-13A',brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 55, sellingPrice: 90, stock: 0 },
  { id: 'p28', name: '2-Pin Socket 5A',         sku: 'SCK-2P-5A', brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p29', name: 'Dimmer Switch 500W',      sku: 'SW-DIM-500',brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p30', name: 'USB Socket Dual Port',    sku: 'SCK-USB-2', brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── DB Boxes & Boards (c5) ────────────────────────────────────────────────
  { id: 'p31', name: 'DB Box 4-way',      sku: 'DB-4W',  brandId: 'b1', categoryId: 'c5', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p32', name: 'DB Box 8-way',      sku: 'DB-8W',  brandId: 'b1', categoryId: 'c5', unit: 'pcs', avgCost: 650, sellingPrice: 950, stock: 0, variants: [] },
  { id: 'p33', name: 'DB Box 12-way',     sku: 'DB-12W', brandId: 'b1', categoryId: 'c5', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p34', name: 'DB Box 16-way',     sku: 'DB-16W', brandId: 'b1', categoryId: 'c5', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p35', name: 'Fuse Box 6-way',    sku: 'FB-6W',  brandId: 'b1', categoryId: 'c5', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Tube Lights / Battens (c6) ────────────────────────────────────────────
  { id: 'p36', name: '10W LED Batten 1ft',  sku: 'TUB-10W-1FT', brandId: 'b1', categoryId: 'c6', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p37', name: '18W LED Batten 2ft',  sku: 'TUB-18W-2FT', brandId: 'b1', categoryId: 'c6', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p38', name: '20W LED Tube Light',  sku: 'HSH-TUB-20W', brandId: 'b2', categoryId: 'c6', unit: 'pcs', avgCost: 180, sellingPrice: 280, stock: 0, variants: [] },
  { id: 'p39', name: '36W LED Batten 4ft',  sku: 'TUB-36W-4FT', brandId: 'b1', categoryId: 'c6', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p40', name: '40W LED Batten 5ft',  sku: 'TUB-40W-5FT', brandId: 'b2', categoryId: 'c6', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Downlights / Spotlights (c7) ─────────────────────────────────────────
  { id: 'p41', name: '3W LED Spotlight',      sku: 'SPT-3W',  brandId: 'b1', categoryId: 'c7', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p42', name: '5W LED Downlight',      sku: 'DWN-5W',  brandId: 'b1', categoryId: 'c7', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p43', name: '7W LED Downlight',      sku: 'DWN-7W',  brandId: 'b1', categoryId: 'c7', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p44', name: '9W LED Downlight',      sku: 'DWN-9W',  brandId: 'b2', categoryId: 'c7', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p45', name: '12W COB Spotlight',     sku: 'SPT-12W', brandId: 'b1', categoryId: 'c7', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Street & Flood Lights (c8) ────────────────────────────────────────────
  { id: 'p46', name: '30W LED Flood Light',   sku: 'FLD-30W',  brandId: 'b1', categoryId: 'c8', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p47', name: '50W LED Flood Light',   sku: 'FLD-50W',  brandId: 'b1', categoryId: 'c8', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p48', name: '100W LED Flood Light',  sku: 'FLD-100W', brandId: 'b1', categoryId: 'c8', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p49', name: '30W LED Street Light',  sku: 'STR-30W',  brandId: 'b2', categoryId: 'c8', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p50', name: '60W LED Street Light',  sku: 'STR-60W',  brandId: 'b2', categoryId: 'c8', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Fans (c9) ─────────────────────────────────────────────────────────────
  { id: 'p51', name: 'Ceiling Fan 56" (3 Blade)',   sku: 'FAN-CEL-56', brandId: 'b1', categoryId: 'c9', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p52', name: 'Ceiling Fan 48" Economy',     sku: 'FAN-CEL-48', brandId: 'b1', categoryId: 'c9', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p53', name: 'Table Fan 12"',               sku: 'FAN-TBL-12', brandId: 'b1', categoryId: 'c9', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p54', name: 'Exhaust Fan 6"',              sku: 'FAN-EXH-6',  brandId: 'b1', categoryId: 'c9', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── MCBs & Breakers (c10) ─────────────────────────────────────────────────
  { id: 'p55', name: 'MCB 6A Single Pole',     sku: 'MCB-6A-1P',  brandId: 'b1', categoryId: 'c10', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p56', name: 'MCB 10A Single Pole',    sku: 'MCB-10A-1P', brandId: 'b1', categoryId: 'c10', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p57', name: 'MCB 16A Single Pole',    sku: 'MCB-16A-1P', brandId: 'b1', categoryId: 'c10', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p58', name: 'MCB 32A Double Pole',    sku: 'MCB-32A-2P', brandId: 'b1', categoryId: 'c10', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p59', name: 'RCCB 40A 30mA',          sku: 'RCCB-40A',   brandId: 'b1', categoryId: 'c10', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p60', name: 'Main Switch 100A DP',     sku: 'MSW-100A',   brandId: 'b1', categoryId: 'c10', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Conduit & Accessories (c11) ───────────────────────────────────────────
  { id: 'p61', name: 'PVC Conduit 20mm (3m)',   sku: 'CDT-20MM',   brandId: 'b1', categoryId: 'c11', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p62', name: 'PVC Conduit 25mm (3m)',   sku: 'CDT-25MM',   brandId: 'b1', categoryId: 'c11', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p63', name: 'Conduit Elbow 20mm',      sku: 'CDT-ELB-20', brandId: 'b1', categoryId: 'c11', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p64', name: 'Conduit Junction Box',    sku: 'CDT-JB',     brandId: 'b1', categoryId: 'c11', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p65', name: 'Cable Trunking 40x25mm (2m)',sku:'TRK-4025', brandId: 'b1', categoryId: 'c11', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Connectors & Terminals (c12) ──────────────────────────────────────────
  { id: 'p66', name: 'Choc Block Connector 4A (12-way)', sku: 'CON-4A',    brandId: 'b1', categoryId: 'c12', unit: 'strip', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p67', name: 'Choc Block Connector 15A (12-way)',sku: 'CON-15A',   brandId: 'b1', categoryId: 'c12', unit: 'strip', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p68', name: 'Wago 2-Pin Connector (100pcs)',    sku: 'WAG-2P',    brandId: 'b1', categoryId: 'c12', unit: 'bag',   avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p69', name: 'Wago 5-Pin Connector (50pcs)',     sku: 'WAG-5P',    brandId: 'b1', categoryId: 'c12', unit: 'bag',   avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p70', name: 'Terminal Block 10A Rail Mount',    sku: 'TERM-10A',  brandId: 'b1', categoryId: 'c12', unit: 'pcs',   avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Extension Leads & Boards (c13) ────────────────────────────────────────
  { id: 'p71', name: 'Extension Lead 4-Socket 3m',  sku: 'EXT-4S-3M',  brandId: 'b1', categoryId: 'c13', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p72', name: 'Extension Lead 4-Socket 5m',  sku: 'EXT-4S-5M',  brandId: 'b1', categoryId: 'c13', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p73', name: 'Multi-plug 3 Socket Adapter',  sku: 'ADPT-3S',    brandId: 'b1', categoryId: 'c13', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p74', name: 'Extension Board 6-Socket USB', sku: 'EXT-6S-USB', brandId: 'b1', categoryId: 'c13', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── Sensors & Controllers (c14) ───────────────────────────────────────────
  { id: 'p75', name: 'PIR Motion Sensor 180°',       sku: 'PIR-180',  brandId: 'b1', categoryId: 'c14', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p76', name: 'Photocell Day/Night Sensor',   sku: 'PHC-AUTO', brandId: 'b1', categoryId: 'c14', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p77', name: 'Microwave Motion Sensor',      sku: 'MWS-360',  brandId: 'b2', categoryId: 'c14', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p78', name: 'LED Dimmer Controller 12V',    sku: 'DIM-12V',  brandId: 'b1', categoryId: 'c14', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p79', name: 'Timer Switch 24hr',            sku: 'TMR-24H',  brandId: 'b1', categoryId: 'c14', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },

  // ── SKD Components (c15) ──────────────────────────────────────────────────
  { id: 'p80', name: 'LED Bulb Body Housing (E27)',  sku: 'SKD-BODY-E27',  brandId: 'b1', categoryId: 'c15', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p81', name: 'LED Driver Circuit 12W',       sku: 'SKD-DRV-12W',   brandId: 'b1', categoryId: 'c15', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p82', name: 'LED Chip 2835 SMD (strip 50pcs)',sku:'SKD-CHIP-2835', brandId: 'b1', categoryId: 'c15', unit: 'strip',avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p83', name: 'LED Driver Circuit 18W',       sku: 'SKD-DRV-18W',   brandId: 'b1', categoryId: 'c15', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p84', name: 'Panel Light Frame 18W Round',  sku: 'SKD-FRM-18R',   brandId: 'b1', categoryId: 'c15', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
  { id: 'p85', name: 'E27 Lamp Holder / Cap',        sku: 'SKD-E27-CAP',   brandId: 'b1', categoryId: 'c15', unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: [] },
];

export const batches = [
  { id: 'bt1', productId: 'p5',  supplierId: 's1', date: '2025-04-15', unitCost: 88,  qtyReceived: 0, qtyRemaining: 0 },
  { id: 'bt2', productId: 'p5',  supplierId: 's1', date: '2025-05-01', unitCost: 95,  qtyReceived: 0, qtyRemaining: 0 },
  { id: 'bt3', productId: 'p12', supplierId: 's2', date: '2025-04-20', unitCost: 315, qtyReceived: 0, qtyRemaining: 0 },
  { id: 'bt4', productId: 'p8',  supplierId: 's1', date: '2025-05-08', unitCost: 65,  qtyReceived: 0, qtyRemaining: 0 },
  { id: 'bt5', productId: 'p19', supplierId: 's3', date: '2025-04-10', unitCost: 2750,qtyReceived: 0, qtyRemaining: 0 },
];

export const shopkeepers = [
  { id: 'sk1', shopName: 'Madina Electric Store',  owner: 'Zafar Ahmed',    address: 'Shop 12, Bolton Market, Karachi',  phone: '+92-300-1234567', balance: 84000 },
  { id: 'sk2', shopName: 'Noor Hardware',           owner: 'Imran Khan',     address: 'Saddar, Karachi',                  phone: '+92-333-9876543', balance: 52500 },
  { id: 'sk3', shopName: 'Al-Aziz Lights',          owner: 'Saleem Baig',    address: 'Orangi Town, Karachi',             phone: '+92-321-5555555', balance: 31000 },
  { id: 'sk4', shopName: 'Pak Electric Centre',     owner: 'Raza Hussain',   address: 'Clifton, Karachi',                 phone: '+92-311-2223344', balance: 18500 },
  { id: 'sk5', shopName: 'Star Lights & More',      owner: 'Bilal Nawaz',    address: 'North Nazimabad, Karachi',         phone: '+92-345-6677889', balance: 0     },
  { id: 'sk6', shopName: 'Hassan Electrical',       owner: 'Hassan Ali',     address: 'Korangi, Karachi',                 phone: '+92-312-1010101', balance: 67000 },
  { id: 'sk7', shopName: 'Rehman Electric Works',   owner: 'Abdul Rehman',   address: 'Liaquatabad, Karachi',             phone: '+92-300-9988776', balance: 23000 },
  { id: 'sk8', shopName: 'City Light House',        owner: 'Nasir Mehmood',  address: 'M.A Jinnah Road, Karachi',         phone: '+92-321-1122334', balance: 45000 },
];

export const invoices = [
  { id: 'inv1', shopkeeperId: 'sk1', brandId: 'b1', date: '2025-05-20', total: 42000, status: 'unpaid',  items: [{ productId: 'p5', qty: 200, unitPrice: 150 }, { productId: 'p27', qty: 80, unitPrice: 90 }] },
  { id: 'inv2', shopkeeperId: 'sk2', brandId: 'b1', date: '2025-05-18', total: 35000, status: 'partial', items: [{ productId: 'p12', qty: 50, unitPrice: 500 }, { productId: 'p5', qty: 100, unitPrice: 150 }] },
  { id: 'inv3', shopkeeperId: 'sk3', brandId: 'b2', date: '2025-05-22', total: 31000, status: 'unpaid',  items: [{ productId: 'p8', qty: 200, unitPrice: 100 }, { productId: 'p15', qty: 30, unitPrice: 650 }] },
  { id: 'inv4', shopkeeperId: 'sk4', brandId: 'b1', date: '2025-05-25', total: 18500, status: 'unpaid',  items: [{ productId: 'p32', qty: 10, unitPrice: 950 }, { productId: 'p19', qty: 3, unitPrice: 3500 }] },
  { id: 'inv5', shopkeeperId: 'sk1', brandId: 'b1', date: '2025-04-10', total: 58000, status: 'paid',    items: [{ productId: 'p12', qty: 80, unitPrice: 500 }, { productId: 'p5', qty: 300, unitPrice: 150 }] },
  { id: 'inv6', shopkeeperId: 'sk6', brandId: 'b2', date: '2025-05-15', total: 67000, status: 'unpaid',  items: [{ productId: 'p38', qty: 200, unitPrice: 250 }, { productId: 'p15', qty: 60, unitPrice: 650 }] },
];

export const ledgerEntries = [
  { id: 'l1', shopkeeperId: 'sk1', invoiceId: 'inv5', date: '2025-04-10', type: 'invoice', debit: 58000, credit: 0,     balance: 58000 },
  { id: 'l2', shopkeeperId: 'sk1', invoiceId: null,   date: '2025-04-25', type: 'payment', debit: 0,     credit: 58000, balance: 0     },
  { id: 'l3', shopkeeperId: 'sk1', invoiceId: 'inv1', date: '2025-05-20', type: 'invoice', debit: 42000, credit: 0,     balance: 42000 },
  { id: 'l4', shopkeeperId: 'sk2', invoiceId: 'inv2', date: '2025-05-18', type: 'invoice', debit: 35000, credit: 0,     balance: 35000 },
  { id: 'l5', shopkeeperId: 'sk2', invoiceId: null,   date: '2025-05-22', type: 'payment', debit: 0,     credit: 12500, balance: 22500 },
  { id: 'l6', shopkeeperId: 'sk3', invoiceId: 'inv3', date: '2025-05-22', type: 'invoice', debit: 31000, credit: 0,     balance: 31000 },
  { id: 'l7', shopkeeperId: 'sk4', invoiceId: 'inv4', date: '2025-05-25', type: 'invoice', debit: 18500, credit: 0,     balance: 18500 },
  { id: 'l8', shopkeeperId: 'sk6', invoiceId: 'inv6', date: '2025-05-15', type: 'invoice', debit: 67000, credit: 0,     balance: 67000 },
];

export const expenses = [
  { id: 'e1', brandId: 'b1', category: 'Rent',     amount: 45000, date: '2025-05-01', notes: 'Monthly warehouse rent'        },
  { id: 'e2', brandId: 'b1', category: 'Salary',   amount: 80000, date: '2025-05-01', notes: 'Staff salaries'                },
  { id: 'e3', brandId: 'b1', category: 'Shipping', amount: 32000, date: '2025-05-10', notes: 'Guangzhou shipment freight'    },
  { id: 'e4', brandId: 'b2', category: 'Salary',   amount: 40000, date: '2025-05-01', notes: 'Staff salaries Hoshi'          },
  { id: 'e5', brandId: 'b1', category: 'Utilities',amount: 12000, date: '2025-05-15', notes: 'Electricity & internet'        },
];

export const monthlySales = [
  { month: 'Jan', brighto: 280000, hoshi: 120000 },
  { month: 'Feb', brighto: 320000, hoshi: 145000 },
  { month: 'Mar', brighto: 290000, hoshi: 160000 },
  { month: 'Apr', brighto: 410000, hoshi: 190000 },
  { month: 'May', brighto: 380000, hoshi: 210000 },
  { month: 'Jun', brighto: 450000, hoshi: 230000 },
];
