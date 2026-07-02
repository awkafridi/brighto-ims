import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Btn, PageHeader } from '../components/UI';
import { useAudio } from '../hooks/useAudio';
import { openWhatsApp, buildPurchaseMessage } from '../utils/whatsapp';

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' };

// Native <select> used directly here (not the UI wrapper) to avoid style conflicts
function LineSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: '100%', padding: '8px 10px', background: 'var(--bg3)',
      border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
      color: 'var(--text)', outline: 'none', fontSize: 13, cursor: 'pointer',
    }}>
      {children}
    </select>
  );
}

function NativeSelect({ label, value, onChange, children, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>{label}</div>}
      <select value={value} onChange={onChange} style={{
        width: '100%', padding: '8px 12px', background: 'var(--bg3)',
        border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
        color: 'var(--text)', outline: 'none', fontSize: 13,
      }}>
        {children}
      </select>
    </div>
  );
}

export default function Invoices({ activeBrand }) {
  const { invoices, shopkeepers, products, brands, categories, addInvoice, editInvoice } = useStore();
  const { speakInvoice } = useAudio();

  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [audioLang, setAudioLang] = useState('en');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingWhatsApp, setPendingWhatsApp] = useState(null); // { phone, message, shopName }

  const [lines, setLines] = useState([{ productId: '', qty: 1, unitPrice: 0 }]);
  const [invForm, setInvForm] = useState({
    shopkeeperId: '', brandId: brands[0]?.id || '',
    date: new Date().toISOString().split('T')[0], notes: ''
  });

  const filtered = invoices.filter(inv => {
    const matchBrand = activeBrand === 'all' || inv.brandId === activeBrand;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchBrand && matchStatus;
  });

  // Products filtered by brand + category
  const availableProducts = products.filter(p =>
    (activeBrand === 'all' || p.brandId === activeBrand) &&
    (categoryFilter === 'all' || p.categoryId === categoryFilter)
  );

  // Shopkeeper purchase history — shown live in the form
  const shopkeeperHistory = useMemo(() => {
    if (!invForm.shopkeeperId) return null;
    const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
    if (!sk) return null;
    const skInvoices = invoices
      .filter(i => i.shopkeeperId === sk.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalPurchased = skInvoices.reduce((s, i) => s + i.total, 0);
    return {
      shopkeeper: sk,
      totalPurchased,
      currentBalance: sk.balance,
      lastInvoice: skInvoices[0] || null,
      invoiceCount: skInvoices.length,
    };
  }, [invForm.shopkeeperId, shopkeepers, invoices]);

  const addLine = () => setLines(l => [...l, { productId: '', qty: 1, unitPrice: 0 }]);
  const removeLine = i => setLines(l => l.filter((_, idx) => idx !== i));

  const updateLine = (i, field, val) => {
    setLines(prev => {
      const updated = prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
      if (field === 'productId') {
        const p = products.find(p => p.id === val);
        // Use the product's defined selling price — fall back to cost + 35% only if none set
        if (p) updated[i].unitPrice = p.sellingPrice || Math.round((p.avgCost || 0) * 1.35);
      }
      return updated;
    });
  };

  const lineTotal = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unitPrice)), 0);

  const resetForm = () => {
    setLines([{ productId: '', qty: 1, unitPrice: 0 }]);
    setInvForm({ shopkeeperId: '', brandId: brands[0]?.id || '', date: new Date().toISOString().split('T')[0], notes: '' });
    setCategoryFilter('all');
  };

  const handleCreate = () => {
    if (!invForm.shopkeeperId) return;
    const validLines = lines.filter(l => l.productId && l.qty > 0);
    if (validLines.length === 0) return;

    addInvoice({ ...invForm, items: validLines });

    // Prepare WhatsApp message — show in-app dialog instead of window.confirm
    const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
    const brand = brands.find(b => b.id === invForm.brandId);
    if (sk) {
      const previousBalance = sk.balance;
      const newBalance = previousBalance + lineTotal;
      const productNames = validLines.map(l => products.find(p => p.id === l.productId)?.name || 'Item');
      const message = buildPurchaseMessage({
        shopName: sk.shopName, brandName: brand?.name,
        items: validLines, productNames, total: lineTotal,
        previousBalance, newBalance, date: invForm.date,
      });
      setPendingWhatsApp({ phone: sk.phone, message, shopName: sk.shopName });
    }

    setShowNew(false);
    resetForm();
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Sales invoices and billing records"
        action={<Btn onClick={() => setShowNew(true)}>+ New invoice</Btn>}
      />

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'unpaid', 'partial', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: statusFilter === s ? 'var(--accent)' : 'var(--bg2)',
            color: statusFilter === s ? '#fff' : 'var(--text2)',
            border: statusFilter === s ? 'none' : '0.5px solid var(--border2)',
            cursor: 'pointer', textTransform: 'capitalize'
          }}>
            {s === 'all'
              ? `All (${invoices.length})`
              : `${s} (${invoices.filter(i => i.status === s && (activeBrand === 'all' || i.brandId === activeBrand)).length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>
          Total: <strong style={{ color: 'var(--text)', marginLeft: 6 }}>
            ₨{filtered.reduce((s, i) => s + i.total, 0).toLocaleString()}
          </strong>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <Table onRowClick={setSelected} columns={[
          { key: 'id', label: 'Invoice #', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.toUpperCase().slice(0, 10)}</span> },
          { key: 'shopkeeperId', label: 'Customer', render: v => shopkeepers.find(s => s.id === v)?.shopName || v },
          { key: 'brandId', label: 'Brand', render: v => { const b = brands.find(b => b.id === v); return <Badge color="accent">{b?.name || v}</Badge>; } },
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Amount', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>₨{v.toLocaleString()}</strong> },
          { key: 'status', label: 'Status', align: 'right', render: v => <Badge color={statusColor[v]}>{v}</Badge> },
          { key: 'act', label: '', align: 'right', render: (_, row) => (
            <div onClick={e => e.stopPropagation()}>
              {row.status !== 'paid' && (
                <button onClick={() => editInvoice(row.id, { status: 'paid' })} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer'
                }}>Mark paid</button>
              )}
            </div>
          )},
        ]} data={filtered} />
      </Card>

      {/* Invoice detail modal */}
      {selected && (
        <Modal title={`Invoice ${selected.id.toUpperCase().slice(0, 10)}`} onClose={() => setSelected(null)} width={640}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{shopkeepers.find(s => s.id === selected.shopkeeperId)?.shopName}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{shopkeepers.find(s => s.id === selected.shopkeeperId)?.owner}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Date</div>
              <div style={{ fontWeight: 600 }}>{selected.date}</div>
              <Badge color={statusColor[selected.status]}>{selected.status}</Badge>
            </div>
          </div>
          <Table columns={[
            { key: 'product', label: 'Product', render: (_, row) => products.find(p => p.id === row.productId)?.name || row.productId },
            { key: 'cat', label: 'Category', render: (_, row) => {
              const p = products.find(p => p.id === row.productId);
              const c = categories.find(c => c.id === p?.categoryId);
              return c ? <span style={{ fontSize: 12 }}>{c.icon} {c.name}</span> : '—';
            }},
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unitPrice', label: 'Unit price', align: 'right', render: v => `₨${v}` },
            { key: 'total', label: 'Total', align: 'right', render: (_, row) => <strong>₨{(row.qty * row.unitPrice).toLocaleString()}</strong> },
          ]} data={selected.items || []} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '0.5px solid var(--border)', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={audioLang} onChange={e => setAudioLang(e.target.value)} style={{ padding: '5px 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12 }}>
                <option value="en">🇬🇧 EN</option>
                <option value="ur">🇵🇰 UR</option>
              </select>
              <Btn variant="ghost" onClick={() => speakInvoice(selected, shopkeepers.find(s => s.id === selected.shopkeeperId), audioLang)}>🔊 Read</Btn>
              {selected.status !== 'paid' && (
                <Btn variant="ghost" onClick={() => { editInvoice(selected.id, { status: 'paid' }); setSelected(null); }}>✓ Mark paid</Btn>
              )}
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
        <Modal title="New invoice" onClose={() => { setShowNew(false); resetForm(); }} width={720}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NativeSelect label="Customer" value={invForm.shopkeeperId} onChange={e => setInvForm(f => ({ ...f, shopkeeperId: e.target.value }))}>
              <option value="">Select shopkeeper...</option>
              {shopkeepers.map(s => <option key={s.id} value={s.id}>{s.shopName}</option>)}
            </NativeSelect>
            <NativeSelect label="Brand" value={invForm.brandId} onChange={e => setInvForm(f => ({ ...f, brandId: e.target.value }))}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </NativeSelect>
          </div>

          {/* Shopkeeper history reminder */}
          {shopkeeperHistory && (
            <div style={{
              background: shopkeeperHistory.currentBalance > 0 ? 'var(--amber-dim)' : 'var(--green-dim)',
              border: `0.5px solid ${shopkeeperHistory.currentBalance > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`,
              borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14,
            }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                📋 {shopkeeperHistory.shopkeeper.shopName} — Account History
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                <span>Total purchased: <strong style={{ color: 'var(--text)' }}>₨{shopkeeperHistory.totalPurchased.toLocaleString()}</strong></span>
                <span>Outstanding: <strong style={{ color: shopkeeperHistory.currentBalance > 0 ? 'var(--amber)' : 'var(--green)' }}>₨{shopkeeperHistory.currentBalance.toLocaleString()}</strong></span>
                <span>{shopkeeperHistory.invoiceCount} previous invoice{shopkeeperHistory.invoiceCount !== 1 ? 's' : ''}</span>
              </div>
              {shopkeeperHistory.lastInvoice && (
                <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text3)' }}>
                  Last purchase: {shopkeeperHistory.lastInvoice.date} — ₨{shopkeeperHistory.lastInvoice.total.toLocaleString()} ({shopkeeperHistory.lastInvoice.status})
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NativeSelect label="Filter products by category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </NativeSelect>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Invoice date</div>
              <input type="date" value={invForm.date} onChange={e => setInvForm(f => ({ ...f, date: e.target.value }))} style={{
                width: '100%', padding: '8px 12px', background: 'var(--bg3)',
                border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
                color: 'var(--text)', outline: 'none', fontSize: 13,
              }} />
            </div>
          </div>

          {/* Line items header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 110px 100px 36px', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Qty</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Unit price ₨</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', textAlign: 'right' }}>Line total</div>
            <div />
          </div>

          {/* Line item rows */}
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 110px 100px 36px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              {/* Product dropdown — always shows all available products */}
              <LineSelect value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)}>
                <option value="">— select product —</option>
                {availableProducts.length === 0 && <option disabled>No products found — add in Inventory first</option>}
                {categories.map(cat => {
                  const catProds = availableProducts.filter(p => p.categoryId === cat.id);
                  if (!catProds.length) return null;
                  return (
                    <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
                      {catProds.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — sell: ₨{p.sellingPrice || 0} | cost: ₨{p.avgCost || 0} | stock: {p.stock || 0} {p.unit}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                {/* Products with no category */}
                {availableProducts.filter(p => !p.categoryId || !categories.find(c => c.id === p.categoryId)).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — sell: ₨{p.sellingPrice || 0} | stock: {p.stock || 0}</option>
                ))}
              </LineSelect>

              <input
                type="number" min="1" value={line.qty}
                onChange={e => updateLine(i, 'qty', Math.max(1, +e.target.value))}
                style={{ padding: '8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, width: '100%' }}
              />
              <input
                type="number" min="0" value={line.unitPrice}
                onChange={e => updateLine(i, 'unitPrice', +e.target.value)}
                style={{ padding: '8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, width: '100%' }}
              />
              {/* Live line total — updates as qty or price changes */}
              <div style={{ textAlign: 'right', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: line.productId ? 'var(--accent)' : 'var(--text3)' }}>
                {line.productId
                  ? `₨${(Number(line.qty) * Number(line.unitPrice)).toLocaleString()}`
                  : '—'}
              </div>
              <button onClick={() => removeLine(i)} style={{
                height: 36, width: 36, color: 'var(--red)', background: 'var(--red-dim)',
                border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 16
              }}>×</button>
            </div>
          ))}

          <button onClick={addLine} style={{
            fontSize: 12, color: 'var(--accent)', background: 'none',
            border: '0.5px dashed var(--accent)', borderRadius: 'var(--radius)',
            padding: '7px 12px', cursor: 'pointer', width: '100%', marginBottom: 16
          }}>+ Add another product</button>

          {/* Totals summary */}
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: shopkeeperHistory ? 6 : 0 }}>
              <span style={{ color: 'var(--text2)' }}>Invoice total</span>
              <strong style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: 'var(--accent)' }}>₨{lineTotal.toLocaleString()}</strong>
            </div>
            {shopkeeperHistory && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', paddingTop: 6, borderTop: '0.5px solid var(--border)' }}>
                <span>New balance after this sale</span>
                <strong style={{ color: 'var(--amber)' }}>₨{(shopkeeperHistory.currentBalance + lineTotal).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {invForm.shopkeeperId === '' && (
            <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ Please select a customer before saving</div>
          )}
          {lines.every(l => !l.productId) && (
            <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ Please add at least one product</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Btn>
            <Btn
              onClick={handleCreate}
              style={{ opacity: (!invForm.shopkeeperId || lines.every(l => !l.productId)) ? 0.5 : 1 }}
            >
              💾 Save invoice
            </Btn>
          </div>
        </Modal>
      )}

      {/* In-app WhatsApp confirm dialog (replaces blocked window.confirm) */}
      {pendingWhatsApp && (
        <Modal title="💬 Send WhatsApp notification?" onClose={() => setPendingWhatsApp(null)} width={500}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Invoice saved! Do you want to send a WhatsApp message to <strong style={{ color: 'var(--text)' }}>{pendingWhatsApp.shopName}</strong> with the purchase details?
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
            {pendingWhatsApp.message}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setPendingWhatsApp(null)}>Skip</Btn>
            <Btn onClick={() => { openWhatsApp(pendingWhatsApp.phone, pendingWhatsApp.message); setPendingWhatsApp(null); }}>
              💬 Send on WhatsApp
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
