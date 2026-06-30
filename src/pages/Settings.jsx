import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '../data/store';
import { useTheme } from '../hooks/useTheme';
import { Card, Modal, Input, Btn, PageHeader, Badge } from '../components/UI';

const SHEETS_URL_KEY = 'ims_sheets_webhook_url';
const SHEETS_AUTOSAVE_KEY = 'ims_sheets_autosave';

export default function Settings() {
  const store = useStore();
  const { theme, toggleTheme } = useTheme();
  const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem(SHEETS_URL_KEY) || '');
  const [autosave, setAutosave] = useState(localStorage.getItem(SHEETS_AUTOSAVE_KEY) === 'true');
  const [syncStatus, setSyncStatus] = useState(null); // null | 'syncing' | 'success' | 'error'
  const [lastSync, setLastSync] = useState(localStorage.getItem('ims_last_sync') || null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const syncTimeout = useRef(null);

  // Save Sheets URL + autosave preference whenever they change
  useEffect(() => {
    localStorage.setItem(SHEETS_URL_KEY, sheetsUrl);
  }, [sheetsUrl]);

  useEffect(() => {
    localStorage.setItem(SHEETS_AUTOSAVE_KEY, String(autosave));
  }, [autosave]);

  // Auto-sync whenever store data changes, if enabled
  useEffect(() => {
    if (!autosave || !sheetsUrl) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      syncToSheets(true);
    }, 2000); // debounce so rapid edits don't spam requests
    return () => clearTimeout(syncTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.products, store.shopkeepers, store.invoices, store.suppliers, store.expenses, store.ledgerEntries, autosave, sheetsUrl]);

  const syncToSheets = async (silent = false) => {
    if (!sheetsUrl) {
      if (!silent) setSyncStatus('error');
      return;
    }
    setSyncStatus('syncing');
    try {
      const payload = {
        brands: store.brands,
        categories: store.categories,
        suppliers: store.suppliers,
        products: store.products,
        batches: store.batches,
        shopkeepers: store.shopkeepers,
        invoices: store.invoices,
        ledgerEntries: store.ledgerEntries,
        expenses: store.expenses,
      };
      // Apps Script web apps require no-cors from browser fetch in many setups;
      // we use mode: 'no-cors' so the request isn't blocked, and treat it optimistically.
      await fetch(sheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const now = new Date().toLocaleString();
      localStorage.setItem('ims_last_sync', now);
      setLastSync(now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      console.error('Sheets sync failed', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleClearAll = () => {
    if (confirmClear) {
      store.clearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  const handleRestoreDemo = () => {
    if (confirmDemo) {
      store.resetAll();
      setConfirmDemo(false);
    } else {
      setConfirmDemo(true);
      setTimeout(() => setConfirmDemo(false), 4000);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const sheets = {
      Products: store.products,
      Suppliers: store.suppliers,
      Batches: store.batches,
      Shopkeepers: store.shopkeepers,
      Invoices: store.invoices.map(inv => ({
        ...inv,
        items: JSON.stringify(inv.items || []), // flatten nested array for Excel
      })),
      Ledger: store.ledgerEntries,
      Expenses: store.expenses,
    };

    Object.entries(sheets).forEach(([name, rows]) => {
      if (rows && rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `brighto-ims-export-${dateStr}.xlsx`);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Appearance, data backup, and export options" />

      {/* Appearance */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>🎨 Appearance</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Theme</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode</div>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 20, padding: 3, border: '0.5px solid var(--border2)' }}>
            <button onClick={() => theme !== 'dark' && toggleTheme()} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: theme === 'dark' ? 'var(--accent)' : 'transparent',
              color: theme === 'dark' ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}>🌙 Dark</button>
            <button onClick={() => theme !== 'light' && toggleTheme()} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: theme === 'light' ? 'var(--accent)' : 'transparent',
              color: theme === 'light' ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}>☀️ Light</button>
          </div>
        </div>
      </Card>

      {/* Google Sheets Sync */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📊 Google Sheets Backup</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Automatically save your data to a Google Sheet you own</div>
          </div>
          {syncStatus === 'syncing' && <Badge color="amber">Syncing...</Badge>}
          {syncStatus === 'success' && <Badge color="green">✓ Synced</Badge>}
          {syncStatus === 'error' && <Badge color="red">Sync failed</Badge>}
        </div>

        <Input
          label="Google Apps Script Web App URL"
          placeholder="https://script.google.com/macros/s/XXXXX/exec"
          value={sheetsUrl}
          onChange={e => setSheetsUrl(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="autosave" checked={autosave} onChange={e => setAutosave(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="autosave" style={{ fontSize: 13, cursor: 'pointer' }}>Auto-save on every change</label>
          </div>
          {lastSync && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Last synced: {lastSync}</span>}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => syncToSheets(false)} disabled={!sheetsUrl}>📤 Sync now</Btn>
          <Btn variant="ghost" onClick={() => setShowGuide(true)}>📖 How to set this up</Btn>
        </div>

        {!sheetsUrl && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--amber-dim)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--amber)' }}>
            ⚠ Not connected yet — click "How to set this up" below for a free 5-minute setup using your own Google account.
          </div>
        )}
      </Card>

      {/* Excel Export */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📥 Export to Excel</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>Download all your data as an .xlsx file you can open in Excel or Google Sheets</div>
        <Btn onClick={exportToExcel}>⬇ Download Excel file</Btn>
      </Card>

      {/* Data Management */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🗑 Data Management</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Be careful — these actions affect all your saved data</div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="danger" onClick={handleClearAll}>
            {confirmClear ? '⚠ Click again to confirm — deletes everything' : '🗑 Clear all data (start fresh)'}
          </Btn>
          <Btn variant="ghost" onClick={handleRestoreDemo}>
            {confirmDemo ? '⚠ Click again — replaces with demo data' : '↺ Restore demo/sample data'}
          </Btn>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          <strong>Clear all data</strong> removes every product, invoice, shopkeeper, and transaction — keeping only your brand and category names. Use this once you're ready to start entering real business data.<br/>
          <strong>Restore demo data</strong> brings back the original sample data for exploring features.
        </div>
      </Card>

      {showGuide && <SheetsGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}

function SheetsGuide({ onClose }) {
  return (
    <Modal title="📊 Connect Google Sheets (Free, 5 minutes)" onClose={onClose} width={620}>
      <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, lineHeight: 1.6 }}>
        <li>Go to <strong>sheets.google.com</strong> and create a new blank spreadsheet. Name it anything, like "Brighto IMS Data".</li>
        <li>Click <strong>Extensions → Apps Script</strong> in the menu bar.</li>
        <li>Delete any code shown, then paste in the script from the <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>GOOGLE_APPS_SCRIPT.gs</code> file that came with your app download.</li>
        <li>Click the <strong>Save</strong> icon (floppy disk).</li>
        <li>Click <strong>Deploy</strong> (top right) → <strong>New deployment</strong>.</li>
        <li>Click the gear icon ⚙ next to "Select type" → choose <strong>Web app</strong>.</li>
        <li>Set <strong>Execute as</strong> = Me, and <strong>Who has access</strong> = Anyone.</li>
        <li>Click <strong>Deploy</strong>. Google may ask you to authorize — click through and allow it (it's your own script, on your own account).</li>
        <li>Copy the URL shown (looks like <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>https://script.google.com/macros/s/.../exec</code>).</li>
        <li>Paste that URL into the "Google Apps Script Web App URL" field on this Settings page, then click <strong>Sync now</strong>.</li>
      </ol>
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--accent)' }}>
        💡 This is completely free — it uses your own Google account's free Apps Script quota, with no credit card or sign-up needed beyond your existing Google account.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn onClick={onClose}>Got it</Btn>
      </div>
    </Modal>
  );
}
