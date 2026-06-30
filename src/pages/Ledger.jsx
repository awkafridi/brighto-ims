import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, PageHeader } from '../components/UI';
import { useAudio } from '../hooks/useAudio';

export default function Ledger() {
  const { ledgerEntries, shopkeepers } = useStore();
  const { speak } = useAudio();
  const [shopFilter, setShopFilter] = useState('all');
  const [audioLang, setAudioLang] = useState('en');

  const filtered = shopFilter === 'all' ? ledgerEntries : ledgerEntries.filter(e => e.shopkeeperId === shopFilter);
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDebits = filtered.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredits = filtered.reduce((s, e) => s + (e.credit || 0), 0);
  const netReceivable = totalDebits - totalCredits;

  const handleSpeak = () => {
    const sk = shopFilter !== 'all' ? shopkeepers.find(s => s.id === shopFilter) : null;
    if (audioLang === 'ur') {
      const text = sk
        ? `${sk.shopName} کا حساب۔ کل واجبات: ${totalDebits.toLocaleString()} روپے۔ کل ادائیگی: ${totalCredits.toLocaleString()} روپے۔ باقی: ${netReceivable.toLocaleString()} روپے۔`
        : `مجموعی حساب۔ کل واجبات: ${totalDebits.toLocaleString()} روپے۔ کل ادائیگی: ${totalCredits.toLocaleString()} روپے۔ باقی: ${netReceivable.toLocaleString()} روپے۔`;
      speak(text, 'ur');
    } else {
      const text = sk
        ? `Ledger for ${sk.shopName}. Total debits: ${totalDebits.toLocaleString()} rupees. Total payments: ${totalCredits.toLocaleString()} rupees. Net outstanding: ${netReceivable.toLocaleString()} rupees.`
        : `Full ledger summary. Total debits: ${totalDebits.toLocaleString()} rupees. Total payments: ${totalCredits.toLocaleString()} rupees. Net outstanding: ${netReceivable.toLocaleString()} rupees.`;
      speak(text, 'en');
    }
  };

  return (
    <div>
      <PageHeader title="Ledger" subtitle="Complete debit/credit transaction record" />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">All shopkeepers</option>
          {shopkeepers.map(s => <option key={s.id} value={s.id}>{s.shopName}</option>)}
        </select>
        <select value={audioLang} onChange={e => setAudioLang(e.target.value)} style={{ padding: '8px 10px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
          <option value="en">🇬🇧 English</option>
          <option value="ur">🇵🇰 اردو</option>
        </select>
        <button onClick={handleSpeak} style={{ padding: '7px 14px', background: 'var(--accent-dim)', color: 'var(--accent)', border: '0.5px solid rgba(79,142,247,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>🔊 Read ledger</button>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)' }}>{filtered.length} entries</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total debits</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{totalDebits.toLocaleString()}</div></Card>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total credits</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{totalCredits.toLocaleString()}</div></Card>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Net receivable</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{netReceivable.toLocaleString()}</div></Card>
      </div>

      <Card style={{ padding: 0 }}>
        <Table columns={[
          { key: 'date', label: 'Date' },
          { key: 'shopkeeperId', label: 'Shopkeeper', render: v => shopkeepers.find(s => s.id === v)?.shopName || v },
          { key: 'type', label: 'Type', render: v => <Badge color={v === 'payment' ? 'green' : 'amber'}>{v}</Badge> },
          { key: 'invoiceId', label: 'Invoice', render: v => v ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>{v.toUpperCase().slice(0, 10)}</span> : '—' },
          { key: 'debit', label: 'Debit', align: 'right', render: v => v > 0 ? <span style={{ color: 'var(--red)' }}>+₨{v.toLocaleString()}</span> : <span style={{ color: 'var(--text3)' }}>—</span> },
          { key: 'credit', label: 'Credit', align: 'right', render: v => v > 0 ? <span style={{ color: 'var(--green)' }}>−₨{v.toLocaleString()}</span> : <span style={{ color: 'var(--text3)' }}>—</span> },
          { key: 'balance', label: 'Balance', align: 'right', render: v => <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>₨{v.toLocaleString()}</strong> },
        ]} data={sorted} />
      </Card>
    </div>
  );
}
