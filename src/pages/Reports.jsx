import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import { Card, Table, Badge, PageHeader, EmptyState } from '../components/UI';
import { calcLineProfit } from '../utils/cogs';

const GROUPS = ['Sales', 'Customers', 'Profit', 'Delivery'];

function groupBy(arr, keyFn) {
  const map = new Map();
  arr.forEach(item => {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  });
  return map;
}

function fmt(n) { return `₨${Math.round(n || 0).toLocaleString()}`; }

function TabRow({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: value === o ? 'var(--accent)' : 'var(--bg2)',
          color: value === o ? '#fff' : 'var(--text2)',
          border: value === o ? 'none' : '0.5px solid var(--border2)', cursor: 'pointer',
        }}>{o}</button>
      ))}
    </div>
  );
}

export default function Reports({ activeBrand }) {
  const { invoices, products, brands, categories, shopkeepers, batches } = useStore();
  const [group, setGroup] = useState('Sales');
  const [salesPeriod, setSalesPeriod] = useState('Monthly');

  const filteredInvoices = useMemo(
    () => activeBrand === 'all' ? invoices : invoices.filter(i => i.brandId === activeBrand),
    [invoices, activeBrand]
  );

  // ── Sales reports ──────────────────────────────────────────────────────────
  const salesByPeriod = useMemo(() => {
    const periodKey = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr || 'Unknown';
      if (salesPeriod === 'Daily') return dateStr;
      if (salesPeriod === 'Annual') return String(d.getFullYear());
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    const map = groupBy(filteredInvoices, i => periodKey(i.date));
    return [...map.entries()]
      .map(([period, invs]) => ({ period, total: invs.reduce((s, i) => s + i.total, 0), count: invs.length }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredInvoices, salesPeriod]);

  const salesByProduct = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach(inv => (inv.items || []).forEach(line => {
      const name = line.manualName || products.find(p => p.id === line.productId)?.name || line.productId || 'Unknown';
      const rev = (Number(line.qty) || 0) * ((Number(line.unitPrice) || 0) - (Number(line.discount) || 0));
      const cur = map.get(name) || { name, qty: 0, revenue: 0 };
      cur.qty += Number(line.qty) || 0;
      cur.revenue += rev;
      map.set(name, cur);
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [filteredInvoices, products]);

  const salesByBrand = useMemo(() => {
    const map = groupBy(filteredInvoices, i => i.brandId);
    return [...map.entries()]
      .map(([bId, invs]) => ({ brand: brands.find(b => b.id === bId)?.name || bId, total: invs.reduce((s, i) => s + i.total, 0), count: invs.length }))
      .sort((a, b) => b.total - a.total);
  }, [filteredInvoices, brands]);

  const salesByCategory = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach(inv => (inv.items || []).forEach(line => {
      const p = products.find(pr => pr.id === line.productId);
      const cat = categories.find(c => c.id === p?.categoryId);
      const name = cat ? `${cat.icon} ${cat.name}` : 'Uncategorized';
      const rev = (Number(line.qty) || 0) * ((Number(line.unitPrice) || 0) - (Number(line.discount) || 0));
      const cur = map.get(name) || { name, revenue: 0 };
      cur.revenue += rev;
      map.set(name, cur);
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [filteredInvoices, products, categories]);

  const salesBySalesperson = useMemo(() => {
    const map = groupBy(filteredInvoices.filter(i => i.salesperson), i => i.salesperson);
    return [...map.entries()]
      .map(([sp, invs]) => ({ salesperson: sp, total: invs.reduce((s, i) => s + i.total, 0), count: invs.length }))
      .sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  const salesByBranch = useMemo(() => {
    const map = groupBy(filteredInvoices.filter(i => i.branch), i => i.branch);
    return [...map.entries()]
      .map(([br, invs]) => ({ branch: br, total: invs.reduce((s, i) => s + i.total, 0), count: invs.length }))
      .sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  // ── Customer reports ───────────────────────────────────────────────────────
  const topCustomers = useMemo(() => shopkeepers
    .map(sk => {
      const skInvoices = filteredInvoices.filter(i => i.shopkeeperId === sk.id);
      return { ...sk, totalPurchased: skInvoices.reduce((s, i) => s + i.total, 0), invoiceCount: skInvoices.length };
    })
    .filter(sk => sk.invoiceCount > 0)
    .sort((a, b) => b.totalPurchased - a.totalPurchased), [shopkeepers, filteredInvoices]);

  const outstandingReceivables = useMemo(() => [...shopkeepers].filter(s => s.balance > 0).sort((a, b) => b.balance - a.balance), [shopkeepers]);

  // ── Profit reports ─────────────────────────────────────────────────────────
  const invoiceProfits = useMemo(() => filteredInvoices.map(inv => {
    const profit = (inv.items || []).reduce((s, line) => {
      const p = products.find(pr => pr.id === line.productId);
      return s + calcLineProfit(line, p, batches);
    }, 0);
    return { ...inv, profit, marginPct: inv.total ? (profit / inv.total * 100) : 0 };
  }), [filteredInvoices, products, batches]);

  const totalGrossProfit = invoiceProfits.reduce((s, i) => s + i.profit, 0);
  const totalRevenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
  const overallMarginPct = totalRevenue ? (totalGrossProfit / totalRevenue * 100) : 0;

  const productProfitability = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach(inv => (inv.items || []).forEach(line => {
      const p = products.find(pr => pr.id === line.productId);
      const name = line.manualName || p?.name || 'Unknown';
      const profit = calcLineProfit(line, p, batches);
      const cur = map.get(name) || { name, profit: 0, qty: 0 };
      cur.profit += profit;
      cur.qty += Number(line.qty) || 0;
      map.set(name, cur);
    }));
    return [...map.values()].sort((a, b) => b.profit - a.profit);
  }, [filteredInvoices, products, batches]);

  const discountAnalysis = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach(inv => (inv.items || []).forEach(line => {
      if (!line.discount) return;
      const name = line.manualName || products.find(p => p.id === line.productId)?.name || 'Unknown';
      const amt = (Number(line.qty) || 0) * (Number(line.discount) || 0);
      map.set(name, (map.get(name) || 0) + amt);
    }));
    return [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredInvoices, products]);

  const totalDiscountGiven = discountAnalysis.reduce((s, d) => s + d.amount, 0);

  // ── Delivery reports ───────────────────────────────────────────────────────
  const pendingDeliveries = filteredInvoices.filter(i => (i.delivery?.status || 'Pending') !== 'Delivered');
  const completedDeliveries = filteredInvoices.filter(i => i.delivery?.status === 'Delivered');
  const installationSchedule = filteredInvoices.filter(i => i.warranty?.installationRequired === 'Yes');
  const warrantyRegister = filteredInvoices.filter(i => i.warranty?.type);

  const customerLabel = (inv) => inv.isGuest ? (inv.guestName || 'Guest') : (shopkeepers.find(s => s.id === inv.shopkeeperId)?.shopName || '—');

  return (
    <div>
      <PageHeader title="📊 Reports" subtitle="Sales, customer, profit, and delivery analytics" />
      <TabRow options={GROUPS} value={group} onChange={setGroup} />

      {/* ── SALES ─────────────────────────────────────────────────────────── */}
      {group === 'Sales' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Sales over time</div>
            <TabRow options={['Daily', 'Monthly', 'Annual']} value={salesPeriod} onChange={setSalesPeriod} />
          </div>
          <Card style={{ padding: 0, marginBottom: 20 }}>
            {salesByPeriod.length === 0 ? <EmptyState icon="📈" title="No sales yet" description="Sales will appear here once invoices are created." /> : (
              <Table columns={[
                { key: 'period', label: 'Period' },
                { key: 'count', label: 'Invoices', align: 'right' },
                { key: 'total', label: 'Revenue', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(v)}</strong> },
              ]} data={[...salesByPeriod].reverse()} />
            )}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Product-wise sales</div>
              <Card style={{ padding: 0 }}>
                <Table columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'qty', label: 'Qty sold', align: 'right' },
                  { key: 'revenue', label: 'Revenue', align: 'right', render: v => fmt(v) },
                ]} data={salesByProduct.slice(0, 15)} />
              </Card>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Category-wise sales</div>
              <Card style={{ padding: 0 }}>
                <Table columns={[
                  { key: 'name', label: 'Category' },
                  { key: 'revenue', label: 'Revenue', align: 'right', render: v => fmt(v) },
                ]} data={salesByCategory} />
              </Card>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Brand-wise sales</div>
              <Card style={{ padding: 0 }}>
                <Table columns={[
                  { key: 'brand', label: 'Brand' },
                  { key: 'total', label: 'Revenue', align: 'right', render: v => fmt(v) },
                ]} data={salesByBrand} />
              </Card>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Salesperson performance</div>
              <Card style={{ padding: 0 }}>
                {salesBySalesperson.length === 0 ? <EmptyState icon="🧑‍💼" title="No data" description="Add a salesperson on invoices to see this." /> : (
                  <Table columns={[
                    { key: 'salesperson', label: 'Salesperson' },
                    { key: 'total', label: 'Revenue', align: 'right', render: v => fmt(v) },
                  ]} data={salesBySalesperson} />
                )}
              </Card>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Branch-wise sales</div>
              <Card style={{ padding: 0 }}>
                {salesByBranch.length === 0 ? <EmptyState icon="🏢" title="No data" description="Add a branch on invoices to see this." /> : (
                  <Table columns={[
                    { key: 'branch', label: 'Branch' },
                    { key: 'total', label: 'Revenue', align: 'right', render: v => fmt(v) },
                  ]} data={salesByBranch} />
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMERS ─────────────────────────────────────────────────────── */}
      {group === 'Customers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Top customers</div>
            <Card style={{ padding: 0 }}>
              <Table columns={[
                { key: 'shopName', label: 'Shop' },
                { key: 'invoiceCount', label: 'Invoices', align: 'right' },
                { key: 'totalPurchased', label: 'Total purchased', align: 'right', render: v => fmt(v) },
              ]} data={topCustomers.slice(0, 15)} />
            </Card>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Outstanding receivables</div>
            <Card style={{ padding: 0 }}>
              {outstandingReceivables.length === 0 ? <EmptyState icon="✅" title="All clear" description="No outstanding balances." /> : (
                <Table columns={[
                  { key: 'shopName', label: 'Shop' },
                  { key: 'balance', label: 'Balance', align: 'right', render: v => <strong style={{ color: 'var(--red)' }}>{fmt(v)}</strong> },
                ]} data={outstandingReceivables} />
              )}
            </Card>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              For full transaction-level customer ledgers, see the <strong>Ledger</strong> page.
            </div>
          </div>
        </div>
      )}

      {/* ── PROFIT ────────────────────────────────────────────────────────── */}
      {group === 'Profit' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total revenue</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(totalRevenue)}</div></Card>
            <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total gross profit</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(totalGrossProfit)}</div></Card>
            <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Overall margin</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>{overallMarginPct.toFixed(1)}%</div></Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Product profitability</div>
              <Card style={{ padding: 0 }}>
                <Table columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'qty', label: 'Qty sold', align: 'right' },
                  { key: 'profit', label: 'Gross profit', align: 'right', render: v => <span style={{ color: v >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{fmt(v)}</span> },
                ]} data={productProfitability.slice(0, 15)} />
              </Card>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Discount analysis <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(total given: {fmt(totalDiscountGiven)})</span></div>
              <Card style={{ padding: 0 }}>
                {discountAnalysis.length === 0 ? <EmptyState icon="🏷️" title="No discounts given" description="Line-item discounts will show up here." /> : (
                  <Table columns={[
                    { key: 'name', label: 'Product' },
                    { key: 'amount', label: 'Discount given', align: 'right', render: v => fmt(v) },
                  ]} data={discountAnalysis.slice(0, 15)} />
                )}
              </Card>
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 13, margin: '20px 0 10px' }}>Margin by invoice</div>
          <Card style={{ padding: 0 }}>
            <Table columns={[
              { key: 'invoiceNo', label: 'Invoice', render: (v, row) => v || row.id.slice(-8).toUpperCase() },
              { key: 'customer', label: 'Customer', render: (_, row) => customerLabel(row) },
              { key: 'total', label: 'Revenue', align: 'right', render: v => fmt(v) },
              { key: 'profit', label: 'Profit', align: 'right', render: v => <span style={{ color: v >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{fmt(v)}</span> },
              { key: 'marginPct', label: 'Margin', align: 'right', render: v => `${v.toFixed(1)}%` },
            ]} data={[...invoiceProfits].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)} />
          </Card>
        </div>
      )}

      {/* ── DELIVERY ──────────────────────────────────────────────────────── */}
      {group === 'Delivery' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Pending deliveries ({pendingDeliveries.length})</div>
            <Card style={{ padding: 0 }}>
              {pendingDeliveries.length === 0 ? <EmptyState icon="🚚" title="Nothing pending" description="All caught up." /> : (
                <Table columns={[
                  { key: 'customer', label: 'Customer', render: (_, row) => customerLabel(row) },
                  { key: 'date', label: 'Invoice date' },
                  { key: 'status', label: 'Status', render: (_, row) => <Badge color="amber">{row.delivery?.status || 'Pending'}</Badge> },
                ]} data={pendingDeliveries} />
              )}
            </Card>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Completed deliveries ({completedDeliveries.length})</div>
            <Card style={{ padding: 0 }}>
              {completedDeliveries.length === 0 ? <EmptyState icon="📦" title="None yet" description="Delivered invoices will show here." /> : (
                <Table columns={[
                  { key: 'customer', label: 'Customer', render: (_, row) => customerLabel(row) },
                  { key: 'deliveryDate', label: 'Delivered', render: (_, row) => row.delivery?.date || '—' },
                ]} data={completedDeliveries} />
              )}
            </Card>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Installation schedule ({installationSchedule.length})</div>
            <Card style={{ padding: 0 }}>
              {installationSchedule.length === 0 ? <EmptyState icon="🔧" title="None scheduled" description="Invoices marked 'installation required' show here." /> : (
                <Table columns={[
                  { key: 'customer', label: 'Customer', render: (_, row) => customerLabel(row) },
                  { key: 'date', label: 'Invoice date' },
                ]} data={installationSchedule} />
              )}
            </Card>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Warranty register ({warrantyRegister.length})</div>
            <Card style={{ padding: 0 }}>
              {warrantyRegister.length === 0 ? <EmptyState icon="🛡️" title="No warranties on record" description="Invoices with warranty info show here." /> : (
                <Table columns={[
                  { key: 'customer', label: 'Customer', render: (_, row) => customerLabel(row) },
                  { key: 'type', label: 'Type', render: (_, row) => row.warranty?.type || '—' },
                  { key: 'expiry', label: 'Expires', render: (_, row) => row.warranty?.expiryDate || '—' },
                ]} data={warrantyRegister} />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
