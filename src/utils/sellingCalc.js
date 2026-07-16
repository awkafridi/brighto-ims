// Selling / invoice financial helpers — shared by store.jsx (at sale time),
// Invoices.jsx (live preview + detail view), and Reports.jsx (aggregation).

export const SALES_CHANNELS = ['Retail', 'Wholesale', 'Dealer', 'Online', 'Project'];
export const CUSTOMER_TYPES = ['Retail', 'Dealer', 'Distributor', 'Contractor', 'Corporate'];
export const SALES_STATUSES = ['Draft', 'Confirmed', 'Delivered', 'Completed', 'Cancelled'];
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Online'];
export const DELIVERY_STATUSES = ['Pending', 'Partial', 'Delivered'];
export const WARRANTY_TYPES = ['Manufacturer', 'Company'];

// Computes the full financial breakdown for an invoice — product subtotal,
// discount total, additional charges total, tax amount, and grand total —
// matching the "Invoice Summary" section of the Selling Details spec.
// `data.items[].discount` is a flat per-unit ₨ discount (not a percentage).
export function computeInvoiceTotals(data) {
  const items = data.items || [];
  const productTotal = items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const discountTotal = items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.discount) || 0), 0);
  const netProductTotal = productTotal - discountTotal;

  const additionalCharges = data.additionalCharges || [];
  const additionalChargesTotal = additionalCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const tax = data.tax || {};
  const gstAmount = netProductTotal * (Number(tax.gstPercent) || 0) / 100;
  const whtAmount = netProductTotal * (Number(tax.withholdingTaxPercent) || 0) / 100;
  const otherTaxAmount = Number(tax.otherTaxAmount) || 0;
  const taxAmount = gstAmount + whtAmount + otherTaxAmount;

  const grandTotal = netProductTotal + additionalChargesTotal + taxAmount;

  return {
    productTotal: Math.round(productTotal),
    discountTotal: Math.round(discountTotal),
    netProductTotal: Math.round(netProductTotal),
    additionalChargesTotal: Math.round(additionalChargesTotal),
    gstAmount: Math.round(gstAmount),
    whtAmount: Math.round(whtAmount),
    otherTaxAmount: Math.round(otherTaxAmount),
    taxAmount: Math.round(taxAmount),
    grandTotal: Math.round(grandTotal),
  };
}

// Warranty expiry date = invoice/warranty start date + periodMonths.
export function computeWarrantyExpiry(startDate, periodMonths) {
  if (!startDate || !periodMonths) return '';
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + Number(periodMonths));
  return d.toISOString().split('T')[0];
}
