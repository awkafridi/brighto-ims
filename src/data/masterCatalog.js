// Master reference data for the lighting & electrical trade — used to
// bulk-seed categories and to power the dropdowns/suggestions on a
// product's technical specifications. This is reference data only, not
// live app entities: nothing here is edited in place, it's just the
// source list that "Import master categories" (BusinessManager) and the
// product spec fields (Inventory) pull from.

// ── Product categories & sub-categories (lighting) ──────────────────────────
export const MASTER_CATEGORIES = [
  { name: 'LED Bulbs', subCategories: ['A Bulb', 'Globe Bulb', 'Candle Bulb', 'Filament Bulb', 'Smart Bulb', 'RGB Bulb', 'Emergency Bulb', 'Rechargeable Bulb', 'High Watt Bulb', 'Corn Bulb', 'Industrial Bulb'] },
  { name: 'Light Bulbs', subCategories: ['Incandescent Bulb', 'Halogen Bulb', 'CFL Bulb', 'HID Bulb', 'Metal Halide Bulb', 'Sodium Bulb', 'Mercury Bulb'] },
  { name: 'Tube Lights', subCategories: ['LED Tube', 'T5 Tube', 'T8 Tube', 'Integrated Batten', 'Slim Batten'] },
  { name: 'Panel Lights', subCategories: ['Round Panel', 'Square Panel', 'Slim Panel', 'Surface Panel', 'Recessed Panel', 'Backlit Panel', 'Smart Panel'] },
  { name: 'Down Lights', subCategories: ['COB Downlight', 'SMD Downlight', 'Fixed Downlight', 'Adjustable Downlight', 'Anti-Glare Downlight'] },
  { name: 'Spot Lights', subCategories: ['COB Spotlight', 'Track Spotlight', 'Surface Spotlight', 'Recessed Spotlight', 'Adjustable Spotlight'] },
  { name: 'Track Lights', subCategories: ['Magnetic Track Light', 'Surface Track', 'Recessed Track', 'Pendant Track', 'Linear Track'] },
  { name: 'Linear Lights', subCategories: ['Suspended Linear', 'Surface Linear', 'Recessed Linear', 'Continuous Linear'] },
  { name: 'Strip Lights', subCategories: ['LED Strip', 'RGB Strip', 'RGBW Strip', 'COB Strip', 'Neon Flex Strip', 'Waterproof Strip'] },
  { name: 'Ceiling Lights', subCategories: ['Flush Mount', 'Surface Ceiling Light', 'Decorative Ceiling Light', 'Crystal Ceiling Light'] },
  { name: 'Wall Lights & Sconces', subCategories: ['Indoor Wall Light', 'Outdoor Wall Light', 'Decorative Sconce', 'Reading Light'] },
  { name: 'Pendant Lights', subCategories: ['Single Pendant', 'Multi Pendant', 'Decorative Pendant', 'Industrial Pendant'] },
  { name: 'Chandeliers', subCategories: ['Crystal Chandelier', 'Modern Chandelier', 'Decorative Chandelier'] },
  { name: 'Desk Lamps', subCategories: ['LED Desk Lamp', 'Study Lamp', 'Foldable Lamp', 'USB Desk Lamp'] },
  { name: 'Table Lamps', subCategories: ['Decorative Lamp', 'Reading Lamp', 'Hotel Lamp'] },
  { name: 'Bedside Lamps', subCategories: ['Touch Lamp', 'Rechargeable Lamp', 'Decorative Lamp'] },
  { name: 'Floor Lamps', subCategories: ['Standing Lamp', 'Reading Lamp', 'Decorative Floor Lamp'] },
  { name: 'Night Lights', subCategories: ['Sensor Night Light', 'Plug-in Night Light', "Children's Night Light"] },
  { name: 'Fairy Lights', subCategories: ['String Lights', 'Curtain Lights', 'Decorative Lights'] },
  { name: 'Decorative Lighting', subCategories: ['Rope Lights', 'Festoon Lights', 'Neon Lights', 'Vintage Lights'] },
  { name: 'Garden Lights', subCategories: ['Spike Lights', 'Bollard Lights', 'Lawn Lights', 'Landscape Lights'] },
  { name: 'Outdoor Lighting', subCategories: ['Gate Lights', 'Wall Lights', 'Pole Lights', 'Path Lights'] },
  { name: 'Street Lights', subCategories: ['LED Street Light', 'Smart Street Light', 'Solar Street Light'] },
  { name: 'Flood Lights', subCategories: ['Slim Flood Light', 'High Power Flood', 'RGB Flood', 'Solar Flood'] },
  { name: 'High Bay Lights', subCategories: ['UFO High Bay', 'Linear High Bay'] },
  { name: 'Canopy Lights', subCategories: ['Petrol Pump Canopy', 'Industrial Canopy'] },
  { name: 'Industrial Lighting', subCategories: ['Explosion Proof Light', 'Vapor Tight Light', 'Warehouse Light'] },
  { name: 'Solar Lighting', subCategories: ['Solar Flood Light', 'Solar Garden Light', 'Solar Wall Light', 'Solar Street Light', 'Solar Lantern'] },
  { name: 'Emergency Lights', subCategories: ['Emergency Lamp', 'Exit Sign', 'Emergency Bulkhead'] },
  { name: 'Rechargeable Lights', subCategories: ['Rechargeable Bulb', 'Rechargeable Lantern', 'Rechargeable Lamp'] },
  { name: 'Flashlights', subCategories: ['LED Torch', 'Tactical Torch', 'Rechargeable Torch'] },
  { name: 'Lanterns & Torches', subCategories: ['Camping Lantern', 'Emergency Lantern', 'Rechargeable Lantern'] },
  { name: 'Insect Killers', subCategories: ['Electric Mosquito Killer', 'UV Insect Killer', 'Bug Zapper'] },
  { name: 'Under Cabinet Lights', subCategories: ['Motion Sensor Light', 'LED Bar Light', 'Strip Light'] },
  { name: 'Mirror Lights', subCategories: ['Vanity Light', 'Bathroom Mirror Light'] },
  { name: 'Bathroom Lights', subCategories: ['IP65 Ceiling Light', 'Mirror Light'] },
  { name: 'Kitchen Lights', subCategories: ['Cabinet Light', 'Under Cabinet Light'] },
  { name: 'Swimming Pool Lights', subCategories: ['Underwater LED Light'] },
  { name: 'Stage & Event Lighting', subCategories: ['PAR Light', 'Moving Head', 'Laser Light'] },
  { name: 'Commercial Lighting', subCategories: ['Office Panel', 'Retail Spotlight', 'Shop Light'] },
  { name: 'Architectural Lighting', subCategories: ['Wall Washer', 'Facade Light', 'Step Light'] },
  { name: 'Smart Lighting', subCategories: ['WiFi Light', 'Zigbee Light', 'Bluetooth Light', 'DALI Light'] },
  { name: 'Automotive LED', subCategories: ['Headlight LED', 'Fog Lamp LED', 'Interior LED'] },
  { name: 'Marine Lighting', subCategories: ['Boat Light', 'Navigation Light'] },
  { name: 'Aviation Lighting', subCategories: ['Beacon Light', 'Obstruction Light'] },
];

