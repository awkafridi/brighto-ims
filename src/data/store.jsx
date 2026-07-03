import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  brands as initBrands, categories as initCategories, suppliers as initSuppliers,
  products as initProducts, batches as initBatches, shopkeepers as initShopkeepers,
  invoices as initInvoices, ledgerEntries as initLedger, expenses as initExpenses,
  monthlySales as initSales
} from './mockData';

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

  // Wipes everything to a clean, empty slate — for real business use
  const clearAll = () => {
    const empty = {
      brands: DEFAULT_STATE.brands,        // keep brand names (Brighto/Hoshi) — just no transactional data
      categories: DEFAULT_STATE.categories, // keep category list — just no transactional data
      suppliers: [],
      products: [],
      batches: [],
      shopkeepers: [],
      invoices: [],
      ledgerEntries: [],
      expenses: [],
      monthlySales: [],
    };
    localStorage.removeItem(STORAGE_KEY);
    setState(empty);
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
  const addSupplier = (data) => update('suppliers', ss => [...ss, { id: uid('s'), totalOwed: 0, totalPaid: 0, ...data }]);
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
  const addShopkeeper = (data) => update('shopkeepers', ss => [...ss, { id: uid('sk'), balance: 0, ...data }]);
  const editShopkeeper = (id, data) => update('shopkeepers', ss => ss.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteShopkeeper = (id) => update('shopkeepers', ss => ss.filter(s => s.id !== id));

  // ── INVOICES ──────────────────────────────────────────────────────────────────
  const addInvoice = (data) => {
    const id = uid('inv');
    const total = (data.items || []).reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const invoice = { id, status: 'unpaid', date: data.date, total, ...data };
    setState(prev => {
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
    addInvoice, editInvoice,
    recordPayment,
    addExpense, editExpense, deleteExpense,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
