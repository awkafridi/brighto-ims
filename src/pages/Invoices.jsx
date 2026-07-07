import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Btn, PageHeader } from '../components/UI';
import { useAudio } from '../hooks/useAudio';
import { openWhatsApp, buildPurchaseMessage } from '../utils/whatsapp';

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' };

function getUser() {
  try { return JSON.parse(localStorage.getItem('ims_user') || '{}'); } catch { return {}; }
}

// Resolve a productId (which may be a variant id) to display name
function resolveProductName(productId, products) {
  const main = products.find(p => p.id === productId);
  if (main) return main.name;
  for (const p of products) {
    const v = (p.variants || []).find(v => v.id === productId);
    if (v) return `${p.name} – ${v.name}`;
  }
  return productId || '—';
}

// Resolve productId to its selling price (variant or parent)
function resolveSellingPrice(productId, products) {
  const main = products.find(p => p.id === productId);
  if (main) return main.sellingPrice || Math.round((main.avgCost || 0) * 1.35);
  for (const p of products) {
    const v = (p.variants || []).find(v => v.id === productId);
    if (v) return v.sellingPrice || p.sellingPrice || Math.round((p.avgCost || 0) * 1.35);
  }
  return 0;
}

// Product line dropdown — native select with main + variant optgroups
function ProductDropdown({ value, onChange, products, categories, categoryFilter, activeBrand }) {
  const filtered = products.filter(p =>
    (activeBrand === 'all' || p.brandId === activeBrand) &&
    (categoryFilter === 'all' || p.categoryId === categoryFilter)
  );

  return (
    <select value={value} onChange={onChange} style={{
      width: '100%', padding: '8px 10px', background: 'var(--bg3)',
      border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
      color: 'var(--text)', outline: 'none', fontSize: 13, cursor: 'pointer',
    }}>
      <option value="">— select product —</option>
      {filtered.length === 0 && <option disabled>No products — add in Inventory first</option>}
      {categories.map(cat => {
        const catProds = filtered.filter(p => p.categoryId === cat.id);
        if (!catProds.length) return null;
        return (
          <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
            {catProds.map(p => {
              const variants = p.variants || [];
              return (
                <optgroup key={p.id} label={`  📦 ${p.name} — ₨${p.sellingPrice || 0}`}>
                  <option value={p.id}>
                    ↳ {p.name} (general) — ₨{p.sellingPrice || 0} | stock: {p.stock || 0}
                  </option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>
                      ↳ {v.name} — ₨{v.sellingPrice || p.sellingPrice || 0} | stock: {v.stock || 0}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </optgroup>
        );
      })}
      {/* Products without a category */}
      {filtered.filter(p => !categories.find(c => c.id === p.categoryId)).map(p => (
        <optgroup key={p.id} label={`📦 ${p.name}`}>
          <option value={p.id}>↳ {p.name} — ₨{p.sellingPrice || 0}</option>
          {(p.variants || []).map(v => (
            <option key={v.id} value={v.id}>
              ↳ {v.name} — ₨{v.sellingPrice || p.sellingPrice || 0}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function Invoices({ activeBrand }) {
  const { invoices, shopkeepers, products, brands, categories, addInvoice, editInvoice, deleteInvoice } = useStore();
  const { speakInvoice } = useAudio();
  const currentUser = getUser();
  const isAdmin = currentUser.role === 'Owner' || currentUser.username === 'admin';

  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingInv, setEditingInv] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [audioLang, setAudioLang] = useState('en');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingWhatsApp, setPendingWhatsApp] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [lines, setLines] = useState([{ productId: '', qty: 1, unitPrice: 0 }]);
  const [invForm, setInvForm] = useState({
    shopkeeperId: '', guestName: '', isGuest: false,
    brandId: brands[0]?.id || '',
    date: new Date().toISOString().split('T')[0], notes: ''
  });

  const filtered = invoices.filter(inv => {
    const matchBrand = activeBrand === 'all' || inv.brandId === activeBrand;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchBrand && matchStatus;
  });

  // Shopkeeper history reminder
  const shopkeeperHistory = useMemo(() => {
    if (invForm.isGuest || !invForm.shopkeeperId) return null;
    const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
    if (!sk) return null;
    const skInvoices = invoices.filter(i => i.shopkeeperId === sk.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return {
      shopkeeper: sk,
      totalPurchased: skInvoices.reduce((s, i) => s + i.total, 0),
      currentBalance: sk.balance,
      lastInvoice: skInvoices[0] || null,
      invoiceCount: skInvoices.length,
    };
  }, [invForm.shopkeeperId, invForm.isGuest, shopkeepers, invoices]);

  const addLine = () => setLines(l => [...l, { productId: '', qty: 1, unitPrice: 0 }]);
  const removeLine = i => setLines(l => l.filter((_, idx) => idx !== i));

  const updateLine = (i, field, val) => {
    setLines(prev => {
      const updated = prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
      if (field === 'productId' && val) {
        updated[i].unitPrice = resolveSellingPrice(val, products);
      }
      return updated;
    });
  };

  const lineTotal = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unitPrice)), 0);

  const resetForm = () => {
    setLines([{ productId: '', qty: 1, unitPrice: 0 }]);
    setInvForm({ shopkeeperId: '', guestName: '', isGuest: false, brandId: brands[0]?.id || '', date: new Date().toISOString().split('T')[0], notes: '' });
    setCategoryFilter('all');
  };

  const handleCreate = () => {
    const customerOk = invForm.isGuest ? invForm.guestName.trim() : invForm.shopkeeperId;
    if (!customerOk) return;
    const validLines = lines.filter(l => l.productId && l.qty > 0);
    if (validLines.length === 0) return;

    const invoiceData = {
      ...invForm,
      customerName: invForm.isGuest ? invForm.guestName : shopkeepers.find(s => s.id === invForm.shopkeeperId)?.shopName,
      items: validLines,
    };
    addInvoice(invoiceData);

    // WhatsApp only for registered shopkeepers
    if (!invForm.isGuest) {
      const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
      const brand = brands.find(b => b.id === invForm.brandId);
      if (sk?.phone) {
        const previousBalance = sk.balance;
        const newBalance = previousBalance + lineTotal;
        const productNames = validLines.map(l => resolveProductName(l.productId, products));
        const message = buildPurchaseMessage({
          shopName: sk.shopName, brandName: brand?.name,
          items: validLines, productNames, total: lineTotal,
          previousBalance, newBalance, date: invForm.date,
        });
        setPendingWhatsApp({ phone: sk.phone, message, shopName: sk.shopName });
      }
    }

    setShowNew(false);
    resetForm();
  };

  const handleDeleteInvoice = (inv) => {
    if (!isAdmin) return;
    if (confirmDelete === inv.id) {
      deleteInvoice(inv.id);
      setConfirmDelete(null);
      setSelected(null);
    } else {
      setConfirmDelete(inv.id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const customerLabel = (inv) => {
    if (inv.isGuest) return `👤 ${inv.guestName || inv.customerName || 'Guest'}`;
    return shopkeepers.find(s => s.id === inv.shopkeeperId)?.shopName || inv.customerName || '—';
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Sales invoices and billing records"
        action={<Btn onClick={() => setShowNew(true)}>+ New invoice</Btn>}
      />

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'unpaid', 'partial', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: statusFilter === s ? 'var(--accent)' : 'var(--bg2)',
            color: statusFilter === s ? '#fff' : 'var(--text2)',
            border: statusFilter === s ? 'none' : '0.5px solid var(--border2)',
            cursor: 'pointer', textTransform: 'capitalize'
          }}>
            {s === 'all' ? `All (${invoices.length})` : `${s} (${invoices.filter(i => i.status === s && (activeBrand === 'all' || i.brandId === activeBrand)).length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>
          Total: <strong style={{ color: 'var(--text)', marginLeft: 6 }}>₨{filtered.reduce((s, i) => s + i.total, 0).toLocaleString()}</strong>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <Table onRowClick={setSelected} columns={[
          { key: 'id', label: 'Invoice #', render: v => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.slice(-8).toUpperCase()}</span> },
          { key: 'customer', label: 'Customer', render: (_, row) => (
            <div>
              <div style={{ fontWeight: 500 }}>{customerLabel(row)}</div>
              {row.isGuest && <div style={{ fontSize: 10, color: 'var(--amber)' }}>Guest / walk-in</div>}
            </div>
          )},
          { key: 'brandId', label: 'Brand', render: v => { const b = brands.find(b => b.id === v); return <Badge color="accent">{b?.name || v}</Badge>; } },
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Amount', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>₨{v.toLocaleString()}</strong> },
          { key: 'status', label: 'Status', align: 'right', render: v => <Badge color={statusColor[v]}>{v}</Badge> },
          { key: 'actions', label: '', align: 'right', render: (_, row) => (
            <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
              {row.status !== 'paid' && (
                <button onClick={() => editInvoice(row.id, { status: 'paid' })} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer' }}>
                  Mark paid
                </button>
              )}
              {isAdmin && (
                <button onClick={() => handleDeleteInvoice(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>
                  {confirmDelete === row.id ? 'Sure?' : 'Del'}
                </button>
              )}
            </div>
          )},
        ]} data={filtered} />
      </Card>

      {/* Invoice detail modal */}
      {selected && (
        <Modal title={`Invoice ${selected.id.slice(-8).toUpperCase()}`} onClose={() => setSelected(null)} width={660}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{customerLabel(selected)}</div>
              {selected.isGuest && <Badge color="amber">Guest</Badge>}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Date</div>
              <div style={{ fontWeight: 600 }}>{selected.date}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Status</div>
              <Badge color={statusColor[selected.status]}>{selected.status}</Badge>
            </div>
          </div>

          <Table columns={[
            { key: 'product', label: 'Product', render: (_, row) => resolveProductName(row.productId, products) },
            { key: 'cat', label: 'Category', render: (_, row) => {
              const p = products.find(p => p.id === row.productId || (p.variants || []).some(v => v.id === row.productId));
              const c = categories.find(c => c.id === p?.categoryId);
              return c ? <span style={{ fontSize: 12 }}>{c.icon} {c.name}</span> : '—';
            }},
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unitPrice', label: 'Unit ₨', align: 'right', render: v => `₨${v}` },
            { key: 'total', label: 'Total', align: 'right', render: (_, row) => <strong>₨{(row.qty * row.unitPrice).toLocaleString()}</strong> },
          ]} data={selected.items || []} />

          {/* Admin-only edit controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '0.5px solid var(--border)', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={audioLang} onChange={e => setAudioLang(e.target.value)} style={{ padding: '5px 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12 }}>
                <option value="en">🇬🇧 EN</option>
                <option value="ur">🇵🇰 UR</option>
              </select>
              <Btn variant="ghost" onClick={() => speakInvoice(selected, shopkeepers.find(s => s.id === selected.shopkeeperId), audioLang)}>🔊 Read</Btn>
              {selected.status !== 'paid' && (
                <Btn variant="ghost" onClick={() => { editInvoice(selected.id, { status: 'paid' }); setSelected(null); }}>✓ Mark paid</Btn>
              )}
              {selected.status !== 'partial' && selected.status !== 'paid' && (
                <Btn variant="ghost" onClick={() => { editInvoice(selected.id, { status: 'partial' }); setSelected(null); }}>½ Partial</Btn>
              )}
              {isAdmin && (
                <Btn variant="danger" onClick={() => handleDeleteInvoice(selected)}>
                  {confirmDelete === selected.id ? '⚠ Confirm delete' : '🗑 Delete (admin)'}
                </Btn>
              )}
              {!isAdmin && <span style={{ fontSize: 11, color: 'var(--text3)' }}>🔒 Edit/delete requires admin login</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Grand total</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)' }}>₨{selected.total.toLocaleString()}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* New invoice modal */}
      {showNew && (
        <Modal title="New invoice" onClose={() => { setShowNew(false); resetForm(); }} width={740}>

          {/* Customer type toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button onClick={() => setInvForm(f => ({ ...f, isGuest: false }))} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: !invForm.isGuest ? 'var(--accent)' : 'var(--bg3)',
              color: !invForm.isGuest ? '#fff' : 'var(--text2)',
              border: 'none', cursor: 'pointer'
            }}>🏪 Registered shopkeeper</button>
            <button onClick={() => setInvForm(f => ({ ...f, isGuest: true, shopkeeperId: '' }))} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: invForm.isGuest ? 'var(--amber)' : 'var(--bg3)',
              color: invForm.isGuest ? '#fff' : 'var(--text2)',
              border: 'none', cursor: 'pointer'
            }}>👤 Guest / walk-in customer</button>
          </div>

          {/* Customer selection */}
          {invForm.isGuest ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Customer name (optional)</div>
              <input
                value={invForm.guestName}
                onChange={e => setInvForm(f => ({ ...f, guestName: e.target.value }))}
                placeholder="e.g. Walk-in customer / Ahmed"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}
              />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Guest invoices don't affect any ledger balance. Leave name blank for anonymous cash sales.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Customer *</div>
              <select value={invForm.shopkeeperId} onChange={e => setInvForm(f => ({ ...f, shopkeeperId: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                <option value="">Select shopkeeper...</option>
                {shopkeepers.map(s => <option key={s.id} value={s.id}>{s.shopName} — {s.owner} {s.balance > 0 ? `(bal: ₨${s.balance.toLocaleString()})` : '(clear)'}</option>)}
              </select>
            </div>
          )}

          {/* Shopkeeper history reminder */}
          {shopkeeperHistory && (
            <div style={{
              background: shopkeeperHistory.currentBalance > 0 ? 'var(--amber-dim)' : 'var(--green-dim)',
              border: `0.5px solid ${shopkeeperHistory.currentBalance > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`,
              borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 12
            }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>📋 {shopkeeperHistory.shopkeeper.shopName}</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text2)' }}>
                <span>Total purchased: <strong>₨{shopkeeperHistory.totalPurchased.toLocaleString()}</strong></span>
                <span>Outstanding: <strong style={{ color: shopkeeperHistory.currentBalance > 0 ? 'var(--amber)' : 'var(--green)' }}>₨{shopkeeperHistory.currentBalance.toLocaleString()}</strong></span>
                <span>{shopkeeperHistory.invoiceCount} previous invoice{shopkeeperHistory.invoiceCount !== 1 ? 's' : ''}</span>
              </div>
              {shopkeeperHistory.lastInvoice && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  Last: {shopkeeperHistory.lastInvoice.date} — ₨{shopkeeperHistory.lastInvoice.total.toLocaleString()} ({shopkeeperHistory.lastInvoice.status})
                </div>
              )}
            </div>
          )}

          {/* Brand + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Brand</div>
              <select value={invForm.brandId} onChange={e => setInvForm(f => ({ ...f, brandId: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Invoice date</div>
              <input type="date" value={invForm.date} onChange={e => setInvForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }} />
            </div>
          </div>

          {/* Category filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Filter products by category</div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Line items header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 110px 100px 36px', gap: 8, marginBottom: 4 }}>
            {['Product / Variant', 'Qty', 'Unit price ₨', 'Line total', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 110px 100px 36px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <ProductDropdown
                value={line.productId}
                onChange={e => updateLine(i, 'productId', e.target.value)}
                products={products}
                categories={categories}
                categoryFilter={categoryFilter}
                activeBrand={activeBrand}
              />
              <input type="number" min="1" value={line.qty}
                onChange={e => updateLine(i, 'qty', Math.max(1, +e.target.value))}
                style={{ padding: '8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, width: '100%' }}
              />
              <input type="number" min="0" value={line.unitPrice}
                onChange={e => updateLine(i, 'unitPrice', +e.target.value)}
                style={{ padding: '8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, width: '100%' }}
              />
              <div style={{ textAlign: 'right', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: line.productId ? 'var(--accent)' : 'var(--text3)' }}>
                {line.productId ? `₨${(Number(line.qty) * Number(line.unitPrice)).toLocaleString()}` : '—'}
              </div>
              <button onClick={() => removeLine(i)} style={{ height: 36, width: 36, color: 'var(--red)', background: 'var(--red-dim)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}

          <button onClick={addLine} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: '0.5px dashed var(--accent)', borderRadius: 'var(--radius)', padding: '7px 12px', cursor: 'pointer', width: '100%', marginBottom: 14 }}>
            + Add another product
          </button>

          {/* Total summary */}
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: shopkeeperHistory ? 6 : 0 }}>
              <span style={{ color: 'var(--text2)' }}>Invoice total</span>
              <strong style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: 'var(--accent)' }}>₨{lineTotal.toLocaleString()}</strong>
            </div>
            {shopkeeperHistory && lineTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', paddingTop: 6, borderTop: '0.5px solid var(--border)' }}>
                <span>New balance after this sale</span>
                <strong style={{ color: 'var(--amber)' }}>₨{(shopkeeperHistory.currentBalance + lineTotal).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* Validation hints */}
          {!invForm.isGuest && !invForm.shopkeeperId && <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ Select a customer or switch to Guest mode</div>}
          {lines.every(l => !l.productId) && <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ Add at least one product</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Btn>
            <Btn onClick={handleCreate}>💾 Save invoice</Btn>
          </div>
        </Modal>
      )}

      {/* WhatsApp confirm */}
      {pendingWhatsApp && (
        <Modal title="💬 Send WhatsApp notification?" onClose={() => setPendingWhatsApp(null)} width={500}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Invoice saved! Send WhatsApp to <strong style={{ color: 'var(--text)' }}>{pendingWhatsApp.shopName}</strong>?
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto' }}>
            {pendingWhatsApp.message}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setPendingWhatsApp(null)}>Skip</Btn>
            <Btn onClick={() => { openWhatsApp(pendingWhatsApp.phone, pendingWhatsApp.message); setPendingWhatsApp(null); }}>
              💬 Open WhatsApp
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
