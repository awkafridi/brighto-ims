import { useState } from 'react';
import { useStore } from '../data/store';
import { Badge, Card, Table, Modal, Input, Btn, PageHeader } from '../components/UI';
import { useAudio } from '../hooks/useAudio';
import { openWhatsApp, buildReminderMessage, buildPaymentReceivedMessage, buildAccountSummaryMessage } from '../utils/whatsapp';

export default function Shopkeepers() {
  const { shopkeepers, ledgerEntries, invoices, brands, addShopkeeper, editShopkeeper, deleteShopkeeper, recordPayment } = useStore();
  const { speakLedger } = useAudio();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingWhatsApp, setPendingWhatsApp] = useState(null);
  const [search, setSearch] = useState('');
  const [audioLang, setAudioLang] = useState('en');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Cash' });
  const [form, setForm] = useState({ shopName: '', owner: '', address: '', phone: '' });

  const filtered = shopkeepers.filter(s =>
    s.shopName.toLowerCase().includes(search.toLowerCase()) ||
    (s.owner || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  const selectedLedger = selected ? ledgerEntries.filter(e => e.shopkeeperId === selected.id) : [];
  const selectedInvoices = selected ? invoices.filter(i => i.shopkeeperId === selected.id).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

  const openAdd = () => { setForm({ shopName: '', owner: '', address: '', phone: '' }); setEditing(null); setShowAdd(true); };
  const openEdit = (sk) => { setForm({ shopName: sk.shopName, owner: sk.owner, address: sk.address, phone: sk.phone }); setEditing(sk); setShowAdd(true); };

  const handleSave = () => {
    if (!form.shopName.trim()) return;
    if (editing) { editShopkeeper(editing.id, form); setEditing(null); }
    else addShopkeeper(form);
    setShowAdd(false);
  };

  const handleDelete = (sk) => {
    if (confirmDelete === sk.id) { deleteShopkeeper(sk.id); setConfirmDelete(null); if (selected?.id === sk.id) setSelected(null); }
    else { setConfirmDelete(sk.id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const handlePayment = () => {
    if (!paymentForm.amount || isNaN(paymentForm.amount)) return;
    const amount = Number(paymentForm.amount);
    const previousBalance = selected.balance;
    const newBalance = Math.max(0, previousBalance - amount);
    recordPayment(selected.id, amount, paymentForm.date);
    setSelected(prev => ({ ...prev, balance: newBalance }));
    setShowPayment(false);

    // Build WhatsApp message and show in-app confirm instead of blocked window.confirm
    const brand = brands[0];
    const message = buildPaymentReceivedMessage({
      shopName: selected.shopName, brandName: brand?.name,
      amountReceived: amount, previousBalance, newBalance, date: paymentForm.date,
    });
    setPendingWhatsApp({ phone: selected.phone, message, shopName: selected.shopName });
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Cash' });
  };

  const handleReminder = (sk) => {
    openWhatsApp(sk.phone, buildReminderMessage({ shopName: sk.shopName, balance: sk.balance }));
  };

  const handleAccountSummary = (sk) => {
    const skInvoices = invoices.filter(i => i.shopkeeperId === sk.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalPurchased = skInvoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = ledgerEntries.filter(e => e.shopkeeperId === sk.id && e.type === 'payment').reduce((s, e) => s + e.credit, 0);
    openWhatsApp(sk.phone, buildAccountSummaryMessage({
      shopName: sk.shopName, totalPurchased, totalPaid, balance: sk.balance, recentInvoices: skInvoices,
    }));
  };

  return (
    <div>
      <PageHeader title="Shopkeepers" subtitle="Customer profiles and credit accounts" action={<Btn onClick={openAdd}>+ Add shopkeeper</Btn>} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input placeholder="Search by shop, owner, or phone..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total accounts</div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{shopkeepers.length}</div></Card>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Active credit</div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>{shopkeepers.filter(s => s.balance > 0).length}</div></Card>
        <Card><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total receivable</div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--red)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{shopkeepers.reduce((s, sk) => s + sk.balance, 0).toLocaleString()}</div></Card>
      </div>

      <Card style={{ padding: 0 }}>
        <Table onRowClick={setSelected} columns={[
          { key: 'shopName', label: 'Shop name', render: (v, row) => (<div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.owner}</div></div>) },
          { key: 'phone', label: 'Phone', muted: true },
          { key: 'address', label: 'Area', muted: true, render: v => (v || '').split(',').slice(-2).join(',').trim() },
          { key: 'balance', label: 'Balance', align: 'right', render: v => v === 0 ? <Badge color="green">Clear</Badge> : <span style={{ fontWeight: 700, color: v > 50000 ? 'var(--red)' : 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{v.toLocaleString()}</span> },
          { key: 'actions', label: '', align: 'right', render: (_, row) => (
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => handleDelete(row)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>{confirmDelete === row.id ? 'Sure?' : 'Del'}</button>
              <button onClick={() => handleReminder(row)} title="Send balance reminder" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(37,211,102,0.1)', color: '#25d366', border: 'none', cursor: 'pointer' }}>💬</button>
            </div>
          )},
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.shopName} onClose={() => setSelected(null)} width={700}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Owner</div><div style={{ fontWeight: 500 }}>{selected.owner}</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Phone</div><div style={{ fontWeight: 500 }}>{selected.phone}</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Address</div><div style={{ fontWeight: 500, fontSize: 12 }}>{selected.address}</div></div>
          </div>

          {/* Purchase history summary — old selling + remaining balance reminder */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total purchased (all time)</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>₨{selectedInvoices.reduce((s, i) => s + i.total, 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total paid (all time)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{selectedLedger.filter(e => e.type === 'payment').reduce((s, e) => s + e.credit, 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Invoices on record</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{selectedInvoices.length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Current remaining balance</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: selected.balance > 0 ? 'var(--red)' : 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>₨{(shopkeepers.find(s => s.id === selected.id)?.balance || 0).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={audioLang} onChange={e => setAudioLang(e.target.value)} style={{ padding: '5px 8px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12 }}>
                <option value="en">🇬🇧 EN</option>
                <option value="ur">🇵🇰 UR</option>
              </select>
              <Btn variant="ghost" onClick={() => speakLedger(shopkeepers.find(s => s.id === selected.id) || selected, selectedLedger, audioLang)}>🔊</Btn>
              <Btn variant="ghost" onClick={() => handleAccountSummary(selected)}>💬 Send summary</Btn>
              <Btn variant="ghost" onClick={() => handleReminder(selected)}>💬 Reminder</Btn>
              <Btn onClick={() => setShowPayment(true)}>Record payment</Btn>
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Transaction ledger</div>
          <Table columns={[
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type', render: v => <Badge color={v === 'payment' ? 'green' : 'amber'}>{v}</Badge> },
            { key: 'debit', label: 'Debit (₨)', align: 'right', render: v => v > 0 ? <span style={{ color: 'var(--red)' }}>+{v.toLocaleString()}</span> : '—' },
            { key: 'credit', label: 'Credit (₨)', align: 'right', render: v => v > 0 ? <span style={{ color: 'var(--green)' }}>−{v.toLocaleString()}</span> : '—' },
            { key: 'balance', label: 'Balance', align: 'right', render: v => <strong>₨{v.toLocaleString()}</strong> },
          ]} data={selectedLedger} />

          {showPayment && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border2)' }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Record payment received</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Amount (₨)" type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                <Input label="Date" type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <Input label="Payment method" value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))} placeholder="Cash / Bank / Cheque" />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Btn variant="ghost" onClick={() => setShowPayment(false)}>Cancel</Btn>
                <Btn onClick={handlePayment}>Save payment & notify</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showAdd && (
        <Modal title={editing ? 'Edit shopkeeper' : 'Add shopkeeper'} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <Input label="Shop name" value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} placeholder="e.g. Madina Electric Store" />
          <Input label="Owner name" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="e.g. Zafar Ahmed" />
          <Input label="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92-300-0000000" />
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Shop #, Area, City" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Btn>
            <Btn onClick={handleSave}>{editing ? 'Save changes' : 'Add shopkeeper'}</Btn>
          </div>
        </Modal>
      )}

      {/* In-app WhatsApp confirm dialog */}
      {pendingWhatsApp && (
        <Modal title="💬 Send WhatsApp message?" onClose={() => setPendingWhatsApp(null)} width={500}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Send a WhatsApp message to <strong style={{ color: 'var(--text)' }}>{pendingWhatsApp.shopName}</strong>?
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 220, overflowY: 'auto' }}>
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
