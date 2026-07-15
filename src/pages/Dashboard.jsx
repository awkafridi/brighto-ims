import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { KpiCard, Card, Badge, StatBar, PageHeader } from '../components/UI';
import { useStore } from '../data/store';
import { useAudio } from '../hooks/useAudio';
import { calcLineCost } from '../utils/cogs';

const fmt = n => '₨' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n.toLocaleString());

function ageBucket(date) {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days <= 30) return { label: '0–30 days', color: 'var(--green)' };
  if (days <= 60) return { label: '31–60 days', color: 'var(--amber)' };
  return { label: '60+ days', color: 'var(--red)' };
}

export default function Dashboard({ activeBrand }) {
  const { brands, invoices, expenses, products, shopkeepers, monthlySales, ledgerEntries, batches } = useStore();
  const { speakSummary } = useAudio();
  const [audioLang, setAudioLang] = useState('en');

  const brandName = activeBrand === 'all' ? null : brands.find(b => b.id === activeBrand)?.name;
  const filteredInvoices = activeBrand === 'all' ? invoices : invoices.filter(i => i.brandId === activeBrand);
  const filteredExpenses = activeBrand === 'all' ? expenses : expenses.filter(e => e.brandId === activeBrand);

  const totalSales = filteredInvoices.reduce((s, i) => s + i.total, 0);
  const totalRecovered = ledgerEntries.filter(e => e.type === 'payment').reduce((s, e) => s + e.credit, 0);
  const totalReceivables = shopkeepers.reduce((s, sk) => s + sk.balance, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  // COGS — Profit = (SalePrice - UnitCost) * Quantity, using each line's actual
  // batch unit cost (snapshotted at sale time, or resolved live via FIFO for
  // older invoices saved before that snapshot existed) rather than a flat
  // product-wide average or a static margin multiplier.
  const totalCOGS = filteredInvoices.reduce((s, inv) => s + (inv.items || []).reduce((a, line) => {
    const product = products.find(p => p.id === line.productId);
    return a + calcLineCost(line, product, batches);
  }, 0), 0);
  const netProfit = totalSales - totalCOGS - totalExpenses;

  const topDebtors = [...shopkeepers].filter(s => s.balance > 0).sort((a, b) => b.balance - a.balance);

  const aging = { '0–30 days': 0, '31–60 days': 0, '60+ days': 0 };
  filteredInvoices.filter(i => i.status !== 'paid').forEach(inv => {
    const b = ageBucket(inv.date);
    aging[b.label] = (aging[b.label] || 0) + inv.total;
  });
  const maxAging = Math.max(...Object.values(aging), 1);

  const topProducts = [...products]
    .filter(p => activeBrand === 'all' || p.brandId === activeBrand)
    .sort((a, b) => b.stock - a.stock).slice(0, 5);

  const handleSpeak = () => {
    speakSummary({ recovered: totalRecovered, receivables: totalReceivables, profit: netProfit, expenses: totalExpenses }, audioLang);
  };

  return (
    <div>
      <PageHeader
        title={brandName ? `${brandName} — Dashboard` : 'Executive Dashboard'}
        subtitle="Live financial and operational snapshot"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={audioLang} onChange={e => setAudioLang(e.target.value)}
              style={{ padding: '6px 10px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
              <option value="en">🇬🇧 English</option>
              <option value="ur">🇵🇰 اردو</option>
            </select>
            <button onClick={handleSpeak} style={{ padding: '7px 14px', background: 'var(--accent-dim)', color: 'var(--accent)', border: '0.5px solid rgba(79,142,247,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              🔊 Read summary
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total recovered" value={fmt(totalRecovered)} sub="Cash collected to date" color="var(--green)" icon="💰" />
        <KpiCard label="Receivables" value={fmt(totalReceivables)} sub={`${topDebtors.length} outstanding accounts`} color="var(--amber)" icon="📋" />
        <KpiCard label="Net profit" value={fmt(netProfit)} sub={`Margin: ${totalSales ? ((netProfit / totalSales) * 100).toFixed(1) : 0}%`} color="var(--accent)" icon="📈" />
        <KpiCard label="Total expenses" value={fmt(totalExpenses)} sub="Operating costs" color="var(--red)" icon="💸" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Monthly sales trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySales} barSize={16}>
              <XAxis dataKey="month" tick={{ fill: '#565e7a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#565e7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₨${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1e2535', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={v => [`₨${v.toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8b92a8' }} />
              {(activeBrand === 'all' || activeBrand === 'b1') && <Bar dataKey="brighto" name="Brighto" fill="#4f8ef7" radius={[3, 3, 0, 0]} />}
              {(activeBrand === 'all' || activeBrand === 'b2') && <Bar dataKey="hoshi" name="Hoshi" fill="#a78bfa" radius={[3, 3, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Aging receivables</div>
          <StatBar label="0–30 days" value={aging['0–30 days']} max={maxAging} color="var(--green)" />
          <StatBar label="31–60 days" value={aging['31–60 days']} max={maxAging} color="var(--amber)" />
          <StatBar label="60+ days" value={aging['60+ days']} max={maxAging} color="var(--red)" />
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total outstanding</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {fmt(Object.values(aging).reduce((a, b) => a + b, 0))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Top outstanding accounts</div>
          {topDebtors.slice(0, 5).map(sk => {
            const lastInv = filteredInvoices.filter(i => i.shopkeeperId === sk.id && i.status !== 'paid').sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            const bucket = lastInv ? ageBucket(lastInv.date) : null;
            return (
              <div key={sk.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{sk.shopName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sk.owner}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: sk.balance > 50000 ? 'var(--red)' : 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{sk.balance.toLocaleString()}</div>
                  {bucket && <span style={{ fontSize: 10, color: bucket.color }}>{bucket.label}</span>}
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Inventory snapshot</div>
          {topProducts.map(p => {
            const brand = brands.find(b => b.id === p.brandId);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.sku}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <Badge color={p.stock < 100 ? 'red' : p.stock < 300 ? 'amber' : 'green'}>{p.stock} {p.unit}</Badge>
                  <span style={{ fontSize: 10, color: brand?.color }}>{brand?.name}</span>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
