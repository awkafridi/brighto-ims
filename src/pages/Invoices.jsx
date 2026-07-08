import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Btn, PageHeader } from '../components/UI';
import { useAudio } from '../hooks/useAudio';
import { getCurrentUser, isAdmin } from '../hooks/useAuth';
import { openWhatsApp, buildPurchaseMessage } from '../utils/whatsapp';
import { createApprovalRequest, logAudit } from '../utils/auditLog';

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' };

function resolveProductName(productId, products) {
  const main = products.find(p => p.id === productId);
  if (main) return main.name;
  for (const p of products) {
    const v = (p.variants || []).find(v => v.id === productId);
    if (v) return `${p.name} – ${v.name}`;
  }
  return productId || '—';
}

function resolveSellingPrice(productId, products) {
  const main = products.find(p => p.id === productId);
  if (main) return main.sellingPrice || Math.round((main.avgCost || 0) * 1.35);
  for (const p of products) {
    const v = (p.variants || []).find(v => v.id === productId);
    if (v) return v.sellingPrice || p.sellingPrice || Math.round((p.avgCost || 0) * 1.35);
  }
  return 0;
}

// ── Product selector: dropdown + manual entry ─────────────────────────────────
function ProductSelector({ line, index, onUpdate, products, categories, categoryFilter, activeBrand, onQuickAdd }) {
  const [mode, setMode] = useState('dropdown'); // 'dropdown' | 'manual'
  const [manualName, setManualName] = useState('');

  const filtered = products.filter(p =>
    (activeBrand === 'all' || p.brandId === activeBrand) &&
    (categoryFilter === 'all' || p.categoryId === categoryFilter)
  );

  if (mode === 'manual') {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={manualName}
          onChange={e => setManualName(e.target.value)}
          placeholder="Type product name..."
          style={{ flex: 1, padding: '8px 10px', background: 'var(--bg3)', border: '0.5px solid var(--amber)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}
        />
        <button
          onClick={() => { if (manualName.trim()) onQuickAdd(index, manualName.trim()); setManualName(''); setMode('dropdown'); }}
          style={{ padding: '0 10px', background: 'var(--amber)', color: '#000', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
        >+ Add</button>
        <button onClick={() => setMode('dropdown')} style={{ padding: '0 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text2)', fontSize: 12 }}>↩</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <select
        value={line.productId}
        onChange={e => onUpdate(index, 'productId', e.target.value)}
        style={{ flex: 1, padding: '8px 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 12, cursor: 'pointer' }}
      >
        <option value="">— select product —</option>
        {filtered.length === 0 && <option disabled>No products — add in Inventory</option>}
        {categories.map(cat => {
          const catProds = filtered.filter(p => p.categoryId === cat.id);
          if (!catProds.length) return null;
          return (
            <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
              {catProds.map(p => (
                <optgroup key={p.id} label={`  📦 ${p.name} — ₨${p.sellingPrice || 0}`}>
                  <option value={p.id}>↳ {p.name} (general) — ₨{p.sellingPrice || 0} | stock: {p.stock || 0}</option>
                  {(p.variants || []).map(v => (
                    <option key={v.id} value={v.id}>↳ {v.name} — ₨{v.sellingPrice || p.sellingPrice || 0} | stock: {v.stock || 0}</option>
                  ))}
                </optgroup>
              ))}
            </optgroup>
          );
        })}
        {filtered.filter(p => !categories.find(c => c.id === p.categoryId)).map(p => (
          <optgroup key={p.id} label={`📦 ${p.name}`}>
            <option value={p.id}>↳ {p.name} — ₨{p.sellingPrice || 0}</option>
            {(p.variants || []).map(v => (
              <option key={v.id} value={v.id}>↳ {v.name} — ₨{v.sellingPrice || p.sellingPrice || 0}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        onClick={() => setMode('manual')}
        title="Type product name manually"
        style={{ padding: '0 8px', background: 'var(--amber-dim)', color: 'var(--amber)', border: '0.5px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap', fontWeight: 600 }}
      >✏ Manual</button>
    </div>
  );
}

export default function Invoices({ activeBrand }) {
  const { invoices, shopkeepers, products, brands, categories, addInvoice, editInvoice, deleteInvoice, addProduct } = useStore();
  const { speakInvoice } = useAudio();
  const user = getCurrentUser();
  const admin = isAdmin();

  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [audioLang, setAudioLang] = useState('en');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingWhatsApp, setPendingWhatsApp] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [approvalSent, setApprovalSent] = useState(false);

  const [lines, setLines] = useState([{ productId: '', manualName: '', qty: 1, unitPrice: 0 }]);
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

  const addLine = () => setLines(l => [...l, { productId: '', manualName: '', qty: 1, unitPrice: 0 }]);
  const removeLine = i => setLines(l => l.filter((_, idx) => idx !== i));

  const updateLine = (i, field, val) => {
    setLines(prev => {
      const updated = prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
      if (field === 'productId' && val) {
        updated[i].unitPrice = resolveSellingPrice(val, products);
        updated[i].manualName = '';
      }
      return updated;
    });
  };

  // Quick-add a manually typed product — adds to inventory and selects it
  const handleQuickAdd = (lineIndex, name) => {
    const tempId = `temp-${Date.now()}`;
    addProduct({
      id: tempId, name, sku: '',
      brandId: invForm.brandId || brands[0]?.id || '',
      categoryId: '',
      unit: 'pcs', avgCost: 0, sellingPrice: 0, stock: 0, variants: []
    });
    setLines(prev => prev.map((l, idx) =>
      idx === lineIndex ? { ...l, productId: tempId, manualName: name, unitPrice: 0 } : l
    ));
    logAudit({ user, action: 'create', resourceType: 'product', resourceId: tempId, detail: `Quick-added product "${name}" from invoice`, approved: true });
  };

  const lineTotal = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unitPrice)), 0);

  const resetForm = () => {
    setLines([{ productId: '', manualName: '', qty: 1, unitPrice: 0 }]);
    setInvForm({ shopkeeperId: '', guestName: '', isGuest: false, brandId: brands[0]?.id || '', date: new Date().toISOString().split('T')[0], notes: '' });
    setCategoryFilter('all');
  };

  const handleCreate = () => {
    const customerOk = invForm.isGuest ? true : invForm.shopkeeperId;
    if (!customerOk) return;
    const validLines = lines.filter(l => (l.productId || l.manualName) && l.qty > 0);
    if (validLines.length === 0) return;

    const invoiceData = { ...invForm, items: validLines };
    addInvoice(invoiceData);
    logAudit({ user, action: 'create', resourceType: 'invoice', resourceId: 'new', detail: `Created invoice for ${invForm.isGuest ? invForm.guestName || 'Guest' : shopkeepers.find(s => s.id === invForm.shopkeeperId)?.shopName}`, approved: true });

    if (!invForm.isGuest) {
      const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
      const brand = brands.find(b => b.id === invForm.brandId);
      if (sk?.phone) {
        const productNames = validLines.map(l => l.manualName || resolveProductName(l.productId, products));
        const message = buildPurchaseMessage({ shopName: sk.shopName, brandName: brand?.name, items: validLines, productNames, total: lineTotal, previousBalance: sk.balance, newBalance: sk.balance + lineTotal, date: invForm.date });
        setPendingWhatsApp({ phone: sk.phone, message, shopName: sk.shopName });
      }
    }
    setShowNew(false);
    resetForm();
  };

  const handleDeleteInvoice = (inv) => {
    if (!admin) {
      createApprovalRequest({ user, action: 'delete-invoice', resourceType: 'invoice', resourceId: inv.id, detail: `Delete invoice ${inv.id.slice(-6).toUpperCase()} (₨${inv.total.toLocaleString()})`, payload: { id: inv.id } });
      setApprovalSent(true);
      setTimeout(() => setApprovalSent(false), 3000);
      return;
    }
    if (confirmDelete === inv.id) { deleteInvoice(inv.id); setConfirmDelete(null); setSelected(null); }
    else { setConfirmDelete(inv.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const handleMarkStatus = (inv, status) => {
    if (!admin) {
      createApprovalRequest({ user, action: 'edit-invoice', resourceType: 'invoice', resourceId: inv.id, detail: `Change invoice ${inv.id.slice(-6).toUpperCase()} status to "${status}"`, payload: { id: inv.id, changes: { status } } });
      setApprovalSent(true);
      setTimeout(() => setApprovalSent(false), 3000);
      return;
    }
    editInvoice(inv.id, { status });
    if (selected?.id === inv.id) setSelected(null);
  };

  const customerLabel = (inv) => {
    if (inv.isGuest) return `👤 ${inv.guestName || inv.customerName || 'Guest'}`;
    return shopkeepers.find(s => s.id === inv.shopkeeperId)?.shopName || inv.customerName || '—';
  };

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Sales invoices and billing records" action={<Btn onClick={() => setShowNew(true)}>+ New invoice</Btn>} />

      {approvalSent && (
        <div style={{ background: 'var(--amber-dim)', border: '0.5px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--amber)' }}>
          ✓ Approval request sent to admin. Your change will be applied once approved.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'unpaid', 'partial', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: statusFilter === s ? 'var(--accent)' : 'var(--bg2)', color: statusFilter === s ? '#fff' : 'var(--text2)', border: statusFilter === s ? 'none' : '0.5px solid var(--border2)', cursor: 'pointer', textTransform: 'capitalize' }}>
            {s === 'all' ? `All (${invoices.length})` : `${s} (${invoices.filter(i => i.status === s && (activeBrand === 'all' || i.brandId === activeBrand)).length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)' }}>
          Total: <strong style={{ color: 'var(--text)', marginLeft: 6 }}>₨{filtered.reduce((s, i) => s + i.total, 0).toLocaleString()}</strong>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <Table onRowClick={setSelected} columns={[
          { key: 'id', label: 'Invoice #', render: v => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.slice(-8).toUpperCase()}</span> },
          { key: 'customer', label: 'Customer', render: (_, row) => (
            <div>
              <div style={{ fontWeight: 500 }}>{customerLabel(row)}</div>
              {row.isGuest && <div style={{ fontSize: 10, color: 'var(--amber)' }}>Guest</div>}
            </div>
          )},
          { key: 'brandId', label: 'Brand', render: v => { const b = brands.find(b => b.id === v); return <Badge color="accent">{b?.name || v}</Badge>; } },
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Amount', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>₨{v.toLocaleString()}</strong> },
          { key: 'status', label: 'Status', align: 'right', render: v => <Badge color={statusColor[v]}>{v}</Badge> },
          { key: 'act', label: '', align: 'right', render: (_, row) => (
            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
              {row.status !== 'paid' && (
                <button onClick={() => handleMarkStatus(row, 'paid')} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer' }}>
                  {admin ? 'Mark paid' : 'Request paid'}
                </button>
              )}
              {admin && (
                <button onClick={() => handleDeleteInvoice(row)} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>
                  {confirmDelete === row.id ? 'Sure?' : 'Del'}
                </button>
              )}
            </div>
          )},
        ]} data={filtered} />
      </Card>

      {/* Invoice detail modal */}
      {selected && (
        <Modal title={`Invoice ${selected.id.slice(-8).toUpperCase()}`} onClose={() => setSelected(null)} width={680}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Customer</div><div style={{ fontWeight: 600 }}>{customerLabel(selected)}</div>{selected.isGuest && <Badge color="amber">Guest</Badge>}</div>
            <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Date</div><div style={{ fontWeight: 600 }}>{selected.date}</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Status</div><Badge color={statusColor[selected.status]}>{selected.status}</Badge></div>
          </div>

          <Table columns={[
            { key: 'product', label: 'Product', render: (_, row) => row.manualName || resolveProductName(row.productId, products) },
            { key: 'cat', label: 'Category', render: (_, row) => {
              const p = products.find(p => p.id === row.productId || (p.variants || []).some(v => v.id === row.productId));
              const c = categories.find(c => c.id === p?.categoryId);
              return c ? <span style={{ fontSize: 12 }}>{c.icon} {c.name}</span> : '—';
            }},
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unitPrice', label: 'Unit ₨', align: 'right', render: v => `₨${v}` },
            { key: 'total', label: 'Total', align: 'right', render: (_, row) => <strong>₨{(row.qty * row.unitPrice).toLocaleString()}</strong> },
          ]} data={selected.items || []} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '0.5px solid var(--border)', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={audioLang} onChange={e => setAudioLang(e.target.value)} style={{ padding: '5px 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12 }}>
                <option value="en">🇬🇧 EN</option>
                <option value="ur">🇵🇰 UR</option>
              </select>
              <Btn variant="ghost" onClick={() => speakInvoice(selected, shopkeepers.find(s => s.id === selected.shopkeeperId), audioLang)}>🔊 Read</Btn>
              {selected.status !== 'paid' && <Btn variant="ghost" onClick={() => handleMarkStatus(selected, 'paid')}>{admin ? '✓ Mark paid' : '→ Request: mark paid'}</Btn>}
              {selected.status === 'unpaid' && <Btn variant="ghost" onClick={() => handleMarkStatus(selected, 'partial')}>{admin ? '½ Partial' : '→ Request: partial'}</Btn>}
              {admin
                ? <Btn variant="danger" onClick={() => handleDeleteInvoice(selected)}>{confirmDelete === selected.id ? '⚠ Confirm' : '🗑 Delete'}</Btn>
                : <Btn variant="ghost" onClick={() => handleDeleteInvoice(selected)}>→ Request delete</Btn>
              }
              {!admin && <span style={{ fontSize: 11, color: 'var(--text3)' }}>🔒 Changes need admin approval</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Grand total</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)' }}>₨{selected.total.toLocaleString()}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* New invoice modal */}
      {showNew && (
        <Modal title="New invoice" onClose={() => { setShowNew(false); resetForm(); }} width={760}>
          {/* Customer type */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button onClick={() => setInvForm(f => ({ ...f, isGuest: false }))} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: !invForm.isGuest ? 'var(--accent)' : 'var(--bg3)', color: !invForm.isGuest ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer' }}>🏪 Registered shopkeeper</button>
            <button onClick={() => setInvForm(f => ({ ...f, isGuest: true, shopkeeperId: '' }))} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: invForm.isGuest ? 'var(--amber)' : 'var(--bg3)', color: invForm.isGuest ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer' }}>👤 Guest / walk-in</button>
          </div>

          {invForm.isGuest ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Customer name (optional)</div>
              <input value={invForm.guestName} onChange={e => setInvForm(f => ({ ...f, guestName: e.target.value }))} placeholder="e.g. Walk-in / Ahmed" style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, boxSizing: 'border-box' }} />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Guest invoices don't affect any ledger balance.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Customer *</div>
              <select value={invForm.shopkeeperId} onChange={e => setInvForm(f => ({ ...f, shopkeeperId: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                <option value="">Select shopkeeper...</option>
                {shopkeepers.map(s => <option key={s.id} value={s.id}>{s.shopName} — {s.owner} {s.balance > 0 ? `(bal: ₨${s.balance.toLocaleString()})` : '(clear)'}</option>)}
              </select>
            </div>
          )}

          {shopkeeperHistory && (
            <div style={{ background: shopkeeperHistory.currentBalance > 0 ? 'var(--amber-dim)' : 'var(--green-dim)', border: `0.5px solid ${shopkeeperHistory.currentBalance > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`, borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>📋 {shopkeeperHistory.shopkeeper.shopName}</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text2)' }}>
                <span>Total purchased: <strong>₨{shopkeeperHistory.totalPurchased.toLocaleString()}</strong></span>
                <span>Outstanding: <strong style={{ color: shopkeeperHistory.currentBalance > 0 ? 'var(--amber)' : 'var(--green)' }}>₨{shopkeeperHistory.currentBalance.toLocaleString()}</strong></span>
                <span>{shopkeeperHistory.invoiceCount} invoices</span>
              </div>
              {shopkeeperHistory.lastInvoice && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Last: {shopkeeperHistory.lastInvoice.date} — ₨{shopkeeperHistory.lastInvoice.total.toLocaleString()} ({shopkeeperHistory.lastInvoice.status})</div>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Brand</div>
              <select value={invForm.brandId} onChange={e => setInvForm(f => ({ ...f, brandId: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Filter by category</div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
                <option value="all">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Invoice date</div>
              <input type="date" value={invForm.date} onChange={e => setInvForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }} />
            </div>
          </div>

          {/* Line items */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 65px 100px 95px 34px', gap: 6, marginBottom: 4 }}>
            {['Product / Variant (dropdown or ✏ Manual)', 'Qty', 'Unit ₨', 'Line total', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 65px 100px 95px 34px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <ProductSelector
                line={line} index={i} onUpdate={updateLine}
                products={products} categories={categories}
                categoryFilter={categoryFilter} activeBrand={activeBrand}
                onQuickAdd={handleQuickAdd}
              />
              <input type="number" min="1" value={line.qty} onChange={e => updateLine(i, 'qty', Math.max(1, +e.target.value))}
                style={{ padding: '8px 6px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, width: '100%' }} />
              <input type="number" min="0" value={line.unitPrice} onChange={e => updateLine(i, 'unitPrice', +e.target.value)}
                style={{ padding: '8px 6px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, width: '100%' }} />
              <div style={{ textAlign: 'right', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: (line.productId || line.manualName) ? 'var(--accent)' : 'var(--text3)' }}>
                {(line.productId || line.manualName) ? `₨${(Number(line.qty) * Number(line.unitPrice)).toLocaleString()}` : '—'}
              </div>
              <button onClick={() => removeLine(i)} style={{ height: 36, color: 'var(--red)', background: 'var(--red-dim)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}

          <button onClick={addLine} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: '0.5px dashed var(--accent)', borderRadius: 'var(--radius)', padding: '7px 12px', cursor: 'pointer', width: '100%', marginBottom: 14 }}>+ Add another product</button>

          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: shopkeeperHistory && lineTotal > 0 ? 6 : 0 }}>
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

          {!invForm.isGuest && !invForm.shopkeeperId && <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ Select a customer or switch to Guest mode</div>}
          {lines.every(l => !l.productId && !l.manualName) && <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ Add at least one product (use dropdown or ✏ Manual)</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Btn>
            <Btn onClick={handleCreate}>💾 Save invoice</Btn>
          </div>
        </Modal>
      )}

      {/* WhatsApp confirm */}
      {pendingWhatsApp && (
        <Modal title="💬 Send WhatsApp?" onClose={() => setPendingWhatsApp(null)} width={500}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Send confirmation to <strong style={{ color: 'var(--text)' }}>{pendingWhatsApp.shopName}</strong>?</div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto' }}>{pendingWhatsApp.message}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setPendingWhatsApp(null)}>Skip</Btn>
            <Btn onClick={() => { openWhatsApp(pendingWhatsApp.phone, pendingWhatsApp.message); setPendingWhatsApp(null); }}>💬 Open WhatsApp</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
