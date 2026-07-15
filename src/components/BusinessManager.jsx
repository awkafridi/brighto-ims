import { useState } from 'react';
import { useStore } from '../data/store';
import { Card, Modal, Input, Btn, PageHeader, Badge } from './UI';

const BRAND_COLORS = ['#4f8ef7','#a78bfa','#34d399','#fbbf24','#f87171','#fb923c','#e879f9','#38bdf8'];
const CAT_ICONS = ['💡','🔆','🔌','🔧','📦','🔋','💻','🏭','⚡','🔩','🛠️','📡'];

export function BusinessManager({ onClose }) {
  const { brands, categories, addBrand, editBrand, deleteBrand, addCategory, editCategory, deleteCategory } = useStore();
  const [tab, setTab] = useState('brands');
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: '', color: BRAND_COLORS[0] });
  const [catForm, setCatForm] = useState({ name: '', icon: '💡' });
  const [formError, setFormError] = useState('');

  const saveBrand = () => {
    if (!brandForm.name.trim()) {
      setFormError('Brand name is required.');
      return;
    }
    // Prevent duplicate brand names (case-insensitive), excluding the one being edited
    const dup = brands.some(b =>
      b.name.trim().toLowerCase() === brandForm.name.trim().toLowerCase() &&
      b.id !== editingBrand?.id
    );
    if (dup) {
      setFormError('A brand with this name already exists.');
      return;
    }
    setFormError('');
    if (editingBrand) {
      editBrand(editingBrand.id, brandForm);
      setEditingBrand(null);
    } else {
      addBrand(brandForm);
      setShowAddBrand(false);
    }
    setBrandForm({ name: '', color: BRAND_COLORS[0] });
  };

  const saveCat = () => {
    if (!catForm.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    const dup = categories.some(c =>
      c.name.trim().toLowerCase() === catForm.name.trim().toLowerCase() &&
      c.id !== editingCat?.id
    );
    if (dup) {
      setFormError('A category with this name already exists.');
      return;
    }
    setFormError('');
    if (editingCat) {
      editCategory(editingCat.id, catForm);
      setEditingCat(null);
    } else {
      addCategory(catForm);
      setShowAddCat(false);
    }
    setCatForm({ name: '', icon: '💡' });
  };

  const startEditBrand = (b) => { setEditingBrand(b); setBrandForm({ name: b.name, color: b.color }); setFormError(''); };
  const startEditCat = (c) => { setEditingCat(c); setCatForm({ name: c.name, icon: c.icon }); setFormError(''); };

  return (
    <Modal title="🏢 Business Names & Categories" onClose={onClose} width={680}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['brands', 'categories'].map(t => (
          <button key={t} onClick={() => { setTab(t); setFormError(''); }} style={{
            padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            background: tab === t ? 'var(--accent)' : 'var(--bg3)',
            color: tab === t ? '#fff' : 'var(--text2)',
            border: 'none', cursor: 'pointer', textTransform: 'capitalize'
          }}>{t}</button>
        ))}
      </div>

      {/* Brands tab */}
      {tab === 'brands' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {brands.map(b => (
              <div key={b.id} style={{
                background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: b.color + '25', border: `2px solid ${b.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: b.color }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.color}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEditBrand(b)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteBrand(b.id)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>Del</button>
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={() => { setShowAddBrand(true); setFormError(''); }}>+ Add brand</Btn>

          {(showAddBrand || editingBrand) && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border2)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>{editingBrand ? 'Edit brand' : 'New brand'}</div>
              <Input label="Brand name" value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Brighto" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Brand color</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {BRAND_COLORS.map(c => (
                    <button key={c} onClick={() => setBrandForm(f => ({ ...f, color: c }))} style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, border: brandForm.color === c ? '3px solid white' : '2px solid transparent',
                      cursor: 'pointer', outline: brandForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2
                    }} />
                  ))}
                </div>
              </div>
              {formError && (
                <div style={{ color: 'var(--red)', fontSize: 13, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
                  ⚠ {formError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => { setShowAddBrand(false); setEditingBrand(null); setBrandForm({ name: '', color: BRAND_COLORS[0] }); setFormError(''); }}>Cancel</Btn>
                <Btn onClick={saveBrand}>{editingBrand ? 'Save changes' : 'Add brand'}</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {categories.map(c => (
              <div key={c.id} style={{
                background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEditCat(c)} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>✎</button>
                  <button onClick={() => deleteCategory(c.id)} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={() => { setShowAddCat(true); setFormError(''); }}>+ Add category</Btn>

          {(showAddCat || editingCat) && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border2)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>{editingCat ? 'Edit category' : 'New category'}</div>
              <Input label="Category name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. LED Bulbs" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Icon</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CAT_ICONS.map(ic => (
                    <button key={ic} onClick={() => setCatForm(f => ({ ...f, icon: ic }))} style={{
                      width: 36, height: 36, borderRadius: 8, fontSize: 18, border: catForm.icon === ic ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: catForm.icon === ic ? 'var(--accent-dim)' : 'var(--bg)', cursor: 'pointer'
                    }}>{ic}</button>
                  ))}
                </div>
              </div>
              {formError && (
                <div style={{ color: 'var(--red)', fontSize: 13, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
                  ⚠ {formError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => { setShowAddCat(false); setEditingCat(null); setCatForm({ name: '', icon: '💡' }); setFormError(''); }}>Cancel</Btn>
                <Btn onClick={saveCat}>{editingCat ? 'Save changes' : 'Add category'}</Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
