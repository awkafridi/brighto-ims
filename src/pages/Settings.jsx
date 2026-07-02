import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '../data/store';
import { useTheme } from '../hooks/useTheme';
import { Card, Modal, Input, Btn, PageHeader, Badge } from '../components/UI';
import { PROVIDERS, getActiveProvider, setActiveProvider, getApiKey, setApiKey } from '../api/aiProvider';

const SHEETS_URL_KEY    = 'ims_sheets_webhook_url';
const SHEETS_AUTO_KEY   = 'ims_sheets_autosave';
const USER_PROFILE_KEY  = 'ims_user';
const USERS_KEY         = 'ims_users_list';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}'); } catch { return {}; }
}

export default function Settings() {
  const store = useStore();
  const { theme, toggleTheme } = useTheme();

  // ── Google Sheets state ────────────────────────────────────────────────────
  const [sheetsUrl, setSheetsUrl]   = useState(localStorage.getItem(SHEETS_URL_KEY) || '');
  const [autosave, setAutosave]     = useState(localStorage.getItem(SHEETS_AUTO_KEY) === 'true');
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSync, setLastSync]     = useState(localStorage.getItem('ims_last_sync') || null);
  const syncTimeout = useRef(null);

  // ── AI provider state ──────────────────────────────────────────────────────
  const [activeProvider, setActiveProviderState] = useState(getActiveProvider());
  const [keys, setKeys] = useState(() => {
    const obj = {};
    Object.keys(PROVIDERS).forEach(id => { obj[id] = getApiKey(id); });
    return obj;
  });
  const [savedFlash, setSavedFlash] = useState(null);
  const [showKey, setShowKey] = useState(false);

  // ── Password / profile state ───────────────────────────────────────────────
  const [currentUser] = useState(getCurrentUser);
  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({ username: currentUser.username || 'admin', fullName: currentUser.name || 'Admin' });
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Business info state ────────────────────────────────────────────────────
  const [bizForm, setBizForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ims_biz_info') || '{}'); } catch { return {}; }
  });
  const [bizSaved, setBizSaved] = useState(false);

  // ── Data management state ──────────────────────────────────────────────────
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDemo,  setConfirmDemo]  = useState(false);
  const [showGuide, setShowGuide]       = useState(false);

  // Auto-save to Sheets on data change
  useEffect(() => {
    localStorage.setItem(SHEETS_URL_KEY, sheetsUrl);
  }, [sheetsUrl]);
  useEffect(() => {
    localStorage.setItem(SHEETS_AUTO_KEY, String(autosave));
  }, [autosave]);
  useEffect(() => {
    if (!autosave || !sheetsUrl) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => syncToSheets(true), 2500);
    return () => clearTimeout(syncTimeout.current);
  }, [store.products, store.shopkeepers, store.invoices, store.suppliers, store.expenses, store.ledgerEntries, autosave, sheetsUrl]);

  const syncToSheets = async (silent = false) => {
    if (!sheetsUrl) { if (!silent) setSyncStatus('error'); return; }
    setSyncStatus('syncing');
    try {
      await fetch(sheetsUrl, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          brands: store.brands, categories: store.categories, suppliers: store.suppliers,
          products: store.products, batches: store.batches, shopkeepers: store.shopkeepers,
          invoices: store.invoices, ledgerEntries: store.ledgerEntries, expenses: store.expenses,
        }),
      });
      const now = new Date().toLocaleString();
      localStorage.setItem('ims_last_sync', now);
      setLastSync(now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  // ── AI provider handlers ───────────────────────────────────────────────────
  const handleProviderSelect = (id) => { setActiveProviderState(id); setActiveProvider(id); };
  const handleKeyChange = (id, val) => setKeys(prev => ({ ...prev, [id]: val }));
  const handleKeySave = (id) => {
    setApiKey(id, keys[id]);
    setSavedFlash(id);
    setTimeout(() => setSavedFlash(null), 2000);
  };

  // ── Password change ────────────────────────────────────────────────────────
  const handlePasswordChange = () => {
    setPwError(''); setPwSuccess('');
    const user = getCurrentUser();
    const users = getUsers();
    const CREDENTIALS = [
      { username: 'admin', password: 'admin123' },
      { username: 'staff', password: 'staff123' },
      ...users,
    ];
    const match = CREDENTIALS.find(c => c.username === user.username && c.password === pwForm.current);
    if (!match) { setPwError('Current password is incorrect.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }

    // Save updated password
    const updatedUsers = users.filter(u => u.username !== user.username);
    updatedUsers.push({ username: user.username, password: pwForm.newPw, name: user.name, role: user.role });
    saveUsers(updatedUsers);
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwSuccess('✓ Password changed successfully!');
  };

  // ── Profile update ─────────────────────────────────────────────────────────
  const handleProfileSave = () => {
    const user = getCurrentUser();
    const updated = { ...user, username: profileForm.username, name: profileForm.fullName };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // ── Business info save ─────────────────────────────────────────────────────
  const handleBizSave = () => {
    localStorage.setItem('ims_biz_info', JSON.stringify(bizForm));
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 2500);
  };

  // ── Excel export ───────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheets = {
      Products: store.products,
      Suppliers: store.suppliers,
      Shopkeepers: store.shopkeepers,
      Invoices: store.invoices.map(i => ({ ...i, items: JSON.stringify(i.items || []) })),
      Ledger: store.ledgerEntries,
      Expenses: store.expenses,
    };
    Object.entries(sheets).forEach(([name, rows]) => {
      if (rows?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
    });
    XLSX.writeFile(wb, `brighto-ims-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleClearAll = () => {
    if (confirmClear) { store.clearAll(); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 4000); }
  };
  const handleRestoreDemo = () => {
    if (confirmDemo) { store.resetAll(); setConfirmDemo(false); }
    else { setConfirmDemo(true); setTimeout(() => setConfirmDemo(false), 4000); }
  };

  const section = (title, children) => (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, paddingBottom: 10, borderBottom: '0.5px solid var(--border)', color: 'var(--text)' }}>{title}</div>
      {children}
    </Card>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account, appearance, AI, data management" />

      {/* ── Appearance ── */}
      {section('🎨 Appearance', (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Theme</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Currently: {theme === 'dark' ? 'Dark mode 🌙' : 'Light mode ☀️'}</div>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 20, padding: 3 }}>
            {['dark','light'].map(t => (
              <button key={t} onClick={() => theme !== t && toggleTheme()} style={{
                padding: '6px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: theme === t ? 'var(--accent)' : 'transparent',
                color: theme === t ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}>{t === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
            ))}
          </div>
        </div>
      ))}

      {/* ── Business info ── */}
      {section('🏢 Business Information', (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Business / Brand name" value={bizForm.businessName || ''} onChange={e => setBizForm(f => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Brighto Lights" />
            <Input label="Owner name" value={bizForm.ownerName || ''} onChange={e => setBizForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="e.g. Ahmed Karimi" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Phone / WhatsApp" value={bizForm.phone || ''} onChange={e => setBizForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92-300-0000000" />
            <Input label="NTN / Tax number (optional)" value={bizForm.ntn || ''} onChange={e => setBizForm(f => ({ ...f, ntn: e.target.value }))} placeholder="NTN-0000000-0" />
          </div>
          <Input label="Address" value={bizForm.address || ''} onChange={e => setBizForm(f => ({ ...f, address: e.target.value }))} placeholder="Warehouse / Office address" />
          <Input label="Invoice footer message (shown on invoices)" value={bizForm.invoiceNote || ''} onChange={e => setBizForm(f => ({ ...f, invoiceNote: e.target.value }))} placeholder="e.g. Thank you for your business! Returns accepted within 7 days." />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={handleBizSave}>{bizSaved ? '✓ Saved!' : 'Save business info'}</Btn>
          </div>
        </>
      ))}

      {/* ── Profile / Password ── */}
      {section('👤 Account & Password', (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Profile</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Username" value={profileForm.username} onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))} placeholder="admin" />
              <Input label="Full name" value={profileForm.fullName} onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Your name" />
            </div>
            <Btn onClick={handleProfileSave}>{profileSaved ? '✓ Saved!' : 'Save profile'}</Btn>
          </div>

          <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Change password</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Current password</div>
                <div style={{ position: 'relative' }}>
                  <input type={showKey ? 'text' : 'password'} value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••"
                    style={{ width: '100%', padding: '8px 36px 8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13, boxSizing: 'border-box' }} />
                  <button onClick={() => setShowKey(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>{showKey ? '🙈' : '👁'}</button>
                </div>
              </div>
              <Input label="New password" type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="min 6 characters" />
              <Input label="Confirm new password" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="repeat new password" />
            </div>
            {pwError && <div style={{ color: 'var(--red)', fontSize: 12, padding: '6px 10px', background: 'var(--red-dim)', borderRadius: 'var(--radius)', marginBottom: 10 }}>⚠ {pwError}</div>}
            {pwSuccess && <div style={{ color: 'var(--green)', fontSize: 12, padding: '6px 10px', background: 'var(--green-dim)', borderRadius: 'var(--radius)', marginBottom: 10 }}>{pwSuccess}</div>}
            <Btn onClick={handlePasswordChange}>🔒 Change password</Btn>
          </div>

          <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
              💡 Default credentials: <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>admin / admin123</code> and <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>staff / staff123</code>. Change these above for real use.
            </div>
          </div>
        </>
      ))}

      {/* ── AI Provider ── */}
      {section('🧠 AI Provider (OCR & Voice)', (
        <>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
            Pick a free AI for invoice scanning and voice commands. Your key stays only in this browser.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10, marginBottom: 14 }}>
            {Object.values(PROVIDERS).map(p => (
              <div key={p.id} onClick={() => handleProviderSelect(p.id)} style={{
                padding: '12px 14px', borderRadius: 'var(--radius)', cursor: 'pointer',
                background: activeProvider === p.id ? 'var(--accent-dim)' : 'var(--bg3)',
                border: activeProvider === p.id ? '1.5px solid var(--accent)' : '0.5px solid var(--border2)',
                transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.icon} {p.name}</span>
                  {activeProvider === p.id && <Badge color="accent">Active</Badge>}
                </div>
                <div style={{ fontSize: 11, color: p.supportsVision ? 'var(--green)' : 'var(--text3)' }}>
                  {p.supportsVision ? '✓ Supports photo OCR' : '✗ Voice only'}
                </div>
                <div style={{ fontSize: 11, color: getApiKey(p.id) ? 'var(--green)' : 'var(--amber)', marginTop: 2 }}>
                  {getApiKey(p.id) ? '✓ Key saved' : '⚠ No key yet'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{PROVIDERS[activeProvider].icon} {PROVIDERS[activeProvider].keyLabel}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10 }}>{PROVIDERS[activeProvider].keyHelp}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="password" placeholder={PROVIDERS[activeProvider].keyPlaceholder} value={keys[activeProvider]}
                onChange={e => handleKeyChange(activeProvider, e.target.value)}
                style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 13 }}
              />
              <Btn onClick={() => handleKeySave(activeProvider)}>{savedFlash === activeProvider ? '✓ Saved!' : 'Save key'}</Btn>
            </div>
          </div>
        </>
      ))}

      {/* ── Google Sheets Sync ── */}
      {section('📊 Google Sheets Backup', (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Auto-backup every change to your own Google Sheet — free, no credit card.</div>
            {syncStatus === 'syncing' && <Badge color="amber">Syncing...</Badge>}
            {syncStatus === 'success' && <Badge color="green">✓ Synced</Badge>}
            {syncStatus === 'error'   && <Badge color="red">Failed</Badge>}
          </div>
          <Input label="Google Apps Script Web App URL" placeholder="https://script.google.com/macros/s/.../exec" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={autosave} onChange={e => setAutosave(e.target.checked)} style={{ width: 15, height: 15 }} />
              Auto-save on every change
            </label>
            {lastSync && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Last synced: {lastSync}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => syncToSheets(false)} style={{ opacity: !sheetsUrl ? 0.5 : 1 }}>📤 Sync now</Btn>
            <Btn variant="ghost" onClick={() => setShowGuide(true)}>📖 Setup guide</Btn>
          </div>
        </>
      ))}

      {/* ── Export ── */}
      {section('📥 Export Data', (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn onClick={exportToExcel}>⬇ Download Excel (.xlsx)</Btn>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Exports all products, suppliers, shopkeepers, invoices, ledger, and expenses into one file.</span>
        </div>
      ))}

      {/* ── Data Management ── */}
      {section('🗑 Data Management', (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Btn variant="danger" onClick={handleClearAll}>
              {confirmClear ? '⚠ Click again to confirm — clears everything' : '🗑 Clear all data (start fresh)'}
            </Btn>
            <Btn variant="ghost" onClick={handleRestoreDemo}>
              {confirmDemo ? '⚠ Click again — loads sample data' : '↺ Restore demo data'}
            </Btn>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
            <strong>Clear all data</strong> — removes every product, invoice, shopkeeper, and transaction. Brands and categories are kept.<br/>
            <strong>Restore demo data</strong> — reloads the original 85 sample products and demo shopkeepers for testing.
          </div>
        </>
      ))}

      {/* ── App Info ── */}
      {section('ℹ About', (
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
          <div><strong>StockLedger IMS</strong> — Inventory & Ledger Management</div>
          <div>Version: <Badge color="accent">v10</Badge></div>
          <div>Data storage: Browser localStorage (offline-ready)</div>
          <div>Hosting: GitHub Pages (free)</div>
          <div style={{ marginTop: 8, color: 'var(--text3)' }}>Built for Brighto & Hoshi wholesale electrical business</div>
        </div>
      ))}

      {showGuide && (
        <Modal title="📊 Connect Google Sheets — Free Setup" onClose={() => setShowGuide(false)} width={620}>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--text2)' }}>
            <li>Go to <strong style={{ color: 'var(--text)' }}>sheets.google.com</strong> → create a new blank spreadsheet</li>
            <li>Click <strong style={{ color: 'var(--text)' }}>Extensions → Apps Script</strong></li>
            <li>Delete any code shown, paste in the script from <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>GOOGLE_APPS_SCRIPT.gs</code> (inside your app zip)</li>
            <li>Click <strong style={{ color: 'var(--text)' }}>Save</strong> → then <strong style={{ color: 'var(--text)' }}>Deploy → New deployment</strong></li>
            <li>Type: <strong style={{ color: 'var(--text)' }}>Web app</strong> — Execute as: Me — Who has access: Anyone</li>
            <li>Click <strong style={{ color: 'var(--text)' }}>Deploy</strong> → copy the URL it shows</li>
            <li>Paste that URL above and click <strong style={{ color: 'var(--text)' }}>Sync now</strong></li>
          </ol>
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--accent)' }}>
            💡 Completely free — uses your Google account's Apps Script quota. No credit card needed.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <Btn onClick={() => setShowGuide(false)}>Got it</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
