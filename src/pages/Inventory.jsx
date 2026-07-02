import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Select, Btn, PageHeader } from '../components/UI';

// ── SKD / Bill of Materials cost breakdown ────────────────────────────────────
const DEFAULT_SKD_COMPONENTS = [
  { id: 'body',      label: 'Body / Housing',        amount: 0 },
  { id: 'circuit',   label: 'Circuit / PCB',          amount: 0 },
  { id: 'chip',      label: 'LED Chip / Driver',      amount: 0 },
  { id: 'transport', label: 'Transportation / Freight',amount: 0 },
  { id: 'customs',   label: 'Customs / Clearance',    amount: 0 },
  { id: 'labor',     label: 'Labor / Assembly',       amount: 0 },
  { id: 'other',     label: 'Other',                  amount: 0 },
];

function SKDModal({ product, onClose, onSave }) {
  const [components, setComponents] = useState(
    product.skdComponents?.length
      ? product.skdComponents
      : DEFAULT_SKD_COMPONENTS.map(c => ({ ...c }))
  );
  const [customLines, setCustomLines] = useState(product.skdCustomLines || []);
  const [newLineLabel, setNewLineLabel] = useState('');

  const setAmount = (id, val) =>
    setComponents(cs => cs.map(c => c.id === id ? { ...c, amount: Number(val) || 0 } : c));

  const addCustomLine = () => {
    if (!newLineLabel.trim()) return;
    setCustomLines(cl => [...cl, { id: `custom-${Date.now()}`, label: newLineLabel.trim(), amount: 0 }]);
    setNewLineLabel('');
  };

  const setCustomAmount = (id, val) =>
    setCustomLines(cl => cl.map(c => c.id === id ? { ...c, amount: Number(val) || 0 } : c));

  const removeCustomLine = (id) => setCustomLines(cl => cl.filter(c => c.id !== id));

  const allLines = [...components, ...customLines];
  const totalCost = allLines.reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <Modal title={`⚙ Cost Breakdown — ${product.name}`} onClose={onClose} width={600}>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
        Break down the total landed cost per unit. This updates the product's average cost automatically.
      </div>

      {/* Standard components */}
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Cost components (per unit in ₨)
      </div>

      {components.map(c => (
        <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10, marginBottom: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{c.label}</div>
          <input
            type="number" min="0" value={c.amount || ''}
            onChange={e => setAmount(c.id, e.target.value)}
            placeholder="0"
            style={{ padding: '7px 10px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}
          />
        </div>
      ))}

      {/* Custom lines */}
      {customLines.length > 0 && (
        <>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 12, marginBottom: 8 }}>
            Custom lines
          </div>
          {customLines.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 30px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{c.label}</div>
              <input
                type="number" min="0" value={c.amount || ''}
                onChange={e => setCustomAmount(c.id, e.target.value)}
                placeholder="0"
                style={{ padding: '7px 10px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}
              />
              <button onClick={() => removeCustomLine(c.id)} style={{ color: 'var(--red)', background: 'var(--red-dim)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, height: 30 }}>×</button>
            </div>
          ))}
        </>
      )}

      {/* Add custom line */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 16 }}>
        <input
          value={newLineLabel}
          onChange={e => setNewLineLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustomLine()}
          placeholder="Add custom cost line (e.g. Packaging, Quality Check)..."
          style={{ flex: 1, padding: '7px 10px', background: 'var(--bg3)', border: '0.5px dashed var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}
        />
        <Btn variant="ghost" onClick={addCustomLine}>+ Add</Btn>
      </div>

      {/* Total */}
      <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total landed cost per unit</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)' }}>
              ₨{totalCost.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text2)' }}>
            <div>This will update the product's</div>
            <div>cost price to <strong style={{ color: 'var(--accent)' }}>₨{totalCost}</strong></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => onSave({ skdComponents: components, skdCustomLines: customLines, avgCost: totalCost })}>
          Save cost breakdown
        </Btn>
      </div>
    </Modal>
  );
}

