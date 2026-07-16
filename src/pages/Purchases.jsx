import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Select, Btn, PageHeader, EmptyState } from '../components/UI';
import {
  computeLandedCost, EXPENSE_SECTIONS, ALLOCATION_TYPES,
  PURCHASE_TYPES, PO_STATUSES, CURRENCIES, PAYMENT_TERMS, INCOTERMS,
  INSPECTION_STATUSES,
} from '../utils/landedCost';

const statusColor = { Draft: 'gray', Ordered: 'accent', Received: 'green', Completed: 'green', Cancelled: 'red' };

const emptyItem = () => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  productId: '', sku: '', name: '', categoryId: '', brandId: '',
  unit: 'pcs', qtyOrdered: '', qtyReceived: '', freeQty: '', unitPrice: '',
});

const emptyExpense = (section) => ({
  id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  section, label: '', amount: '', allocation: 'lump',
});

const emptyPO = () => ({
  purchaseDate: new Date().toISOString().split('T')[0],
  supplierInvoiceNo: '', purchaseType: 'Import', status: 'Draft',
  supplierId: '', manufacturer: '', supplierContact: '', country: 'China',
  currency: 'USD', exchangeRate: 285,
  warehouse: 'Main Warehouse', branch: '', buyer: '',
  paymentTerms: 'Advance', incoterms: 'FOB',
  items: [emptyItem()],
  expenses: [],
  shipping: { method: 'Sea', company: '', containerNo: '', blAwbNumber: '' },
  payment: { invoiceAmount: '', paidToDate: 0, status: 'Pending', paymentDate: '', method: '' },
  grn: { grnNumber: '', receivedDate: '', receivedBy: '', inspectionStatus: 'Pending', damagedQty: '', acceptedQty: '', remarks: '' },
  additional: { warranty: '', batchNumber: '', serialNumbers: '', expiryDate: '', certificates: '' },
});

function SummaryRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: bold ? 14 : 13 }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: accent ? 'var(--accent)' : 'var(--text)', fontFamily: bold ? "'Space Grotesk', sans-serif" : 'inherit' }}>{value}</span>
    </div>
  );
}

