import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  brands as initBrands, categories as initCategories, suppliers as initSuppliers,
  products as initProducts, batches as initBatches, shopkeepers as initShopkeepers,
  invoices as initInvoices, ledgerEntries as initLedger, expenses as initExpenses,
  monthlySales as initSales
} from './mockData';
import { getFIFOUnitCost } from '../utils/cogs';
import { computeLandedCost } from '../utils/landedCost';
import { computeInvoiceTotals, computeWarrantyExpiry } from '../utils/sellingCalc';

const StoreContext = createContext(null);
const STORAGE_KEY = 'brighto_ims_data_v1';

const DEFAULT_STATE = {
  brands: initBrands,
  categories: initCategories,
  suppliers: initSuppliers,
  products: initProducts,
  batches: initBatches,
  shopkeepers: initShopkeepers,
  invoices: initInvoices,
  ledgerEntries: initLedger,
  expenses: initExpenses,
  monthlySales: initSales,
  purchaseOrders: [],
};

// Load from localStorage, fall back to defaults
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults so new fields added in updates still appear
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.warn('Could not load saved data, using defaults');
  }
  return DEFAULT_STATE;
}

// Save to localStorage (debounced via useEffect)
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save data to localStorage');
  }
}

let idCounter = 1000;
const uid = (prefix) => `${prefix}-${Date.now()}-${idCounter++}`;

