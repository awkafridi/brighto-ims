import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Btn, PageHeader } from '../components/UI';

export default function Suppliers() {
  const { suppliers, batches, products, addSupplier, editSupplier, deleteSupplier } = useStore();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', country: 'Pakistan', contact: '', phone: '', email: '' });

  const openAdd = () => { setForm({ name: '', country: 'Pakistan', contact: '', phone: '', email: '' }); setEditing(null); setShowAdd(true); };
  const openEdit = (s) => { setForm({ name: s.name, country: s.country, contact: s.contact, phone: s.phone, email: s.email || '' }); setEditing(s); setShowAdd(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) editSupplier(editing.id, form);
    else addSupplier(form);
    setShowAdd(false); setEditing(null);
  };

  const handleDelete = (s) => {
    if (confirmDelete === s.id) { deleteSupplier(s.id); setConfirmDelete(null); }
    else { setConfirmDelete(s.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="International and local supplier directory" action={<Btn onClick={openAdd}>+ Add supplier</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total suppliers</div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{suppliers.length}</div></Card>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total outstanding</div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{suppliers.reduce((s, sup) => s + ((sup.totalOwed || 0) - (sup.totalPaid || 0)), 0).toLocaleString()}</div></Card>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total paid to date</div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{suppliers.reduce((s, sup) => s + (sup.totalPaid || 0), 0).toLocaleString()}</div></Card>
      </div>

      <Card style={{ padding: 0 }}>
        <Table onRowClick={setSelected} columns={[
          { key: 'name', label: 'Supplier', render: (v, row) => (<div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.contact} · {row.phone}</div></div>) },
          { key: 'country', label: 'Country', render: v => <Badge color={v === 'China' ? 'red' : 'green'}>{v === 'China' ? '🇨🇳' : '🇵🇰'} {v}</Badge> },
          { key: 'totalOwed', label: 'Invoiced', align: 'right', render: v => `₨${(v || 0).toLocaleString()}` },
          { key: 'totalPaid', label: 'Paid', align: 'right', render: v => <span style={{ color: 'var(--green)' }}>₨{(v || 0).toLocaleString()}</span> },
          { key: 'remaining', label: 'Remaining', align: 'right', render: (_, row) => { const rem = (row.totalOwed || 0) - (row.totalPaid || 0); return <strong style={{ color: rem > 0 ? 'var(--red)' : 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{rem.toLocaleString()}</strong>; } },
          { key: 'actions', label: '', align: 'right', render: (_, row) => (
            <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>{confirmDelete === row.id ? 'Sure?' : 'Del'}</button>
            </div>
          )},
        ]} data={suppliers} />
      </Card>

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} width={640}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text3)' }}>Invoiced</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>₨{(selected.totalOwed || 0).toLocaleString()}</div></div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text3)' }}>Paid</div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{(selected.totalPaid || 0).toLocaleString()}</div></div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text3)' }}>Remaining</div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{((selected.totalOwed || 0) - (selected.totalPaid || 0)).toLocaleString()}</div></div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Purchase batches</div>
          <Table columns={[
            { key: 'product', label: 'Product', render: (_, row) => products.find(p => p.id === row.productId)?.name || row.productId },
            { key: 'date', label: 'Date', render: (_, r) => r.purchase_date || r.date || '—' },
            { key: 'unitCost', label: 'Unit cost', align: 'right', render: v => `₨${v}` },
            { key: 'qtyReceived', label: 'Qty', align: 'right' },
            { key: 'qtyRemaining', label: 'Stock left', align: 'right', render: v => <span style={{ color: v === 0 ? 'var(--red)' : 'var(--green)' }}>{v}</span> },
          ]} data={batches.filter(b => b.supplierId === selected.id)} />
        </Modal>
      )}

      {showAdd && (
        <Modal title={editing ? 'Edit supplier' : 'Add supplier'} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <Input label="Supplier / company name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Guangzhou Lighting Co." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="China / Pakistan" />
            <Input label="Contact person" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Full name" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92-..." />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="supplier@email.com" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Btn>
            <Btn onClick={handleSave}>{editing ? 'Save changes' : 'Add supplier'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
