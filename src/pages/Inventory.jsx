import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Select, Btn, PageHeader } from '../components/UI';

export default function Inventory({ activeBrand }) {
  const { products, batches, categories, brands, suppliers, addProduct, editProduct, deleteProduct, addBatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showBatch, setShowBatch] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', brandId: brands[0]?.id || '', categoryId: categories[0]?.id || '', unit: 'pcs' });
  const [batchForm, setBatchForm] = useState({ supplierId: suppliers[0]?.id || '', date: new Date().toISOString().split('T')[0], unitCost: '', qtyReceived: '', notes: '' });

  const filtered = products.filter(p => {
    const matchBrand = activeBrand === 'all' || p.brandId === activeBrand;
    const matchCat = catFilter === 'all' || p.categoryId === catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    return matchBrand && matchCat && matchSearch;
  });

  const openAdd = () => { setForm({ name: '', sku: '', brandId: brands[0]?.id || '', categoryId: categories[0]?.id || '', unit: 'pcs' }); setEditing(null); setShowAdd(true); };
  const openEdit = (p) => { setForm({ name: p.name, sku: p.sku, brandId: p.brandId, categoryId: p.categoryId, unit: p.unit }); setEditing(p); setShowAdd(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) editProduct(editing.id, form);
    else addProduct(form);
    setShowAdd(false); setEditing(null);
  };

  const handleDelete = (p) => {
    if (confirmDelete === p.id) { deleteProduct(p.id); setConfirmDelete(null); }
    else { setConfirmDelete(p.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const handleAddBatch = () => {
    if (!batchForm.unitCost || !batchForm.qtyReceived) return;
    addBatch({ productId: showBatch.id, supplierId: batchForm.supplierId, purchase_date: batchForm.date, unitCost: Number(batchForm.unitCost), qtyReceived: Number(batchForm.qtyReceived), notes: batchForm.notes });
    setBatchForm({ supplierId: suppliers[0]?.id || '', date: new Date().toISOString().split('T')[0], unitCost: '', qtyReceived: '', notes: '' });
  };

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => (<div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.sku}</div></div>) },
    { key: 'brand', label: 'Brand', render: (_, row) => { const b = brands.find(b => b.id === row.brandId); return <Badge color={row.brandId === 'b1' ? 'accent' : 'purple'}>{b?.name || '—'}</Badge>; } },
    { key: 'category', label: 'Category', render: (_, row) => { const c = categories.find(c => c.id === row.categoryId); return <span style={{ color: 'var(--text2)', fontSize: 13 }}>{c?.icon} {c?.name}</span>; } },
    { key: 'stock', label: 'In stock', align: 'right', render: (v, row) => <Badge color={v < 100 ? 'red' : v < 300 ? 'amber' : 'green'}>{v} {row.unit}</Badge> },
    { key: 'avgCost', label: 'Avg cost', align: 'right', render: v => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>₨{v}</span> },
    { key: 'batches', label: 'Batches', align: 'right', render: (_, row) => {
      const count = batches.filter(b => b.productId === row.id).length;
      return <button onClick={e => { e.stopPropagation(); setShowBatch(row); }} style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '3px 8px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>{count} batch{count !== 1 ? 'es' : ''}</button>;
    }},
    { key: 'actions', label: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
        <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>{confirmDelete === row.id ? 'Sure?' : 'Del'}</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Products, stock levels, and batch cost tracking" action={<Btn onClick={openAdd}>+ Add product</Btn>} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Search products or SKU..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(c => {
          const catProds = filtered.filter(p => p.categoryId === c.id);
          if (!catProds.length) return null;
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id === catFilter ? 'all' : c.id)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: catFilter === c.id ? 'var(--accent)' : 'var(--bg2)', color: catFilter === c.id ? '#fff' : 'var(--text2)', border: catFilter === c.id ? 'none' : '0.5px solid var(--border2)', cursor: 'pointer' }}>
              {c.icon} {c.name} <span style={{ opacity: 0.7 }}>({catProds.reduce((s, p) => s + p.stock, 0)})</span>
            </button>
          );
        })}
      </div>

      <Card style={{ padding: 0 }}><Table columns={columns} data={filtered} /></Card>

      {showAdd && (
        <Modal title={editing ? 'Edit product' : 'Add product'} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <Input label="Product name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 12W LED Bulb" />
          <Input label="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. BRT-LED-12W" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Brand" value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Select label="Category" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
          </div>
          <Input label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs / roll / box" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Btn>
            <Btn onClick={handleSave}>{editing ? 'Save changes' : 'Add product'}</Btn>
          </div>
        </Modal>
      )}

      {showBatch && (
        <Modal title={`Batches — ${showBatch.name}`} onClose={() => setShowBatch(null)} width={640}>
          <Table columns={[
            { key: 'date', label: 'Date', render: (_, r) => r.purchase_date || r.date || '—' },
            { key: 'supplier', label: 'Supplier', render: (_, row) => suppliers.find(s => s.id === row.supplierId)?.name || '—' },
            { key: 'unitCost', label: 'Unit cost', align: 'right', render: v => `₨${v}` },
            { key: 'qtyReceived', label: 'Received', align: 'right' },
            { key: 'qtyRemaining', label: 'Remaining', align: 'right', render: v => <span style={{ fontWeight: 600, color: v === 0 ? 'var(--red)' : 'var(--green)' }}>{v}</span> },
          ]} data={batches.filter(b => b.productId === showBatch.id)} />

          <div style={{ marginTop: 16, borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Add new batch</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Input label="Date" type="date" value={batchForm.date} onChange={e => setBatchForm(f => ({ ...f, date: e.target.value }))} />
              <Select label="Supplier" value={batchForm.supplierId} onChange={e => setBatchForm(f => ({ ...f, supplierId: e.target.value }))}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Input label="Unit cost (₨)" type="number" value={batchForm.unitCost} onChange={e => setBatchForm(f => ({ ...f, unitCost: e.target.value }))} placeholder="0" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Qty received" type="number" value={batchForm.qtyReceived} onChange={e => setBatchForm(f => ({ ...f, qtyReceived: e.target.value }))} placeholder="0" />
              <Input label="Notes" value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setShowBatch(null)}>Close</Btn>
              <Btn onClick={handleAddBatch}>Add batch</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