// ── Accessory categories & sub-categories ────────────────────────────────────
export const MASTER_ACCESSORY_CATEGORIES = [
  { name: 'LED Drivers', subCategories: ['Constant Current', 'Constant Voltage'] },
  { name: 'Power Supplies', subCategories: ['Indoor PSU', 'Outdoor PSU'] },
  { name: 'Sensors', subCategories: ['Motion Sensor', 'PIR Sensor', 'Daylight Sensor'] },
  { name: 'Dimmers', subCategories: ['Rotary Dimmer', 'Touch Dimmer'] },
  { name: 'Smart Controllers', subCategories: ['WiFi Controller', 'Zigbee Controller', 'Bluetooth Controller'] },
  { name: 'Track Accessories', subCategories: ['Connectors', 'End Caps', 'Joiners'] },
  { name: 'Mounting Accessories', subCategories: ['Clips', 'Brackets', 'Suspension Kits'] },
  { name: 'Electrical Accessories', subCategories: ['Holders', 'Bases', 'Connectors', 'Junction Boxes'] },
  { name: 'Extension Boards', subCategories: ['Power Strip', 'Spike Guard'] },
  { name: 'Switches', subCategories: ['Smart Switch', 'Modular Switch'] },
  { name: 'Plug Tops', subCategories: ['2-Pin', '3-Pin'] },
  { name: 'Cable Accessories', subCategories: ['Cable Clips', 'Cable Glands'] },
];

