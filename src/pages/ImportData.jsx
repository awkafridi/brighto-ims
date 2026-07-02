import { useState, useRef } from 'react';
import { useStore } from '../data/store';
import { Card, Btn, PageHeader, Badge } from '../components/UI';

// Normalise a string for comparison — lowercase, strip punctuation/spaces
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Check if two shopkeeper records look like the same person
function isDuplicateShopkeeper(existing, incoming) {
  const nameMatch = norm(existing.shopName) === norm(incoming.shopName || incoming['Shop Name'] || incoming['Name'] || incoming['Party'] || '');
  const phoneMatch = existing.phone && incoming.phone && norm(existing.phone) === norm(incoming.phone);
  return nameMatch || phoneMatch;
}

// Check if two products look like the same item
function isDuplicateProduct(existing, incoming) {
  const nameMatch = norm(existing.name) === norm(incoming.name || incoming['Product'] || incoming['Item'] || incoming['Name'] || '');
  const skuMatch = existing.sku && incoming.sku && norm(existing.sku) === norm(incoming.sku || incoming['SKU'] || incoming['Code'] || '');
  return nameMatch || skuMatch;
}

function isDuplicateSupplier(existing, incoming) {
  return norm(existing.name) === norm(incoming.name || incoming['Supplier'] || incoming['Vendor'] || incoming['Name'] || '');
}

// Map raw scraped columns to our app's field names
function mapShopkeeper(raw) {
  return {
    shopName: raw['Shop Name'] || raw['shopName'] || raw['Party Name'] || raw['Customer'] || raw['Name'] || raw['shop_name'] || '',
    owner: raw['Owner'] || raw['owner'] || raw['Contact Person'] || raw['Contact'] || '',
    phone: raw['Phone'] || raw['phone'] || raw['Mobile'] || raw['Contact No'] || raw['Cell'] || '',
    address: raw['Address'] || raw['address'] || raw['Area'] || raw['Location'] || '',
    balance: parseFloat(raw['Balance'] || raw['balance'] || raw['Outstanding'] || raw['Remaining'] || 0) || 0,
  };
}

function mapProduct(raw) {
  return {
    name: raw['Product Name'] || raw['name'] || raw['Item'] || raw['Description'] || raw['Name'] || '',
    sku: raw['SKU'] || raw['sku'] || raw['Code'] || raw['Item Code'] || raw['Part No'] || '',
    unit: raw['Unit'] || raw['unit'] || raw['UOM'] || 'pcs',
    sellingPrice: parseFloat(raw['Selling Price'] || raw['Sale Price'] || raw['Price'] || raw['sellingPrice'] || 0) || 0,
    avgCost: parseFloat(raw['Cost'] || raw['Purchase Price'] || raw['avgCost'] || raw['Cost Price'] || 0) || 0,
    stock: parseInt(raw['Stock'] || raw['Qty'] || raw['Quantity'] || raw['stock'] || 0) || 0,
    categoryId: '',
    brandId: '',
  };
}

function mapSupplier(raw) {
  return {
    name: raw['Supplier Name'] || raw['name'] || raw['Vendor'] || raw['Party'] || raw['Name'] || '',
    country: raw['Country'] || raw['country'] || 'Pakistan',
    contact: raw['Contact'] || raw['contact'] || raw['Person'] || '',
    phone: raw['Phone'] || raw['phone'] || raw['Mobile'] || '',
    totalOwed: parseFloat(raw['Total Owed'] || raw['Balance'] || raw['Outstanding'] || 0) || 0,
    totalPaid: parseFloat(raw['Total Paid'] || raw['Paid'] || 0) || 0,
  };
}

