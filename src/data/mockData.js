export const brands = [
  { id: 'b1', name: 'Brighto', color: '#4f8ef7' },
  { id: 'b2', name: 'Hoshi', color: '#a78bfa' },
];

export const categories = [
  { id: 'c1', name: 'LED Bulbs', icon: '💡' },
  { id: 'c2', name: 'Panel Lights', icon: '🔆' },
  { id: 'c3', name: 'Cables & Wires', icon: '🔌' },
  { id: 'c4', name: 'Switches & Sockets', icon: '🔧' },
  { id: 'c5', name: 'DB Boxes', icon: '📦' },
  { id: 'c6', name: 'Tube Lights', icon: '💡' },
];

export const suppliers = [
  { id: 's1', name: 'Guangzhou Lighting Co.', country: 'China', contact: 'Wei Zhang', phone: '+86-20-8888-1234', totalOwed: 480000, totalPaid: 320000 },
  { id: 's2', name: 'Shenzhen ElecPro', country: 'China', contact: 'Li Ming', phone: '+86-755-9876-5432', totalOwed: 210000, totalPaid: 210000 },
  { id: 's3', name: 'Karachi Wholesale Hub', country: 'Pakistan', contact: 'Tariq Mehmood', phone: '+92-21-3456789', totalOwed: 95000, totalPaid: 80000 },
];

export const products = [
  { id: 'p1', name: '12W LED Bulb', sku: 'BRT-LED-12W', brandId: 'b1', categoryId: 'c1', unit: 'pcs', avgCost: 95, sellingPrice: 150, stock: 840 },
  { id: 'p2', name: '18W Panel Light', sku: 'BRT-PNL-18W', brandId: 'b1', categoryId: 'c2', unit: 'pcs', avgCost: 320, sellingPrice: 500, stock: 215 },
  { id: 'p3', name: '7W LED Bulb', sku: 'HSH-LED-7W', brandId: 'b2', categoryId: 'c1', unit: 'pcs', avgCost: 65, sellingPrice: 100, stock: 1200 },
  { id: 'p4', name: '3-Pin Socket', sku: 'BRT-SCK-3P', brandId: 'b1', categoryId: 'c4', unit: 'pcs', avgCost: 55, sellingPrice: 90, stock: 430 },
  { id: 'p5', name: '2.5mm Cable (100m)', sku: 'BRT-CBL-25', brandId: 'b1', categoryId: 'c3', unit: 'roll', avgCost: 2800, sellingPrice: 3500, stock: 48 },
  { id: 'p6', name: '24W Panel Light', sku: 'HSH-PNL-24W', brandId: 'b2', categoryId: 'c2', unit: 'pcs', avgCost: 420, sellingPrice: 650, stock: 180 },
  { id: 'p7', name: 'DB Box 8-way', sku: 'BRT-DB-8W', brandId: 'b1', categoryId: 'c5', unit: 'pcs', avgCost: 650, sellingPrice: 950, stock: 75 },
  { id: 'p8', name: '20W Tube Light', sku: 'HSH-TUB-20W', brandId: 'b2', categoryId: 'c6', unit: 'pcs', avgCost: 180, sellingPrice: 280, stock: 320 },
];

export const batches = [
  { id: 'bt1', productId: 'p1', supplierId: 's1', date: '2025-04-15', unitCost: 88, qtyReceived: 500, qtyRemaining: 240 },
  { id: 'bt2', productId: 'p1', supplierId: 's1', date: '2025-05-01', unitCost: 95, qtyReceived: 600, qtyRemaining: 600 },
  { id: 'bt3', productId: 'p2', supplierId: 's2', date: '2025-04-20', unitCost: 315, qtyReceived: 300, qtyRemaining: 215 },
  { id: 'bt4', productId: 'p3', supplierId: 's1', date: '2025-05-08', unitCost: 65, qtyReceived: 1200, qtyRemaining: 1200 },
  { id: 'bt5', productId: 'p5', supplierId: 's3', date: '2025-04-10', unitCost: 2750, qtyReceived: 60, qtyRemaining: 48 },
];

export const shopkeepers = [
  { id: 'sk1', shopName: 'Madina Electric Store', owner: 'Zafar Ahmed', address: 'Shop 12, Bolton Market, Karachi', phone: '+92-300-1234567', balance: 84000 },
  { id: 'sk2', shopName: 'Noor Hardware', owner: 'Imran Khan', address: 'Saddar, Karachi', phone: '+92-333-9876543', balance: 52500 },
  { id: 'sk3', shopName: 'Al-Aziz Lights', owner: 'Saleem Baig', address: 'Orangi Town, Karachi', phone: '+92-321-5555555', balance: 31000 },
  { id: 'sk4', shopName: 'Pak Electric Centre', owner: 'Raza Hussain', address: 'Clifton, Karachi', phone: '+92-311-2223344', balance: 18500 },
  { id: 'sk5', shopName: 'Star Lights & More', owner: 'Bilal Nawaz', address: 'North Nazimabad, Karachi', phone: '+92-345-6677889', balance: 0 },
  { id: 'sk6', shopName: 'Hassan Electrical', owner: 'Hassan Ali', address: 'Korangi, Karachi', phone: '+92-312-1010101', balance: 67000 },
];