// ── Main Inventory page ───────────────────────────────────────────────────────
export default function Inventory({ activeBrand }) {
  const { products, batches, categories, brands, suppliers, addProduct, editProduct, deleteProduct, addBatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showBatch, setShowBatch] = useState(null);
  const [showSKD, setShowSKD] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Always get fresh default brand/category so empty-after-reset doesn't break save
  const getEmptyForm = () => ({
    name: '',
    sku: '',
    brandId: brands[0]?.id || '',
    categoryId: categories[0]?.id || '',
    unit: 'pcs',
    sellingPrice: '',
    avgCost: '',
    stock: '',
  });

  const [form, setForm] = useState(getEmptyForm);
  const [formError, setFormError] = useState('');
  const [batchForm, setBatchForm] = useState({
    supplierId: suppliers[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    unitCost: '', qtyReceived: '', notes: '',
  });

  const filtered = products.filter(p => {
    const matchBrand = activeBrand === 'all' || p.brandId === activeBrand;
    const matchCat = catFilter === 'all' || p.categoryId === catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    return matchBrand && matchCat && matchSearch;
  });

  const openAdd = () => {
    setForm(getEmptyForm());
    setFormError('');
    setEditing(null);
    setShowAdd(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      brandId: p.brandId || brands[0]?.id || '',
      categoryId: p.categoryId || categories[0]?.id || '',
      unit: p.unit || 'pcs',
      sellingPrice: p.sellingPrice ?? '',
      avgCost: p.avgCost ?? '',
      stock: p.stock ?? '',
    });
    setFormError('');
    setEditing(p);
    setShowAdd(true);
  };

  const handleSave = () => {
    // Clear validation errors and check
    if (!form.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!form.brandId) {
      setFormError('Please select a brand. If no brands exist, add one first in Settings → Business Manager.');
      return;
    }
    setFormError('');

    const data = {
      ...form,
      sellingPrice: form.sellingPrice !== '' ? Number(form.sellingPrice) : 0,
      avgCost: form.avgCost !== '' ? Number(form.avgCost) : 0,
      stock: form.stock !== '' ? Number(form.stock) : 0,
    };

    if (editing) {
      editProduct(editing.id, data);
    } else {
      addProduct(data);
    }
    setShowAdd(false);
    setEditing(null);
  };

  const handleDelete = (p) => {
    if (confirmDelete === p.id) { deleteProduct(p.id); setConfirmDelete(null); }
    else { setConfirmDelete(p.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const handleSKDSave = (productId, skdData) => {
    editProduct(productId, skdData);
    setShowSKD(null);
  };

  const handleAddBatch = () => {
    if (!batchForm.unitCost || !batchForm.qtyReceived) return;
    addBatch({
      productId: showBatch.id,
      supplierId: batchForm.supplierId,
      purchase_date: batchForm.date,
      unitCost: Number(batchForm.unitCost),
      qtyReceived: Number(batchForm.qtyReceived),
      notes: batchForm.notes,
    });
    setBatchForm({
      supplierId: suppliers[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      unitCost: '', qtyReceived: '', notes: '',
    });
  };

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>{v}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.sku}</div>
      </div>
    )},
    { key: 'brand', label: 'Brand', render: (_, row) => {
      const b = brands.find(b => b.id === row.brandId);
      return <Badge color="accent">{b?.name || '—'}</Badge>;
    }},
    { key: 'category', label: 'Category', render: (_, row) => {
      const c = categories.find(c => c.id === row.categoryId);
      return <span style={{ color: 'var(--text2)', fontSize: 13 }}>{c?.icon} {c?.name || '—'}</span>;
    }},
    { key: 'stock', label: 'Total units', align: 'right', render: (v, row) => (
      <Badge color={(v || 0) < 100 ? 'red' : (v || 0) < 300 ? 'amber' : 'green'}>
        {v || 0} {row.unit}
      </Badge>
    )},
    { key: 'avgCost', label: 'Cost / unit', align: 'right', render: (v, row) => (
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: 'var(--text2)', fontSize: 12 }}>₨{v || 0}</div>
        {row.skdComponents && <div style={{ fontSize: 10, color: 'var(--accent)' }}>SKD ✓</div>}
      </div>
    )},
    { key: 'sellingPrice', label: 'Sell / unit', align: 'right', render: v => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--green)' }}>
        ₨{v || 0}
      </span>
    )},
    { key: 'totalValue', label: 'Total stock value', align: 'right', render: (_, row) => {
      const val = (row.stock || 0) * (row.sellingPrice || 0);
      return <span style={{ fontSize: 12, color: 'var(--text2)' }}>₨{val.toLocaleString()}</span>;
    }},
    { key: 'margin', label: 'Margin', align: 'right', render: (_, row) => {
      const cost = row.avgCost || 0;
      const sell = row.sellingPrice || 0;
      if (!cost || !sell) return <span style={{ color: 'var(--text3)' }}>—</span>;
      const pct = (((sell - cost) / cost) * 100).toFixed(0);
      return <Badge color={pct >= 20 ? 'green' : pct >= 10 ? 'amber' : 'red'}>{pct}%</Badge>;
    }},
    { key: 'batches', label: '', align: 'right', render: (_, row) => {
      const count = batches.filter(b => b.productId === row.id).length;
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={e => { e.stopPropagation(); setShowBatch(row); }} style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '3px 7px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>
            {count} batch{count !== 1 ? 'es' : ''}
          </button>
          <button onClick={e => { e.stopPropagation(); setShowSKD(row); }} title="Cost breakdown" style={{ fontSize: 11, color: 'var(--purple)', background: 'var(--purple-dim)', padding: '3px 7px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>
            ⚙ SKD
          </button>
        </div>
      );
    }},
    { key: 'actions', label: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
        <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>{confirmDelete === row.id ? 'Sure?' : 'Del'}</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Products, stock levels, pricing and cost breakdown" action={<Btn onClick={openAdd}>+ Add product</Btn>} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search products or SKU..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none' }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Category quick-filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(c => {
          const catProds = filtered.filter(p => p.categoryId === c.id);
          if (!catProds.length) return null;
          const totalUnits = catProds.reduce((s, p) => s + (p.stock || 0), 0);
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id === catFilter ? 'all' : c.id)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: catFilter === c.id ? 'var(--accent)' : 'var(--bg2)',
              color: catFilter === c.id ? '#fff' : 'var(--text2)',
              border: catFilter === c.id ? 'none' : '0.5px solid var(--border2)', cursor: 'pointer'
            }}>
              {c.icon} {c.name} <span style={{ opacity: 0.7 }}>({totalUnits} units)</span>
            </button>
          );
        })}
      </div>

      {brands.length === 0 && (
        <div style={{ background: 'var(--amber-dim)', border: '0.5px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--amber)' }}>
          ⚠ No brands found. Go to <strong>Settings → Business Manager → Brands</strong> and add at least one brand before adding products.
        </div>
      )}

      <Card style={{ padding: 0 }}>
        <Table columns={columns} data={filtered} />
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No products yet</div>
            <div style={{ fontSize: 13 }}>Click "+ Add product" to add your first product</div>
          </div>
        )}
      </Card>

      {/* ── Add / Edit product modal ── */}
      {showAdd && (
        <Modal
          title={editing ? `Edit — ${editing.name}` : 'Add new product'}
          onClose={() => { setShowAdd(false); setEditing(null); setFormError(''); }}
        >
          {/* Name + SKU */}
          <Input
            label="Product name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. 12W LED Bulb"
          />
          <Input
            label="SKU / Code (optional)"
            value={form.sku}
            onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
            placeholder="e.g. BRT-LED-12W"
          />

          {/* Brand + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Brand *</div>
              {brands.length === 0
                ? <div style={{ padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 12 }}>
                    No brands — add one in Settings first
                  </div>
                : <select value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                    <option value="">— select brand —</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
              }
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Category</div>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                <option value="">— no category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Unit + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Unit type"
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="pcs / roll / box / set"
            />
            <Input
              label="Total units in stock"
              type="number" min="0"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              placeholder="e.g. 1000"
            />
          </div>

          {/* Cost + Selling price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Cost price per unit (₨)"
              type="number" min="0"
              value={form.avgCost}
              onChange={e => setForm(f => ({ ...f, avgCost: e.target.value }))}
              placeholder="What you paid"
            />
            <Input
              label="Selling price per unit (₨)"
              type="number" min="0"
              value={form.sellingPrice}
              onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
              placeholder="What you charge"
            />
          </div>

          {/* Live totals preview */}
          {(form.stock || form.sellingPrice || form.avgCost) && (
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {form.stock && form.sellingPrice && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total stock value (selling)</div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>
                    ₨{(Number(form.stock) * Number(form.sellingPrice || 0)).toLocaleString()}
                  </div>
                </div>
              )}
              {form.stock && form.avgCost && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total cost value</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                    ₨{(Number(form.stock) * Number(form.avgCost || 0)).toLocaleString()}
                  </div>
                </div>
              )}
              {form.avgCost && form.sellingPrice && Number(form.avgCost) > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Margin per unit</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {(((Number(form.sellingPrice) - Number(form.avgCost)) / Number(form.avgCost)) * 100).toFixed(1)}%
                    &nbsp;(₨{(Number(form.sellingPrice) - Number(form.avgCost)).toLocaleString()})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation error */}
          {formError && (
            <div style={{ color: 'var(--red)', fontSize: 13, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
              ⚠ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); setFormError(''); }}>Cancel</Btn>
            <Btn onClick={handleSave} style={{ minWidth: 120 }}>
              {editing ? '✓ Save changes' : '✓ Add product'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Batch modal ── */}
      {showBatch && (
        <Modal title={`Batches — ${showBatch.name}`} onClose={() => setShowBatch(null)} width={660}>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, marginBottom: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Selling price: <strong style={{ color: 'var(--green)' }}>₨{showBatch.sellingPrice || 0}</strong></span>
            <span style={{ color: 'var(--text2)' }}>Avg cost: <strong>₨{showBatch.avgCost || 0}</strong></span>
            <span style={{ color: 'var(--text2)' }}>In stock: <strong>{showBatch.stock || 0} {showBatch.unit}</strong></span>
          </div>

          <Table columns={[
            { key: 'date', label: 'Date', render: (_, r) => r.purchase_date || r.date || '—' },
            { key: 'supplier', label: 'Supplier', render: (_, row) => suppliers.find(s => s.id === row.supplierId)?.name || '—' },
            { key: 'unitCost', label: 'Unit cost', align: 'right', render: v => `₨${v}` },
            { key: 'qtyReceived', label: 'Received', align: 'right' },
            { key: 'qtyRemaining', label: 'Remaining', align: 'right', render: v => <span style={{ fontWeight: 600, color: v === 0 ? 'var(--red)' : 'var(--green)' }}>{v}</span> },
            { key: 'totalCost', label: 'Batch value', align: 'right', render: (_, row) => `₨${((row.unitCost || 0) * (row.qtyReceived || 0)).toLocaleString()}` },
          ]} data={batches.filter(b => b.productId === showBatch.id)} />

          <div style={{ marginTop: 16, borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Add new batch (incoming stock)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Input label="Date" type="date" value={batchForm.date} onChange={e => setBatchForm(f => ({ ...f, date: e.target.value }))} />
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Supplier</div>
                <select value={batchForm.supplierId} onChange={e => setBatchForm(f => ({ ...f, supplierId: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                  {suppliers.length === 0 && <option value="">Add a supplier first</option>}
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <Input label="Unit cost (₨)" type="number" value={batchForm.unitCost} onChange={e => setBatchForm(f => ({ ...f, unitCost: e.target.value }))} placeholder="0" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Total units received" type="number" value={batchForm.qtyReceived} onChange={e => setBatchForm(f => ({ ...f, qtyReceived: e.target.value }))} placeholder="e.g. 1000" />
              <Input label="Notes (optional)" value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))} placeholder="Batch notes" />
            </div>
            {batchForm.unitCost && batchForm.qtyReceived && (
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text2)' }}>
                Total batch value: <strong style={{ color: 'var(--accent)' }}>₨{(Number(batchForm.unitCost) * Number(batchForm.qtyReceived)).toLocaleString()}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setShowBatch(null)}>Close</Btn>
              <Btn onClick={handleAddBatch}>Add batch & update stock</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── SKD / Cost breakdown modal ── */}
      {showSKD && (
        <SKDModal
          product={showSKD}
          onClose={() => setShowSKD(null)}
          onSave={(data) => handleSKDSave(showSKD.id, data)}
        />
      )}
    </div>
  );
}