// ── Where the product is used — for the "Application" spec field ────────────
export const LIGHTING_APPLICATIONS = [
  'Residential', 'Commercial', 'Office', 'Retail Shop', 'Hotel', 'Hospital',
  'School', 'Warehouse', 'Factory', 'Outdoor', 'Garden', 'Street', 'Parking',
  'Petrol Pump', 'Sports Arena', 'Architectural', 'Decorative', 'Emergency', 'Industrial',
];

// ── Manufacturer / OEM brand reference (NOT the app's own Brighto/Hoshi
// business brands — this is who actually made the product, for the
// product-level "Manufacturer / OEM Brand" spec field and PO sourcing). ────
export const MASTER_BRANDS = {
  international: [
    'Philips (Signify)', 'Osram', 'Ledvance', 'GE Lighting', 'Panasonic', 'Toshiba',
    'Samsung LED', 'LG', 'Cree Lighting', 'Nichia', 'Citizen', 'Bridgelux', 'Mean Well',
    'Tridonic', 'Zumtobel', 'Delta Light', 'Opple Lighting', 'Havells', 'Wipro Lighting',
    'Syska LED', 'Crompton', 'Bajaj Electricals', 'Schneider Electric', 'Legrand', 'Eaton', 'ABB',
  ],
  pakistan: [
    'Delta Lite', 'Osaka Lighting', 'Clopal', 'Ultronics Lights', 'Hyundai Power Pakistan',
    'Brighto Lighting', 'Hoshi Lighting', 'PakLite', 'EcoStar Lighting', 'Electroline',
    'Orient Electric', 'Super Asia Lighting', 'Boss Lighting', 'GFC Lighting',
  ],
  chinese: [
    'Midea', 'Opple', 'NVC Lighting', 'FSL Lighting', 'TCL Lighting', 'Kingsun', 'Yankon',
    'MLS Lighting', 'PAK Corporation OEM', 'Generic/OEM',
  ],
};

// Flattened, alphabetized list for a single autocomplete/datalist.
export const ALL_MASTER_BRANDS = [
  ...MASTER_BRANDS.international,
  ...MASTER_BRANDS.pakistan,
  ...MASTER_BRANDS.chinese,
].sort((a, b) => a.localeCompare(b));

// ── Standard technical spec option lists (from the ERP master data tables) ──
export const COLOR_TEMPERATURES = ['2700K', '3000K', '4000K', '5000K', '6500K'];
export const IP_RATINGS = ['IP20', 'IP44', 'IP65', 'IP67'];
export const MOUNTING_TYPES = ['Surface', 'Recessed', 'Pendant', 'Track', 'Wall'];

// Convenience lookup: sub-categories for a given category name, across both
// the lighting and accessory master lists. Returns [] if the category name
// isn't in the master list (e.g. a custom category Wahab typed himself) —
// callers should fall back to a free-text input in that case.
export function getSubCategoriesFor(categoryName) {
  const all = [...MASTER_CATEGORIES, ...MASTER_ACCESSORY_CATEGORIES];
  const match = all.find(c => c.name.toLowerCase() === String(categoryName || '').toLowerCase());
  return match ? match.subCategories : [];
}