export const invoices = [
  { id: 'inv1', shopkeeperId: 'sk1', brandId: 'b1', date: '2025-05-20', total: 42000, status: 'unpaid', items: [{ productId: 'p1', qty: 200, unitPrice: 150 }, { productId: 'p4', qty: 80, unitPrice: 90 }] },
  { id: 'inv2', shopkeeperId: 'sk2', brandId: 'b1', date: '2025-05-18', total: 35000, status: 'partial', items: [{ productId: 'p2', qty: 50, unitPrice: 500 }, { productId: 'p1', qty: 100, unitPrice: 150 }] },
  { id: 'inv3', shopkeeperId: 'sk3', brandId: 'b2', date: '2025-05-22', total: 31000, status: 'unpaid', items: [{ productId: 'p3', qty: 200, unitPrice: 100 }, { productId: 'p6', qty: 30, unitPrice: 650 }] },
  { id: 'inv4', shopkeeperId: 'sk4', brandId: 'b1', date: '2025-05-25', total: 18500, status: 'unpaid', items: [{ productId: 'p7', qty: 10, unitPrice: 950 }, { productId: 'p5', qty: 3, unitPrice: 3500 }] },
  { id: 'inv5', shopkeeperId: 'sk1', brandId: 'b1', date: '2025-04-10', total: 58000, status: 'paid', items: [{ productId: 'p2', qty: 80, unitPrice: 500 }, { productId: 'p1', qty: 300, unitPrice: 150 }] },
  { id: 'inv6', shopkeeperId: 'sk6', brandId: 'b2', date: '2025-05-15', total: 67000, status: 'unpaid', items: [{ productId: 'p8', qty: 200, unitPrice: 250 }, { productId: 'p6', qty: 60, unitPrice: 650 }] },
];

export const ledgerEntries = [
  { id: 'l1', shopkeeperId: 'sk1', invoiceId: 'inv5', date: '2025-04-10', type: 'invoice', debit: 58000, credit: 0, balance: 58000 },
  { id: 'l2', shopkeeperId: 'sk1', invoiceId: null, date: '2025-04-25', type: 'payment', debit: 0, credit: 58000, balance: 0 },
  { id: 'l3', shopkeeperId: 'sk1', invoiceId: 'inv1', date: '2025-05-20', type: 'invoice', debit: 42000, credit: 0, balance: 42000 },
  { id: 'l4', shopkeeperId: 'sk2', invoiceId: 'inv2', date: '2025-05-18', type: 'invoice', debit: 35000, credit: 0, balance: 35000 },
  { id: 'l5', shopkeeperId: 'sk2', invoiceId: null, date: '2025-05-22', type: 'payment', debit: 0, credit: 12500, balance: 22500 },
  { id: 'l6', shopkeeperId: 'sk3', invoiceId: 'inv3', date: '2025-05-22', type: 'invoice', debit: 31000, credit: 0, balance: 31000 },
  { id: 'l7', shopkeeperId: 'sk4', invoiceId: 'inv4', date: '2025-05-25', type: 'invoice', debit: 18500, credit: 0, balance: 18500 },
  { id: 'l8', shopkeeperId: 'sk6', invoiceId: 'inv6', date: '2025-05-15', type: 'invoice', debit: 67000, credit: 0, balance: 67000 },
];

export const expenses = [
  { id: 'e1', brandId: 'b1', category: 'Rent', amount: 45000, date: '2025-05-01', notes: 'Monthly warehouse rent' },
  { id: 'e2', brandId: 'b1', category: 'Salary', amount: 80000, date: '2025-05-01', notes: 'Staff salaries' },
  { id: 'e3', brandId: 'b1', category: 'Shipping', amount: 32000, date: '2025-05-10', notes: 'Guangzhou shipment freight' },
  { id: 'e4', brandId: 'b2', category: 'Salary', amount: 40000, date: '2025-05-01', notes: 'Staff salaries Hoshi' },
  { id: 'e5', brandId: 'b1', category: 'Utilities', amount: 12000, date: '2025-05-15', notes: 'Electricity & internet' },
];

export const monthlySales = [
  { month: 'Jan', brighto: 280000, hoshi: 120000 },
  { month: 'Feb', brighto: 320000, hoshi: 145000 },
  { month: 'Mar', brighto: 290000, hoshi: 160000 },
  { month: 'Apr', brighto: 410000, hoshi: 190000 },
  { month: 'May', brighto: 380000, hoshi: 210000 },
  { month: 'Jun', brighto: 450000, hoshi: 230000 },
];