export default function ImportData() {
  const store = useStore();
  const fileRef = useRef();
  const [fileData, setFileData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setFileData(data);

        // Build preview counts
        const p = {};
        Object.keys(data).forEach(k => {
          p[k] = Array.isArray(data[k]) ? data[k].length : 0;
        });
        setPreview(p);
      } catch (err) {
        setError('Could not read file. Make sure you downloaded the JSON file from the scraper extension.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!fileData) return;
    setImporting(true);

    const imported = { shopkeepers: 0, products: 0, suppliers: 0, skipped: 0 };
    const uid = () => `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── Import shopkeepers ─────────────────────────────────────────────────
    (fileData.shopkeepers || []).forEach(raw => {
      const mapped = mapShopkeeper(raw);
      if (!mapped.shopName) return;
      const isDup = store.shopkeepers.some(ex => isDuplicateShopkeeper(ex, mapped));
      if (isDup) { imported.skipped++; return; }
      store.addShopkeeper({ ...mapped, id: uid() });
      imported.shopkeepers++;
    });

    // ── Import products ────────────────────────────────────────────────────
    (fileData.products || []).forEach(raw => {
      const mapped = mapProduct(raw);
      if (!mapped.name) return;
      const isDup = store.products.some(ex => isDuplicateProduct(ex, mapped));
      if (isDup) { imported.skipped++; return; }
      store.addProduct({ ...mapped, id: uid() });
      imported.products++;
    });

    // ── Import suppliers ───────────────────────────────────────────────────
    (fileData.suppliers || []).forEach(raw => {
      const mapped = mapSupplier(raw);
      if (!mapped.name) return;
      const isDup = store.suppliers.some(ex => isDuplicateSupplier(ex, mapped));
      if (isDup) { imported.skipped++; return; }
      store.addSupplier({ ...mapped, id: uid() });
      imported.suppliers++;
    });

    setResult(imported);
    setImporting(false);
    setFileData(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <PageHeader title="📥 Import Data" subtitle="Import data from your old portals using the Brighto Scraper extension" />

      {/* Step 1 — Install extension */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Step 1 — Install the Chrome scraper extension</div>
        <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          <li>Download the <strong style={{ color: 'var(--accent)' }}>brighto-scraper</strong> folder that came with your app (it's inside the zip file you downloaded)</li>
          <li>Open Chrome → type <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>chrome://extensions</code> in the address bar</li>
          <li>Turn on <strong>Developer mode</strong> (toggle, top-right corner)</li>
          <li>Click <strong>Load unpacked</strong> → select the <strong>brighto-scraper</strong> folder</li>
          <li>The ⚡ Brighto Scraper icon will appear in your Chrome toolbar</li>
        </ol>
      </Card>

      {/* Step 2 — Use extension */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Step 2 — Scrape your old portals</div>
        <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          <li>Log into your old portal in Chrome as normal</li>
          <li>Navigate to a page that shows a list — e.g. your shopkeeper list, product list, or invoices</li>
          <li>Click the ⚡ scraper icon in the toolbar</li>
          <li>Click <strong>Scan this page</strong> — it detects all tables automatically</li>
          <li>Click <strong>Scrape ALL pages</strong> to extract data across all pages automatically</li>
          <li>Repeat for each section (shopkeepers, products, suppliers, invoices, ledger)</li>
          <li>Click <strong>Download import file (.json)</strong> when done</li>
        </ol>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', padding: '8px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
          💡 Do this for both portals separately, downloading a separate .json file each time. The import step below handles duplicates automatically so you can import both files safely.
        </div>
      </Card>

      {/* Step 3 — Import file */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Step 3 — Upload the import file here</div>

        <div
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${fileData ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center',
            cursor: 'pointer', marginBottom: 12, background: fileData ? 'var(--accent-dim)' : 'var(--bg3)',
            transition: 'all 0.2s'
          }}
        >
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontWeight: 500 }}>{fileData ? '✓ File loaded — review below' : 'Click to select your .json import file'}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Downloaded from the scraper extension</div>
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
            ⚠ {error}
          </div>
        )}

        {preview && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>File contents preview</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(preview).map(([k, v]) => v > 0 && (
                <div key={k} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '8px 14px', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{k}: </span>
                  <strong style={{ color: 'var(--accent)' }}>{v} records</strong>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
              Duplicates will be detected automatically by name and phone number — nothing will be imported twice.
            </div>
          </div>
        )}

        {fileData && (
          <Btn onClick={handleImport} style={{ width: '100%', justifyContent: 'center' }}>
            {importing ? '⏳ Importing...' : '✓ Import into StockLedger (merge, no duplicates)'}
          </Btn>
        )}
      </Card>

      {/* Result */}
      {result && (
        <Card style={{ background: 'var(--green-dim)', border: '0.5px solid rgba(52,211,153,0.25)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--green)', marginBottom: 10 }}>✓ Import complete</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
            <span>👥 Shopkeepers added: <strong>{result.shopkeepers}</strong></span>
            <span>📦 Products added: <strong>{result.products}</strong></span>
            <span>🌐 Suppliers added: <strong>{result.suppliers}</strong></span>
            <span style={{ color: 'var(--text3)' }}>⏭ Skipped (duplicates): <strong>{result.skipped}</strong></span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)' }}>
            You can now import the second portal's file — duplicates will be skipped again automatically.
          </div>
        </Card>
      )}
    </div>
  );
}
