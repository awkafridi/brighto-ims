/**
 * GOOGLE APPS SCRIPT — Paste this into a Google Sheet's Apps Script editor.
 * This acts as a FREE backend that lets your StockLedger IMS app save data
 * directly into a Google Sheet automatically.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://sheets.google.com and create a new blank spreadsheet
 * 2. Name it "Brighto IMS Data" (or anything you like)
 * 3. Click Extensions → Apps Script
 * 4. Delete any code you see there, and paste THIS ENTIRE FILE in its place
 * 5. Click the Save icon (floppy disk)
 * 6. Click "Deploy" (top right) → "New deployment"
 * 7. Click the gear icon next to "Select type" → choose "Web app"
 * 8. Set "Execute as" = Me
 * 9. Set "Who has access" = Anyone
 * 10. Click "Deploy"
 * 11. Google will show you a URL like https://script.google.com/macros/s/XXXXX/exec
 * 12. Copy that URL — paste it into the StockLedger IMS app's Settings page
 *
 * That's it. Every change you make in the app will now save to this Google Sheet.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Each data type gets its own sheet tab
    const sheetNames = [
      'brands', 'categories', 'suppliers', 'products', 'batches',
      'shopkeepers', 'invoices', 'ledgerEntries', 'expenses'
    ];

    sheetNames.forEach(name => {
      if (data[name]) {
        writeSheet(ss, name, data[name]);
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {};
    const sheetNames = [
      'brands', 'categories', 'suppliers', 'products', 'batches',
      'shopkeepers', 'invoices', 'ledgerEntries', 'expenses'
    ];

    sheetNames.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        result[name] = readSheet(sheet);
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function writeSheet(ss, name, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.clear();

  if (!rows || rows.length === 0) return;

  // Header row from object keys
  const headers = Object.keys(rows[0]);
  sheet.appendRow(headers);

  // Data rows
  rows.forEach(row => {
    const line = headers.map(h => {
      const val = row[h];
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        return JSON.stringify(val);
      }
      return val;
    });
    sheet.appendRow(line);
  });

  // Auto-resize columns for readability
  sheet.autoResizeColumns(1, headers.length);
}

function readSheet(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Try to parse JSON-looking strings back into objects/arrays
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { val = JSON.parse(val); } catch (e) { /* leave as string */ }
      }
      obj[h] = val;
    });
    return obj;
  });
}