// Sequential, human-readable PO numbers (PO-1001, PO-1002, ...) based on the
// highest existing number so it survives resets/imports without collisions.
function nextPoNumber(purchaseOrders) {
  const nums = (purchaseOrders || [])
    .map(po => parseInt(String(po.poNumber || '').replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `PO-${next}`;
}

// Generic sequential document-number generator (INV-1001, SO-1001, QT-1001,
// CUST-1001, ...) — finds the highest existing number for that prefix across
// a list and returns the next one, so it's stable across resets/imports.
function nextDocNumber(list, field, prefix) {
  const nums = (list || [])
    .map(item => parseInt(String(item[field] || '').replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `${prefix}-${next}`;
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  // Auto-save on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback((key, updater) =>
    setState(prev => ({ ...prev, [key]: updater(prev[key]) })), []);

  // ── RESET ────────────────────────────────────────────────────────────────────
  // Restores the original sample/demo data (useful for exploring features)
  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_STATE);
  };

  // Wipes ONLY transactional data — invoices, ledger, expenses
  // Products, shopkeepers, suppliers, brands, categories are NEVER deleted
  const clearAll = () => {
    const cleared = {
      ...state,
      invoices: [],
      ledgerEntries: [],
      expenses: [],
      batches: [],
      purchaseOrders: [],
      // Reset shopkeeper balances to 0 but keep the shopkeepers
      shopkeepers: state.shopkeepers.map(s => ({ ...s, balance: 0 })),
      // Reset supplier balances but keep suppliers
      suppliers: state.suppliers.map(s => ({ ...s, totalOwed: 0, totalPaid: 0 })),
      monthlySales: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
    setState(cleared);
  };

  // ── BRANDS ───────────────────────────────────────────────────────────────────
  const addBrand = (data) => update('brands', bs => [...bs, { id: uid('b'), ...data }]);
  const editBrand = (id, data) => update('brands', bs => bs.map(b => b.id === id ? { ...b, ...data } : b));
  const deleteBrand = (id) => update('brands', bs => bs.filter(b => b.id !== id));

  // ── CATEGORIES ────────────────────────────────────────────────────────────────
  const addCategory = (data) => update('categories', cs => [...cs, { id: uid('c'), ...data }]);
  const editCategory = (id, data) => update('categories', cs => cs.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteCategory = (id) => update('categories', cs => cs.filter(c => c.id !== id));

  // ── SUPPLIERS ─────────────────────────────────────────────────────────────────
  const addSupplier = (data) => update('suppliers', ss => [...ss, { id: uid('s'), totalOwed: 0, totalPaid: 0, country: 'China', ...data }]);
  const editSupplier = (id, data) => update('suppliers', ss => ss.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteSupplier = (id) => update('suppliers', ss => ss.filter(s => s.id !== id));

  // ── PRODUCTS ──────────────────────────────────────────────────────────────────
  const addProduct = (data) => update('products', ps => [...ps, { id: uid('p'), avgCost: 0, sellingPrice: 0, stock: 0, variants: [], ...data }]);
  const editProduct = (id, data) => update('products', ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProduct = (id) => update('products', ps => ps.filter(p => p.id !== id));

  // ── VARIANTS ──────────────────────────────────────────────────────────────────
  const addVariant = (productId, variantData) => update('products', ps => ps.map(p =>
    p.id === productId
      ? { ...p, variants: [...(p.variants || []), { id: uid('v'), ...variantData }] }
      : p
  ));
  const editVariant = (productId, variantId, data) => update('products', ps => ps.map(p =>
    p.id === productId
      ? { ...p, variants: (p.variants || []).map(v => v.id === variantId ? { ...v, ...data } : v) }
      : p
  ));
  const deleteVariant = (productId, variantId) => update('products', ps => ps.map(p =>
    p.id === productId
      ? { ...p, variants: (p.variants || []).filter(v => v.id !== variantId) }
      : p
  ));

  // ── BATCHES ───────────────────────────────────────────────────────────────────
  const addBatch = (data) => {
    const batch = { id: uid('bt'), qtyRemaining: data.qtyReceived, ...data };
    setState(prev => {
      const existingBatches = prev.batches.filter(b => b.productId === data.productId && b.qtyRemaining > 0);
      const allBatches = [...existingBatches, batch];
      const totalQty = allBatches.reduce((s, b) => s + b.qtyRemaining, 0);
      const totalVal = allBatches.reduce((s, b) => s + (b.unitCost || 0) * b.qtyRemaining, 0);
      const avgCost = totalQty ? Math.round(totalVal / totalQty) : data.unitCost;
      // Stock is ADDITIVE — add the new batch qty on top of whatever is already there
      const currentProduct = prev.products.find(p => p.id === data.productId);
      const newStock = (currentProduct?.stock || 0) + data.qtyReceived;
      return {
        ...prev,
        batches: [...prev.batches, batch],
        products: prev.products.map(p => p.id === data.productId
          ? { ...p, avgCost, stock: newStock }
          : p
        )
      };
    });
  };

  // ── SHOPKEEPERS ───────────────────────────────────────────────────────────────
  const addShopkeeper = (data) => update('shopkeepers', ss => [...ss, {
    id: uid('sk'),
    customerCode: nextDocNumber(ss, 'customerCode', 'CUST'),
    balance: 0,
    phone: '+92-',
    customerType: 'Retail',
    country: 'Pakistan',
    currency: 'PKR',
    ...data,
  }]);
  const editShopkeeper = (id, data) => update('shopkeepers', ss => ss.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteShopkeeper = (id) => update('shopkeepers', ss => ss.filter(s => s.id !== id));

  // ── INVOICES ──────────────────────────────────────────────────────────────────
  const addInvoice = (data) => {
    const id = uid('inv');
    setState(prev => {
      // Snapshot the real per-unit cost (from the product's oldest open batch,
      // FIFO) onto each line at the moment of sale. This is what powers
      // accurate COGS-based profit in the Dashboard, and keeps historic
      // invoices stable even if batch costs or averages change later.
      const itemsWithCost = (data.items || []).map(line => {
        const product = prev.products.find(p => p.id === line.productId);
        return {
          ...line,
          unitCost: getFIFOUnitCost(line.productId, prev.batches, product),
        };
      });

      // Full financial breakdown — product subtotal, discounts, additional
      // charges, tax — the invoice's `total` (what's actually owed) is the
      // real grand total, not just the raw product sum.
      const totals = computeInvoiceTotals({ ...data, items: itemsWithCost });
      const total = totals.grandTotal;

      // Auto-generate the document trail (quotation/sales-order/invoice
      // numbers are collapsed into one creation step in this app, rather
      // than three separate stages).
      const invoiceNo = nextDocNumber(prev.invoices, 'invoiceNo', 'INV');
      const salesOrderNo = nextDocNumber(prev.invoices, 'salesOrderNo', 'SO');
      const quotationNo = nextDocNumber(prev.invoices, 'quotationNo', 'QT');

      // Warranty expiry auto-calculated from the invoice date + period, if warranty info was given.
      const warranty = data.warranty ? {
        ...data.warranty,
        startDate: data.date,
        expiryDate: computeWarrantyExpiry(data.date, data.warranty.periodMonths),
      } : undefined;

      const invoice = {
        id, status: 'unpaid', date: data.date,
        ...data,
        items: itemsWithCost,
        total,
        totals,
        invoiceNo, salesOrderNo, quotationNo,
        ...(warranty ? { warranty } : {}),
      };

      // Only update shopkeeper balance for registered (non-guest) shopkeepers
      if (data.isGuest || !data.shopkeeperId) {
        return { ...prev, invoices: [...prev.invoices, invoice] };
      }
      const sk = prev.shopkeepers.find(s => s.id === data.shopkeeperId);
      const newBalance = (sk?.balance || 0) + total;
      const ledgerEntry = {
        id: uid('l'), shopkeeperId: data.shopkeeperId, invoiceId: id,
        date: data.date, type: 'invoice', debit: total, credit: 0, balance: newBalance
      };
      return {
        ...prev,
        invoices: [...prev.invoices, invoice],
        shopkeepers: prev.shopkeepers.map(s =>
          s.id === data.shopkeeperId ? { ...s, balance: newBalance } : s
        ),
        ledgerEntries: [...prev.ledgerEntries, ledgerEntry],
      };
    });
  };
  const editInvoice = (id, data) => update('invoices', invs => invs.map(i => i.id === id ? { ...i, ...data } : i));
  const deleteInvoice = (id) => update('invoices', invs => invs.filter(i => i.id !== id));

  // ── PAYMENTS ──────────────────────────────────────────────────────────────────
  const recordPayment = (shopkeeperId, amount, date = new Date().toISOString().split('T')[0]) => {
    setState(prev => {
      const sk = prev.shopkeepers.find(s => s.id === shopkeeperId);
      const newBalance = Math.max(0, (sk?.balance || 0) - amount);
      const ledgerEntry = {
        id: uid('l'), shopkeeperId, invoiceId: null,
        date, type: 'payment', debit: 0, credit: amount, balance: newBalance
      };
      return {
        ...prev,
        shopkeepers: prev.shopkeepers.map(s =>
          s.id === shopkeeperId ? { ...s, balance: newBalance } : s
        ),
        ledgerEntries: [...prev.ledgerEntries, ledgerEntry],
      };
    });
  };

  // ── EXPENSES ──────────────────────────────────────────────────────────────────
  const addExpense = (data) => update('expenses', es => [...es, { id: uid('e'), ...data }]);
  const editExpense = (id, data) => update('expenses', es => es.map(e => e.id === id ? { ...e, ...data } : e));
  const deleteExpense = (id) => update('expenses', es => es.filter(e => e.id !== id));

  // ── PURCHASE ORDERS (landed-cost buying) ─────────────────────────────────────
  // Header + product lines + itemized China/shipping/import/inland expenses +
  // payment + GRN info. Marking a PO "Received" turns its landed cost per
  // item into real batches via the EXISTING addBatch() — so FIFO stock,
  // avgCost, and COGS-based profit all keep working exactly as before,
  // just fed with a real landed cost instead of a manually-typed unitCost.
  const addPurchaseOrder = (data) => {
    setState(prev => ({
      ...prev,
      purchaseOrders: [...prev.purchaseOrders, {
        id: uid('po'),
        poNumber: nextPoNumber(prev.purchaseOrders),
        status: 'Draft',
        createdAt: new Date().toISOString(),
        items: [],
        expenses: [],
        ...data,
      }],
    }));
  };
  const editPurchaseOrder = (id, data) => update('purchaseOrders', pos => pos.map(po => po.id === id ? { ...po, ...data } : po));
  const deletePurchaseOrder = (id) => update('purchaseOrders', pos => pos.filter(po => po.id !== id));

  // Receiving a PO is the moment the landed cost becomes real inventory:
  // for every line item linked to a product, create a batch at that item's
  // computed landed unit cost, bump the supplier's amount owed by the PO's
  // grand total, and stamp the PO Received with its final cost summary.
  const receivePurchaseOrder = (id) => {
    const po = state.purchaseOrders.find(p => p.id === id);
    if (!po || po.status === 'Received' || po.status === 'Completed') return;

    const landed = computeLandedCost(po);

    landed.items.forEach(it => {
      if (!it.productId || !(Number(it.qtyReceived) > 0)) return;
      addBatch({
        productId: it.productId,
        supplierId: po.supplierId,
        purchase_date: po.purchaseDate,
        unitCost: it.unitLandedCost,
        qtyReceived: Number(it.qtyReceived),
        poId: po.id,
      });
    });

    if (po.supplierId) {
      const supplier = state.suppliers.find(s => s.id === po.supplierId);
      editSupplier(po.supplierId, { totalOwed: (supplier?.totalOwed || 0) + landed.grandTotalPkr });
    }

    editPurchaseOrder(id, {
      status: 'Received',
      receivedAt: new Date().toISOString(),
      landedTotals: {
        grandTotalPkr: landed.grandTotalPkr,
        avgLandedCostPerUnit: landed.avgLandedCostPerUnit,
        totalQty: landed.totalQty,
      },
    });
  };

  // Records a payment made to a supplier against a PO's invoice (advance or
  // balance) — bumps the supplier's totalPaid so Suppliers.jsx's outstanding
  // balance stays accurate, and updates the PO's own payment status.
  const recordSupplierPayment = (poId, amount) => {
    const po = state.purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    const amt = Number(amount) || 0;
    if (po.supplierId) {
      const supplier = state.suppliers.find(s => s.id === po.supplierId);
      editSupplier(po.supplierId, { totalPaid: (supplier?.totalPaid || 0) + amt });
    }
    const invoiceAmount = po.landedTotals?.grandTotalPkr || po.payment?.invoiceAmount || 0;
    const paidSoFar = (po.payment?.paidToDate || 0) + amt;
    editPurchaseOrder(poId, {
      payment: {
        ...(po.payment || {}),
        paidToDate: paidSoFar,
        status: paidSoFar <= 0 ? 'Pending' : paidSoFar >= invoiceAmount && invoiceAmount > 0 ? 'Paid' : 'Partial',
        lastPaymentDate: new Date().toISOString().split('T')[0],
      },
    });
  };

  const value = {
    ...state,
    resetAll,
    clearAll,
    addBrand, editBrand, deleteBrand,
    addCategory, editCategory, deleteCategory,
    addSupplier, editSupplier, deleteSupplier,
    addProduct, editProduct, deleteProduct,
    addVariant, editVariant, deleteVariant,
    addBatch,
    addShopkeeper, editShopkeeper, deleteShopkeeper,
    addInvoice, editInvoice, deleteInvoice,
    recordPayment,
    addExpense, editExpense, deleteExpense,
    addPurchaseOrder, editPurchaseOrder, deletePurchaseOrder,
    receivePurchaseOrder, recordSupplierPayment,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
