import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Select, Btn, PageHeader } from '../components/UI';
import { useAudio } from '../hooks/useAudio';
import { openWhatsApp, buildPurchaseMessage } from '../utils/whatsapp';

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' };

export default function Invoices({ activeBrand, prefill }) {
  const { invoices, shopkeepers, products, brands, categories, addInvoice, editInvoice } = useStore();
  const { speakInvoice } = useAudio();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [audioLang, setAudioLang] = useState('en');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lines, setLines] = useState([{ productId: '', qty: 1, unitPrice: 0 }]);
  const [invForm, setInvForm] = useState({ shopkeeperId: '', brandId: brands[0]?.id || '', date: new Date().toISOString().split('T')[0], notes: '' });

  const filtered = invoices.filter(inv => {
    const matchBrand = activeBrand === 'all' || inv.brandId === activeBrand;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchBrand && matchStatus;
  });

  // Products narrowed by brand + category for the line-item dropdown
  const availableProducts = products.filter(p =>
    (activeBrand === 'all' || p.brandId === activeBrand) &&
    (categoryFilter === 'all' || p.categoryId === categoryFilter)
  );

  // Selected shopkeeper's purchase history — shown live while building an invoice
  const shopkeeperHistory = useMemo(() => {
    if (!invForm.shopkeeperId) return null;
    const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
    if (!sk) return null;
    const skInvoices = invoices.filter(i => i.shopkeeperId === sk.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalPurchased = skInvoices.reduce((s, i) => s + i.total, 0);
    return {
      shopkeeper: sk,
      totalPurchased,
      currentBalance: sk.balance,
      lastInvoice: skInvoices[0] || null,
      invoiceCount: skInvoices.length,
    };
  }, [invForm.shopkeeperId, shopkeepers, invoices]);

  const addLine = () => setLines([...lines, { productId: '', qty: 1, unitPrice: 0 }]);
  const removeLine = i => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: val };
    if (field === 'productId') {
      const p = products.find(p => p.id === val);
      if (p) updated[i].unitPrice = Math.round(p.avgCost * 1.35);
    }
    setLines(updated);
  };

  const lineTotal = lines.reduce((s, l) => s + (l.qty * l.unitPrice), 0);

  const handleCreate = () => {
    if (!invForm.shopkeeperId || lines.every(l => !l.productId)) return;
    const validLines = lines.filter(l => l.productId);
    addInvoice({ ...invForm, items: validLines });

    // Offer WhatsApp confirmation right after saving
    const sk = shopkeepers.find(s => s.id === invForm.shopkeeperId);
    const brand = brands.find(b => b.id === invForm.brandId);
    if (sk) {
      const previousBalance = sk.balance;
      const newBalance = previousBalance + lineTotal;
      const productNames = validLines.map(l => products.find(p => p.id === l.productId)?.name || 'Item');
      const message = buildPurchaseMessage({
        shopName: sk.shopName, brandName: brand?.name, items: validLines,
        productNames, total: lineTotal, previousBalance, newBalance, date: invForm.date,
      });
      if (window.confirm(`Invoice saved! Send WhatsApp confirmation to ${sk.shopName}?`)) {
        openWhatsApp(sk.phone, message);
      }
    }

    setShowNew(false);
    setLines([{ productId: '', qty: 1, unitPrice: 0 }]);
    setInvForm({ shopkeeperId: '', brandId: brands[0]?.id || '', date: new Date().toISOString().split('T')[0], notes: '' });
    setCategoryFilter('all');
  };

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Sales invoices and billing records" action={<Btn onClick={() => setShowNew(true)}>+ New invoice</Btn>} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'unpaid', 'partial', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: statusFilter === s ? 'var(--accent)' : 'var(--bg2)', color: statusFilter === s ? '#fff' : 'var(--text2)', border: statusFilter === s ? 'none' : '0.5px solid var(--border2)', cursor: 'pointer', textTransform: 'capitalize' }}>
            {s === 'all' ? `All (${invoices.length})` : `${s} (${invoices.filter(i => i.status === s && (activeBrand === 'all' || i.brandId === activeBrand)).length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>
          Total: <strong style={{ color: 'var(--text)', marginLeft: 6 }}>₨{filtered.reduce((s, i) => s + i.total, 0).toLocaleString()}</strong>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <Table onRowClick={setSelected} columns={[
          { key: 'id', label: 'Invoice #', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.toUpperCase().slice(0, 10)}</span> },
          { key: 'shopkeeperId', label: 'Customer', render: v => shopkeepers.find(s => s.id === v)?.shopName || v },
          { key: 'brandId', label: 'Brand', render: v => { const b = brands.find(b => b.id === v); return <Badge color={v === 'b1' ? 'accent' : 'purple'}>{b?.name || v}</Badge>; } },
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Amount', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>₨{v.toLocaleString()}</strong> },
          { key: 'status', label: 'Status', align: 'right', render: v => <Badge color={statusColor[v]}>{v}</Badge> },
          { key: 'actions', label: '', align: 'right', render: (_, row) => (
            <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => editInvoice(row.id, { status: 'paid' })} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer' }}>Mark paid</button>
            </div>
          )},
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={`Invoice ${selected.id.toUpperCase().slice(0, 10)}`} onClose={() => setSelected(null)} width={640}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Customer</div><div style={{ fontWeight: 600 }}>{shopkeepers.find(s => s.id === selected.shopkeeperId)?.shopName}</div><div style={{ fontSize: 12, color: 'var(--text2)' }}>{shopkeepers.find(s => s.id === selected.shopkeeperId)?.owner}</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Date</div><div style={{ fontWeight: 600 }}>{selected.date}</div><Badge color={statusColor[selected.status]}>{selected.status}</Badge></div>
          </div>
          <Table columns={[
            { key: 'product', label: 'Product', render: (_, row) => products.find(p => p.id === row.productId)?.name || row.productId },
            { key: 'category', label: 'Category', render: (_, row) => {
              const p = products.find(p => p.id === row.productId);
              const c = categories.find(c => c.id === p?.categoryId);
              return c ? <span style={{ fontSize: 12 }}>{c.icon} {c.name}</span> : '—';
            }},
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unitPrice', label: 'Unit price', align: 'right', render: v => `₨${v}` },
            { key: 'lineTotal', label: 'Total', align: 'right', render: (_, row) => <strong>₨{(row.qty * row.unitPrice).toLocaleString()}</strong> },
          ]} data={(selected.items || []).map(item => ({ ...item, lineTotal: item.qty * item.unitPrice }))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '0.5px solid var(--border)', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={audioLang} onChange={e => setAudioLang(e.target.value)} style={{ padding: '5px 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12 }}>
                <option value="en">🇬🇧 EN</option>
                <option value="ur">🇵🇰 UR</option>
              </select>
              <Btn variant="ghost" onClick={() => speakInvoice(selected, shopkeepers.find(s => s.id === selected.shopkeeperId), audioLang)}>🔊 Read</Btn>
              {selected.status !== 'paid' && <Btn variant="ghost" onClick={() => { editInvoice(selected.id, { status: 'paid' }); setSelected(null); }}>✓ Mark paid</Btn>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Grand total</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)' }}>₨{selected.total.toLocaleString()}</div>
            </div>
          </div>
        </Modal>
      )}

      {showNew && (
        <Modal title="New invoice" onClose={() => setShowNew(false)} width={720}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select label="Customer" value={invForm.shopkeeperId} onChange={e => setInvForm(f => ({ ...f, shopkeeperId: e.target.value }))}>
              <option value="">Select shopkeeper...</option>
              {shopkeepers.map(s => <option key={s.id} value={s.id}>{s.shopName}</option>)}
            </Select>
            <Select label="Brand" value={invForm.brandId} onChange={e => setInvForm(f => ({ ...f, brandId: e.target.value }))}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>

          {/* Shopkeeper purchase history reminder */}
          {shopkeeperHistory && (
            <div style={{
              background: shopkeeperHistory.currentBalance > 0 ? 'var(--amber-dim)' : 'var(--green-dim)',
              border: `0.5px solid ${shopkeeperHistory.currentBalance > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(52,211,153,0.25)'}`,
              borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 12
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📋 {shopkeeperHistory.shopkeeper.shopName} — Account History</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text2)' }}>
                <span>Total purchased: <strong style={{ color: 'var(--text)' }}>₨{shopkeeperHistory.totalPurchased.toLocaleString()}</strong></span>
                <span>Current balance: <strong style={{ color: shopkeeperHistory.currentBalance > 0 ? 'var(--amber)' : 'var(--green)' }}>₨{shopkeeperHistory.currentBalance.toLocaleString()}</strong></span>
                <span>{shopkeeperHistory.invoiceCount} previous invoice{shopkeeperHistory.invoiceCount !== 1 ? 's' : ''}</span>
              </div>
              {shopkeeperHistory.lastInvoice && (
                <div style={{ marginTop: 4, color: 'var(--text3)' }}>Last purchase: {shopkeeperHistory.lastInvoice.date} — ₨{shopkeeperHistory.lastInvoice.total.toLocaleString()} ({shopkeeperHistory.lastInvoice.status})</div>
              )}
            </div>
          )}

          <Input label="Invoice date" type="date" value={invForm.date} onChange={e => setInvForm(f => ({ ...f, date: e.target.value }))} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Line items</div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '4px 10px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12 }}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 36px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <Select value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)} style={{ marginBottom: 0 }}>
                <option value="">Select product...</option>
                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', +e.target.value)} style={{ marginBottom: 0 }} />
              <Input type="number" value={line.unitPrice} onChange={e => updateLine(i, 'unitPrice', +e.target.value)} style={{ marginBottom: 0 }} />
              <button onClick={() => removeLine(i)} style={{ height: 36, color: 'var(--red)', background: 'var(--red-dim)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <button onClick={addLine} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: '0.5px dashed var(--accent)', borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer', width: '100%', marginBottom: 16 }}>+ Add line</button>

          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: shopkeeperHistory ? 6 : 0 }}>
              <span style={{ color: 'var(--text2)' }}>Invoice total</span>
              <strong style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: 'var(--accent)' }}>₨{lineTotal.toLocaleString()}</strong>
            </div>
            {shopkeeperHistory && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', paddingTop: 6, borderTop: '0.5px solid var(--border)' }}>
                <span>New balance after this sale</span>
                <strong>₨{(shopkeeperHistory.currentBalance + lineTotal).toLocaleString()}</strong>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Save invoice & notify</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