export default function Purchases() {
  const {
    purchaseOrders, suppliers, products,
    addPurchaseOrder, editPurchaseOrder, deletePurchaseOrder,
    receivePurchaseOrder, recordSupplierPayment,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPO());
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [payAmount, setPayAmount] = useState('');

  const selected = selectedId ? purchaseOrders.find(p => p.id === selectedId) : null;

  const filtered = statusFilter === 'all' ? purchaseOrders : purchaseOrders.filter(p => p.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const liveLanded = useMemo(() => computeLandedCost(form), [form]);

  const openCreate = () => { setForm(emptyPO()); setEditingId(null); setShowForm(true); };
  const openEdit = (po) => { setForm({ ...emptyPO(), ...po }); setEditingId(po.id); setShowForm(true); };

  const updateField = (path, value) => {
    setForm(f => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...f, [path]: value };
      return { ...f, [parts[0]]: { ...f[parts[0]], [parts[1]]: value } };
    });
  };

  const autofillFromProduct = (productId) => {
    const p = products.find(p => p.id === productId);
    if (!p) return {};
    return { name: p.name, sku: p.sku, categoryId: p.categoryId, brandId: p.brandId, unit: p.unit || 'pcs' };
  };

  const updateItem = (id, field, value) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.id === id
        ? { ...it, [field]: value, ...(field === 'productId' ? autofillFromProduct(value) : {}) }
        : it),
    }));
  };

  const addItemRow = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItemRow = (id) => setForm(f => ({ ...f, items: f.items.filter(it => it.id !== id) }));

  const addExpenseRow = (section) => setForm(f => ({ ...f, expenses: [...f.expenses, emptyExpense(section)] }));
  const updateExpense = (id, field, value) => setForm(f => ({ ...f, expenses: f.expenses.map(e => e.id === id ? { ...e, [field]: value } : e) }));
  const removeExpenseRow = (id) => setForm(f => ({ ...f, expenses: f.expenses.filter(e => e.id !== id) }));

  const handleSave = () => {
    const cleanItems = form.items.filter(it => it.name || it.productId);
    const payload = { ...form, items: cleanItems };
    if (editingId) editPurchaseOrder(editingId, payload);
    else addPurchaseOrder(payload);
    setShowForm(false);
  };

  const handleReceive = (po) => receivePurchaseOrder(po.id);

  const handleDelete = (po) => {
    if (confirmDelete === po.id) {
      deletePurchaseOrder(po.id);
      setConfirmDelete(null);
      if (selectedId === po.id) setSelectedId(null);
    } else {
      setConfirmDelete(po.id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleRecordPayment = () => {
    if (!selected || !payAmount || isNaN(payAmount)) return;
    recordSupplierPayment(selected.id, Number(payAmount));
    setPayAmount('');
  };

  return (
    <div>
      <PageHeader
        title="🚢 Purchases"
        subtitle="Purchase orders, landed cost, and goods receiving"
        action={<Btn onClick={openCreate}>+ New purchase order</Btn>}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">All statuses</option>
          {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)' }}>{filtered.length} purchase orders</div>
      </div>

      <Card style={{ padding: 0 }}>
        {sorted.length === 0 ? (
          <EmptyState icon="🚢" title="No purchase orders yet" description="Create your first purchase order to start tracking landed cost." />
        ) : (
          <Table onRowClick={po => setSelectedId(po.id)} columns={[
            { key: 'poNumber', label: 'PO #', render: (v, row) => (
              <div><div style={{ fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{v}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.purchaseDate}</div></div>
            )},
            { key: 'supplierId', label: 'Supplier', render: v => suppliers.find(s => s.id === v)?.name || '—' },
            { key: 'purchaseType', label: 'Type', render: v => <Badge color="accent">{v}</Badge> },
            { key: 'status', label: 'Status', render: v => <Badge color={statusColor[v] || 'gray'}>{v}</Badge> },
            { key: 'total', label: 'Landed total', align: 'right', render: (_, row) => {
              const t = row.landedTotals?.grandTotalPkr ?? computeLandedCost(row).grandTotalPkr;
              return <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>₨{t.toLocaleString()}</strong>;
            }},
            { key: 'actions', label: '', align: 'right', render: (_, row) => (
              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                {row.status !== 'Received' && row.status !== 'Completed' && (
                  <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
                )}
                <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>
                  {confirmDelete === row.id ? 'Sure?' : 'Del'}
                </button>
              </div>
            )},
          ]} data={sorted} />
        )}
      </Card>

      {/* ── Create / Edit form ─────────────────────────────────────────────────── */}
      {showForm && (
        <Modal title={editingId ? `Edit ${form.poNumber || 'purchase order'}` : '🚢 New purchase order'} onClose={() => setShowForm(false)} width={880}>

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Purchase information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="Purchase date" type="date" value={form.purchaseDate} onChange={e => updateField('purchaseDate', e.target.value)} />
            <Input label="Supplier invoice no." value={form.supplierInvoiceNo} onChange={e => updateField('supplierInvoiceNo', e.target.value)} />
            <Select label="Purchase type" value={form.purchaseType} onChange={e => updateField('purchaseType', e.target.value)}>
              {PURCHASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Select label="Supplier" value={form.supplierId} onChange={e => updateField('supplierId', e.target.value)}>
              <option value="">— select supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Manufacturer" value={form.manufacturer} onChange={e => updateField('manufacturer', e.target.value)} />
            <Input label="Supplier contact" value={form.supplierContact} onChange={e => updateField('supplierContact', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="Country" value={form.country} onChange={e => updateField('country', e.target.value)} />
            <Select label="Currency" value={form.currency} onChange={e => updateField('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label={`Exchange rate (1 ${form.currency} = ? PKR)`} type="number" value={form.exchangeRate} onChange={e => updateField('exchangeRate', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <Input label="Warehouse" value={form.warehouse} onChange={e => updateField('warehouse', e.target.value)} />
            <Input label="Branch" value={form.branch} onChange={e => updateField('branch', e.target.value)} />
            <Input label="Buyer" value={form.buyer} onChange={e => updateField('buyer', e.target.value)} />
            <Select label="Status" value={form.status} onChange={e => updateField('status', e.target.value)}>
              {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <Select label="Payment terms" value={form.paymentTerms} onChange={e => updateField('paymentTerms', e.target.value)}>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Incoterms" value={form.incoterms} onChange={e => updateField('incoterms', e.target.value)}>
              {INCOTERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Product purchase details</div>
            <Btn variant="ghost" onClick={addItemRow}>+ Add line</Btn>
          </div>
          {form.items.map(it => (
            <div key={it.id} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 8, border: '0.5px solid var(--border2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <Select label="Product (or leave for manual entry)" value={it.productId} onChange={e => updateItem(it.id, 'productId', e.target.value)}>
                  <option value="">— manual entry —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </Select>
                <Input label="Product name" value={it.name} onChange={e => updateItem(it.id, 'name', e.target.value)} disabled={!!it.productId} />
                <Input label="SKU" value={it.sku} onChange={e => updateItem(it.id, 'sku', e.target.value)} disabled={!!it.productId} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 8 }}>
                <Input label="Unit" value={it.unit} onChange={e => updateItem(it.id, 'unit', e.target.value)} />
                <Input label="Qty ordered" type="number" value={it.qtyOrdered} onChange={e => updateItem(it.id, 'qtyOrdered', e.target.value)} />
                <Input label="Qty received" type="number" value={it.qtyReceived} onChange={e => updateItem(it.id, 'qtyReceived', e.target.value)} />
                <Input label="Free qty" type="number" value={it.freeQty} onChange={e => updateItem(it.id, 'freeQty', e.target.value)} />
                <Input label={`Unit price (${form.currency})`} type="number" value={it.unitPrice} onChange={e => updateItem(it.id, 'unitPrice', e.target.value)} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Line total ({form.currency})</div>
                  <div style={{ padding: '8px 0', fontWeight: 600 }}>{((Number(it.qtyReceived) || 0) * (Number(it.unitPrice) || 0)).toLocaleString()}</div>
                </div>
              </div>
              {form.items.length > 1 && (
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button onClick={() => removeItemRow(it.id)} style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove line</button>
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Expenses</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            China &amp; shipping charges are entered in {form.currency}; Pakistan import/inland/other charges are always in PKR.
          </div>
          {EXPENSE_SECTIONS.map(sec => {
            const rows = form.expenses.filter(e => e.section === sec.id);
            return (
              <div key={sec.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                    {sec.label} {sec.currency === 'foreign' ? `(${form.currency})` : '(PKR)'}
                  </div>
                  <button onClick={() => addExpenseRow(sec.id)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add charge</button>
                </div>
                {rows.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', paddingLeft: 2 }}>No charges added</div>}
                {rows.map(exp => (
                  <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <input value={exp.label} onChange={e => updateExpense(exp.id, 'label', e.target.value)} placeholder="Charge description"
                      style={{ padding: '7px 10px', background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }} />
                    <input type="number" value={exp.amount} onChange={e => updateExpense(exp.id, 'amount', e.target.value)} placeholder="Amount"
                      style={{ padding: '7px 10px', background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }} />
                    <select value={exp.allocation} onChange={e => updateExpense(exp.id, 'allocation', e.target.value)}
                      style={{ padding: '7px 10px', background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13 }}>
                      {ALLOCATION_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                    <button onClick={() => removeExpenseRow(exp.id)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Shipping</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <Select label="Shipping method" value={form.shipping.method} onChange={e => updateField('shipping.method', e.target.value)}>
              {['Sea', 'Air', 'Courier'].map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Input label="Shipping company" value={form.shipping.company} onChange={e => updateField('shipping.company', e.target.value)} />
            <Input label="Container no." value={form.shipping.containerNo} onChange={e => updateField('shipping.containerNo', e.target.value)} />
            <Input label="BL / AWB number" value={form.shipping.blAwbNumber} onChange={e => updateField('shipping.blAwbNumber', e.target.value)} />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Payment information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="Supplier invoice amount (₨)" type="number" value={form.payment.invoiceAmount} onChange={e => updateField('payment.invoiceAmount', e.target.value)} />
            <Input label="Payment date" type="date" value={form.payment.paymentDate} onChange={e => updateField('payment.paymentDate', e.target.value)} />
            <Input label="Payment method" value={form.payment.method} onChange={e => updateField('payment.method', e.target.value)} placeholder="Bank / Cash / TT / LC" />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Goods receiving</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="GRN number" value={form.grn.grnNumber} onChange={e => updateField('grn.grnNumber', e.target.value)} />
            <Input label="Received date" type="date" value={form.grn.receivedDate} onChange={e => updateField('grn.receivedDate', e.target.value)} />
            <Input label="Received by" value={form.grn.receivedBy} onChange={e => updateField('grn.receivedBy', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Select label="Inspection status" value={form.grn.inspectionStatus} onChange={e => updateField('grn.inspectionStatus', e.target.value)}>
              {INSPECTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Damaged qty" type="number" value={form.grn.damagedQty} onChange={e => updateField('grn.damagedQty', e.target.value)} />
            <Input label="Accepted qty" type="number" value={form.grn.acceptedQty} onChange={e => updateField('grn.acceptedQty', e.target.value)} />
          </div>
          <Input label="Remarks" value={form.grn.remarks} onChange={e => updateField('grn.remarks', e.target.value)} />

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Additional information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="Warranty" value={form.additional.warranty} onChange={e => updateField('additional.warranty', e.target.value)} />
            <Input label="Batch number" value={form.additional.batchNumber} onChange={e => updateField('additional.batchNumber', e.target.value)} />
            <Input label="Expiry date" type="date" value={form.additional.expiryDate} onChange={e => updateField('additional.expiryDate', e.target.value)} />
          </div>
          <Input label="Serial numbers" value={form.additional.serialNumbers} onChange={e => updateField('additional.serialNumbers', e.target.value)} placeholder="Comma-separated, optional" />
          <Input label="Product certificates" value={form.additional.certificates} onChange={e => updateField('additional.certificates', e.target.value)} placeholder="CE / RoHS / ISO..." />

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📊 Buying summary (auto-calculated)</div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16 }}>
            <SummaryRow label="Total units" value={liveLanded.totalQty.toLocaleString()} />
            <SummaryRow label="Product cost" value={`₨${liveLanded.totalProductCostPkr.toLocaleString()}`} />
            <SummaryRow label="Total expenses (all sections)" value={`₨${liveLanded.totalExpensesPkr.toLocaleString()}`} />
            <SummaryRow label="Per-unit expense overhead" value={`₨${liveLanded.perUnitOverheadPkr.toLocaleString()}`} />
            <div style={{ height: 1, background: 'var(--border2)', margin: '8px 0' }} />
            <SummaryRow label="Grand total landed cost" value={`₨${liveLanded.grandTotalPkr.toLocaleString()}`} bold />
            <SummaryRow label="Average landed cost / unit" value={`₨${liveLanded.avgLandedCostPerUnit.toLocaleString()}`} bold accent />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={handleSave}>{editingId ? 'Save changes' : 'Create purchase order'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Detail view ────────────────────────────────────────────────────────── */}
      {selected && (() => {
        const landed = computeLandedCost(selected);
        const supplier = suppliers.find(s => s.id === selected.supplierId);
        const owedOnThisPO = selected.landedTotals?.grandTotalPkr ?? landed.grandTotalPkr;
        const canReceive = !['Received', 'Completed', 'Cancelled'].includes(selected.status);
        return (
          <Modal title={`${selected.poNumber} — ${supplier?.name || 'Manual entry'}`} onClose={() => setSelectedId(null)} width={800}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Badge color={statusColor[selected.status] || 'gray'}>{selected.status}</Badge>
              <Badge color="accent">{selected.purchaseType}</Badge>
              <Badge color="gray">{selected.currency} @ {selected.exchangeRate}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Purchase date</div><div style={{ fontWeight: 500 }}>{selected.purchaseDate}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Supplier</div><div style={{ fontWeight: 500 }}>{supplier?.name || '—'}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Country</div><div style={{ fontWeight: 500 }}>{selected.country}</div></div>
            </div>

            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Line items</div>
            <Table columns={[
              { key: 'name', label: 'Product' },
              { key: 'qtyReceived', label: 'Qty', align: 'right' },
              { key: 'unitLandedCost', label: 'Landed cost/unit', align: 'right', render: v => `₨${v.toLocaleString()}` },
              { key: 'totalLandedCost', label: 'Total', align: 'right', render: v => <strong>₨{v.toLocaleString()}</strong> },
            ]} data={landed.items} />

            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 14, margin: '16px 0' }}>
              <SummaryRow label="Grand total landed cost" value={`₨${owedOnThisPO.toLocaleString()}`} bold />
              <SummaryRow label="Average landed cost / unit" value={`₨${(selected.landedTotals?.avgLandedCostPerUnit ?? landed.avgLandedCostPerUnit).toLocaleString()}`} bold accent />
              <SummaryRow label="Payment status" value={selected.payment?.status || 'Pending'} />
              <SummaryRow label="Paid to date" value={`₨${(selected.payment?.paidToDate || 0).toLocaleString()}`} />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canReceive && <Btn onClick={() => handleReceive(selected)}>✓ Mark received &amp; add to inventory</Btn>}
              {!canReceive && supplier && (
                <>
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Payment amount (₨)"
                    style={{ padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', width: 160 }} />
                  <Btn variant="ghost" onClick={handleRecordPayment}>Record payment to supplier</Btn>
                </>
              )}
            </div>

            {!canReceive && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                ✓ This PO has already added {landed.totalQty} units to inventory at their real landed cost.
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
