import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Btn, PageHeader } from '../components/UI';

// Built-in expense categories (cannot be deleted)
const BUILTIN_CATEGORIES = [
  { id: 'Rent',      label: 'Rent',              color: 'purple', icon: '🏠' },
  { id: 'Salary',    label: 'Salary / Wages',    color: 'accent', icon: '👤' },
  { id: 'Shipping',  label: 'Shipping / Freight',color: 'amber',  icon: '🚢' },
  { id: 'Utilities', label: 'Utilities',          color: 'green',  icon: '💡' },
  { id: 'Marketing', label: 'Marketing',          color: 'red',    icon: '📣' },
  { id: 'Customs',   label: 'Customs / Clearance',color:'gray',   icon: '🛃' },
];

// SKD / Manufacturing expense types — for LED bulb parts
const SKD_CATEGORIES = [
  { id: 'SKD-Body',      label: 'SKD – Body / Housing',         color: 'purple', icon: '⚙️' },
  { id: 'SKD-Circuit',   label: 'SKD – Circuit / PCB',          color: 'purple', icon: '🔌' },
  { id: 'SKD-Chip',      label: 'SKD – LED Chip / Driver',      color: 'purple', icon: '💎' },
  { id: 'SKD-Transport', label: 'SKD – Transportation',         color: 'amber',  icon: '🚛' },
  { id: 'SKD-Customs',   label: 'SKD – Customs / Import Duty',  color: 'amber',  icon: '🛃' },
  { id: 'SKD-Labor',     label: 'SKD – Labor / Assembly',       color: 'green',  icon: '🔧' },
  { id: 'SKD-Packaging', label: 'SKD – Packaging',              color: 'gray',   icon: '📦' },
  { id: 'SKD-QC',        label: 'SKD – Quality Check',          color: 'gray',   icon: '✅' },
  { id: 'SKD-Other',     label: 'SKD – Other Manufacturing',    color: 'gray',   icon: '🏭' },
];

const CAT_COLOR = {
  purple:'purple', accent:'accent', amber:'amber', green:'green', red:'red', gray:'gray'
};

const CUSTOM_CATS_KEY = 'ims_expense_custom_cats';

function loadCustomCats() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY) || '[]'); } catch { return []; }
}
function saveCustomCats(cats) {
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(cats));
}

