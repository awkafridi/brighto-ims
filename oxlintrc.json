import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Select, Btn, PageHeader } from '../components/UI';

const CATEGORIES = ['Rent','Salary','Shipping','Utilities','Marketing','Customs','Other'];
const catColor = { Rent:'purple', Salary:'accent', Shipping:'amber', Utilities:'green', Marketing:'red', Customs:'gray', Other:'gray' };

export default function Expenses({ activeBrand }) {
  const { expenses, brands, addExpense, editExpense, deleteExpense } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ brandId: brands[0]?.id || '', category: 'Rent', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });

  const filtered = activeBrand === 'all' ? expenses : expenses.filter(e => e.brandId === activeBrand);
  const byCategory = CATEGORIES.map(cat => ({ cat, total: filtered.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0);
  const grandTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => { setForm({ brandId: brands[0]?.id || '', category: 'Rent', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' }); setEditing(null); setShowAdd(true); };
  const openEdit = (e) => { setForm({ brandId: e.brandId, category: e.category, amount: e.amount, expense_date: e.date || e.expense_date, notes: e.notes || '' }); setEditing(e); setShowAdd(true); };

  const handleSave = () => {
    if (!form.amount) return;
    const data = { ...form, amount: Number(form.amount), date: form.expense_date };
    if (editing) editExpense(editing.id, data);
    else addExpense(data);
    setShowAdd(false); setEditing(null);
  };

  const handleDelete = (e) => {
    if (confirmDelete === e.id) { deleteExpense(e.id); setConfirmDelete(null); }
    else { setConfirmDelete(e.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Operating costs and overheads" action={<Btn onClick={openAdd}>+ Add expense</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 0 }}>
          <Table columns={[
            { key: 'date', label: 'Date', render: (_, r) => r.date || r.expense_date },
            { key: 'category', label: 'Category', render: v => <Badge color={catColor[v] || 'gray'}>{v}</Badge> },
            { key: 'brandId', label: 'Brand', render: v => { const b = brands.find(b => b.id === v); return <span style={{ fontSize: 12, color: 'var(--text2)' }}>{b?.name || '—'}</span>; } },
            { key: 'notes', label: 'Notes', muted: true },
            { key: 'amount', label: 'Amount', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--red)' }}>₨{Number(v).toLocaleString()}</strong> },
            { key: 'actions', label: '', align: 'right', render: (_, row) => (
              <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>{confirmDelete === row.id ? 'Sure?' : 'Del'}</button>
              </div>
            )},
          ]} data={filtered.sort((a, b) => new Date(b.date || b.expense_date) - new Date(a.date || a.expense_date))} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total expenses</div><div style={{ fontSize: 26, fontWeight: 700, color: 'var(--red)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{grandTotal.toLocaleString()}</div></Card>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>By category</div>
            {byCategory.map(({ cat, total }) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                <Badge color={catColor[cat] || 'gray'}>{cat}</Badge>
                <span style={{ fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>₨{total.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {showAdd && (
        <Modal title={editing ? 'Edit expense' : 'Add expense'} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Brand" value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Amount (₨)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
            <Input label="Date" type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
          </div>
          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief description..." />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Btn>
            <Btn onClick={handleSave}>{editing ? 'Save changes' : 'Add expense'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
