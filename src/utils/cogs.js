// COGS (Cost of Goods Sold) helpers — resolves the real unit cost of a sale
// from the product's batches instead of a flat average or a static margin
// multiplier, so profit reflects what was actually paid for that stock.

// Returns the unit cost of the batch that would be consumed NEXT under FIFO
// (oldest batch, by purchase date, that still has stock remaining).
// Falls back to the product's average cost if no open batch exists (e.g. a
// manually-typed invoice line, or a product added before batch tracking).
export function getFIFOUnitCost(productId, batches, product) {
  if (!productId) return product?.avgCost || 0;

  const openBatches = (batches || [])
    .filter(b => b.productId === productId && (b.qtyRemaining ?? 0) > 0)
    .sort((a, b) => new Date(a.purchase_date || a.date || 0) - new Date(b.purchase_date || b.date || 0));

  if (openBatches.length > 0) return openBatches[0].unitCost || 0;
  return product?.avgCost || 0;
}

// Profit for a single invoice line: (SalePrice - UnitCost) * Quantity, where
// SalePrice is net of any per-line discount. Prefers a unitCost already
// snapshotted on the line (captured at sale time) so historic invoices don't
// drift if batch costs change later; falls back to a live FIFO lookup for
// older invoices saved before this snapshot existed.
export function calcLineProfit(line, product, batches) {
  const qty = Number(line.qty) || 0;
  const netSalePrice = (Number(line.unitPrice) || 0) - (Number(line.discount) || 0);
  const unitCost = line.unitCost ?? getFIFOUnitCost(line.productId, batches, product);
  return (netSalePrice - unitCost) * qty;
}

// Total COGS (cost side only) for a single invoice line — used by Dashboard
// to sum cost-of-goods across many invoices.
export function calcLineCost(line, product, batches) {
  const qty = Number(line.qty) || 0;
  const unitCost = line.unitCost ?? getFIFOUnitCost(line.productId, batches, product);
  return unitCost * qty;
}