export default function Expenses({ activeBrand }) {
  const { expenses, brands, addExpense, editExpense, deleteExpense } = useStore();

  const [customCats, setCustomCats] = useState(loadCustomCats);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [catFilter, setCatFilter] = useState('all');

  const [form, setForm] = useState({
    brandId: brands[0]?.id || '', category: 'Rent',
    amount: '', expense_date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [catForm, setCatForm] = useState({ label: '', icon: '📌', color: 'accent' });

  // All categories combined
  const allCategories = [
    ...BUILTIN_CATEGORIES,
    ...SKD_CATEGORIES,
    ...customCats,
  ];

  const filtered = (activeBrand === 'all' ? expenses : expenses.filter(e => e.brandId === activeBrand))
    .filter(e => catFilter === 'all' || e.category === catFilter)
    .sort((a, b) => new Date(b.date || b.expense_date) - new Date(a.date || a.expense_date));

  const grandTotal = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Totals per category for breakdown panel
  const byCategory = allCategories.map(c => ({
    ...c,
    total: filtered.filter(e => e.category === c.id).reduce((s, e) => s + Number(e.amount || 0), 0)
  })).filter(c => c.total > 0);

  const openAdd = () => {
    setForm({ brandId: brands[0]?.id || '', category: 'Rent', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
    setEditing(null);
    setShowAdd(true);
  };

  const openEdit = (e) => {
    setForm({ brandId: e.brandId, category: e.category, amount: e.amount, expense_date: e.date || e.expense_date, notes: e.notes || '' });
    setEditing(e);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.amount) return;
    const data = { ...form, amount: Number(form.amount), date: form.expense_date };
    if (editing) editExpense(editing.id, data);
    else addExpense(data);
    setShowAdd(false);
    setEditing(null);
  };

  const handleDelete = (e) => {
    if (confirmDelete === e.id) { deleteExpense(e.id); setConfirmDelete(null); }
    else { setConfirmDelete(e.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const handleAddCat = () => {
    if (!catForm.label.trim()) return;
    const id = `custom-${Date.now()}`;
    const newCat = { id, ...catForm };
    const updated = [...customCats, newCat];
    setCustomCats(updated);
    saveCustomCats(updated);
    setShowAddCat(false);
    setCatForm({ label: '', icon: '📌', color: 'accent' });
  };

  const handleDeleteCat = (id) => {
    const updated = customCats.filter(c => c.id !== id);
    setCustomCats(updated);
    saveCustomCats(updated);
  };

  const getCatInfo = (catId) => allCategories.find(c => c.id === catId) || { label: catId, color: 'gray', icon: '📌' };

  const ICONS = ['📌','🏭','💰','🚗','📱','🖥️','🔑','📊','🎯','⚡','🌐','🛠️','💼','🏗️'];
  const COLORS = ['accent','green','amber','red','purple','gray'];

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Operating costs, overheads and SKD manufacturing expenses"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" onClick={() => setShowAddCat(true)}>+ Category</Btn>
            <Btn onClick={openAdd}>+ Add expense</Btn>
          </div>
        }
      />

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setCatFilter('all')} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: catFilter === 'all' ? 'var(--accent)' : 'var(--bg2)', color: catFilter === 'all' ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer' }}>
          All
        </button>
        {allCategories.map(c => {
          const count = filtered.filter(e => e.category === c.id).length;
          if (count === 0 && catFilter !== c.id) return null;
          return (
            <button key={c.id} onClick={() => setCatFilter(catFilter === c.id ? 'all' : c.id)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
              background: catFilter === c.id ? 'var(--accent)' : 'var(--bg2)',
              color: catFilter === c.id ? '#fff' : 'var(--text2)',
              border: '0.5px solid var(--border2)', cursor: 'pointer'
            }}>
              {c.icon} {c.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

        {/* Expense list */}
        <Card style={{ padding: 0 }}>
          <Table columns={[
            { key: 'date', label: 'Date', render: (_, r) => r.date || r.expense_date },
            { key: 'category', label: 'Category', render: v => {
              const c = getCatInfo(v);
              return <Badge color={c.color || 'gray'}>{c.icon} {c.label}</Badge>;
            }},
            { key: 'brandId', label: 'Brand', render: v => { const b = brands.find(b => b.id === v); return <span style={{ fontSize: 12, color: 'var(--text2)' }}>{b?.name || '—'}</span>; } },
            { key: 'notes', label: 'Notes', muted: true, render: v => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
            { key: 'amount', label: 'Amount', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--red)' }}>₨{Number(v || 0).toLocaleString()}</strong> },
            { key: 'actions', label: '', align: 'right', render: (_, row) => (
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>
                  {confirmDelete === row.id ? 'Sure?' : 'Del'}
                </button>
              </div>
            )},
          ]} data={filtered} />
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💸</div>
              <div>No expenses yet. Click "+ Add expense" to start.</div>
            </div>
          )}
        </Card>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total expenses</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--red)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{grandTotal.toLocaleString()}</div>
          </Card>

          {/* Breakdown by category */}
          {byCategory.length > 0 && (
            <Card>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>By category</div>
              {byCategory.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <Badge color={c.color || 'gray'}>{c.icon} {c.label}</Badge>
                  <span style={{ fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>₨{c.total.toLocaleString()}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Custom categories management */}
          {customCats.length > 0 && (
            <Card>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Custom categories</div>
              {customCats.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>{c.icon} {c.label}</span>
                  <button onClick={() => handleDeleteCat(c.id)} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Add / Edit expense modal */}
      {showAdd && (
        <Modal title={editing ? 'Edit expense' : 'Add expense'} onClose={() => { setShowAdd(false); setEditing(null); }}>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Category</div>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>

              <optgroup label="── General Operating ──">
                {BUILTIN_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </optgroup>

              <optgroup label="── SKD / Manufacturing ──">
                {SKD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </optgroup>

              {customCats.length > 0 && (
                <optgroup label="── Custom ──">
                  {customCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Brand</div>
            <select value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Amount (₨)" type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
            <Input label="Date" type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
          </div>
          <Input label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief description..." />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Btn>
            <Btn onClick={handleSave}>{editing ? 'Save changes' : 'Add expense'}</Btn>
          </div>
        </Modal>
      )}

      {/* Add custom category modal */}
      {showAddCat && (
        <Modal title="+ Add custom expense category" onClose={() => setShowAddCat(false)} width={440}>
          <Input label="Category name *" value={catForm.label} onChange={e => setCatForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Vehicle Maintenance" />

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Icon</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setCatForm(f => ({ ...f, icon: ic }))} style={{
                  width: 36, height: 36, fontSize: 18, borderRadius: 8, border: catForm.icon === ic ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: catForm.icon === ic ? 'var(--accent-dim)' : 'var(--bg3)', cursor: 'pointer'
                }}>{ic}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Badge colour</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(col => (
                <button key={col} onClick={() => setCatForm(f => ({ ...f, color: col }))} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, border: catForm.color === col ? '2px solid white' : '1px solid transparent',
                  background: `var(--${col === 'gray' ? 'bg3' : col + '-dim'})`,
                  color: `var(--${col === 'gray' ? 'text2' : col})`, cursor: 'pointer', fontWeight: catForm.color === col ? 700 : 400,
                  outline: catForm.color === col ? '2px solid var(--accent)' : 'none', outlineOffset: 2,
                }}>{col}</button>
              ))}
            </div>
          </div>

          {catForm.label && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Preview:</div>
              <Badge color={catForm.color || 'gray'}>{catForm.icon} {catForm.label}</Badge>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setShowAddCat(false)}>Cancel</Btn>
            <Btn onClick={handleAddCat}>Add category</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
