// Landed-cost calculation engine for Purchase Orders (the "Buying Details" /
// import costing module). Turns a PO's product lines + itemized expenses
// into a real per-unit landed cost — which then becomes that unit's batch
// unitCost, feeding directly into the existing FIFO/COGS profit system.
//
// Currency handling (kept simple and documented, since the source spec
// doesn't pin this down explicitly):
//   - Product unit prices AND "China Local Expenses" / "International
//     Shipping" charges are entered in the PO's selected currency and
//     converted to PKR using the PO's exchange rate.
//   - "Pakistan Import Expenses" / "Pakistan Local Transportation" / "Other"
//     charges are always entered directly in PKR (they're billed locally).
//
// Expense allocation:
//   - 'per_unit'  → the amount typed is already a per-unit rate; applied to
//                   every unit in the PO as-is.
//   - 'lump'      → the amount is a single total for the whole shipment/batch;
//                   divided evenly across all units received.
//   - 'manual'    → treated like 'per_unit' (a manually-set per-unit rate),
//                   for one-off/exceptional charges.

export const FOREIGN_EXPENSE_SECTIONS = ['china', 'shipping'];

export const EXPENSE_SECTIONS = [
  { id: 'china',    label: 'China Local Expenses',        currency: 'foreign' },
  { id: 'shipping', label: 'International Shipping',      currency: 'foreign' },
  { id: 'import',   label: 'Pakistan Import Expenses',    currency: 'pkr' },
  { id: 'inland',   label: 'Pakistan Local Transportation', currency: 'pkr' },
  { id: 'other',    label: 'Other Expenses',               currency: 'pkr' },
];

export const ALLOCATION_TYPES = [
  { id: 'per_unit', label: 'Per Unit' },
  { id: 'lump',     label: 'Per Batch / Shipment' },
  { id: 'manual',   label: 'Manual (per unit)' },
];

export const PURCHASE_TYPES = ['Local', 'Import', 'Manufacturer'];
export const PO_STATUSES = ['Draft', 'Ordered', 'Received', 'Completed', 'Cancelled'];
export const CURRENCIES = ['PKR', 'USD', 'CNY', 'EUR'];
export const PAYMENT_TERMS = ['Cash', 'Credit', 'Advance', 'LC'];
export const INCOTERMS = ['EXW', 'FOB', 'CIF', 'CFR', 'DDP'];
export const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'];
export const INSPECTION_STATUSES = ['Pending', 'Approved', 'Rejected'];

function toPkr(amount, section, exchangeRate) {
  const n = Number(amount) || 0;
  const isForeign = FOREIGN_EXPENSE_SECTIONS.includes(section);
  return isForeign ? n * (Number(exchangeRate) || 1) : n;
}

// Total units received across all line items — the denominator for lump-sum allocation.
export function getTotalQty(items) {
  return (items || []).reduce((s, it) => s + (Number(it.qtyReceived) || 0), 0);
}

// Splits every expense into a flat per-unit overhead (in PKR), applied evenly
// to every unit in the PO, and returns the breakdown for display.
export function allocateExpenses(expenses, exchangeRate, totalQty) {
  let perUnitOverheadPkr = 0;
  let totalExpensesPkr = 0;
  const breakdown = (expenses || []).map(exp => {
    const amountPkr = toPkr(exp.amount, exp.section, exchangeRate);
    totalExpensesPkr += amountPkr;
    const perUnitContribution = exp.allocation === 'lump'
      ? (totalQty > 0 ? amountPkr / totalQty : 0)
      : amountPkr; // 'per_unit' and 'manual' are already per-unit rates
    perUnitOverheadPkr += perUnitContribution;
    return { ...exp, amountPkr, perUnitContribution };
  });
  return { breakdown, perUnitOverheadPkr, totalExpensesPkr };
}

// Main entry point: given a PO (currency, exchangeRate, items, expenses),
// returns each item enriched with its real landed cost per unit, plus totals
// matching the spec's "Buying Summary (Auto Calculation)" section.
export function computeLandedCost(po) {
  const exchangeRate = Number(po?.exchangeRate) || 1;
  const items = po?.items || [];
  const totalQty = getTotalQty(items);
  const { breakdown, perUnitOverheadPkr, totalExpensesPkr } = allocateExpenses(po?.expenses, exchangeRate, totalQty);

  const itemsWithLandedCost = items.map(it => {
    const qty = Number(it.qtyReceived) || 0;
    const unitPricePkr = (Number(it.unitPrice) || 0) * exchangeRate;
    const unitLandedCost = unitPricePkr + perUnitOverheadPkr;
    return {
      ...it,
      unitPricePkr: Math.round(unitPricePkr),
      unitLandedCost: Math.round(unitLandedCost),
      totalLandedCost: Math.round(unitLandedCost * qty),
    };
  });

  const totalProductCostPkr = itemsWithLandedCost.reduce(
    (s, it) => s + it.unitPricePkr * (Number(it.qtyReceived) || 0), 0
  );
  const grandTotalPkr = totalProductCostPkr + totalExpensesPkr;

  return {
    items: itemsWithLandedCost,
    expenseBreakdown: breakdown,
    totalQty,
    totalProductCostPkr: Math.round(totalProductCostPkr),
    totalExpensesPkr: Math.round(totalExpensesPkr),
    perUnitOverheadPkr: Math.round(perUnitOverheadPkr * 100) / 100,
    grandTotalPkr: Math.round(grandTotalPkr),
    avgLandedCostPerUnit: totalQty > 0 ? Math.round(grandTotalPkr / totalQty) : 0,
  };
}

// Sum of expenses within a given section, in PKR — used for the per-section
// summary rows (China / Shipping / Import / Inland / Other).
export function sectionTotalPkr(expenses, sectionId, exchangeRate) {
  return (expenses || [])
    .filter(e => e.section === sectionId)
    .reduce((s, e) => s + toPkr(e.amount, e.section, exchangeRate), 0);
}
