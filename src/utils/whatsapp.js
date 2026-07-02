// Centralized WhatsApp message builders so every part of the app sends
// consistent, professional messages with full transaction context.

function fmt(n) {
  return `₨${Number(n || 0).toLocaleString()}`;
}

export function openWhatsApp(phone, message) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    alert('No phone number saved for this shopkeeper. Please edit their profile and add a phone number first.');
    return;
  }
  const encoded = encodeURIComponent(message);
  // Use location.href instead of window.open — works on GitHub Pages and mobile browsers
  // where popups are blocked. Opens WhatsApp in the same tab; user presses Back to return.
  window.location.href = `https://wa.me/${cleanPhone}?text=${encoded}`;
}

// Sent right after a new invoice/sale is created
export function buildPurchaseMessage({ shopName, brandName, items, productNames, total, previousBalance, newBalance, date }) {
  const itemLines = items.map((it, i) => `${i + 1}. ${productNames[i] || 'Item'} × ${it.qty} @ ${fmt(it.unitPrice)}`).join('\n');
  return `Dear ${shopName},

New purchase recorded on ${date}:

${itemLines}

New purchase amount: ${fmt(total)}
Previous balance: ${fmt(previousBalance)}
*Total remaining balance: ${fmt(newBalance)}*

Thank you for your business!
— ${brandName || 'Brighto/Hoshi'} Team`;
}

// Sent right after a payment is recorded
export function buildPaymentReceivedMessage({ shopName, brandName, amountReceived, previousBalance, newBalance, date }) {
  const clearedLine = newBalance <= 0
    ? '\n✅ Your account is now fully cleared. Thank you!'
    : `\n*Remaining balance: ${fmt(newBalance)}*`;
  return `Dear ${shopName},

Payment received on ${date}: ${fmt(amountReceived)}

Previous balance: ${fmt(previousBalance)}${clearedLine}

Thank you for your payment!
— ${brandName || 'Brighto/Hoshi'} Team`;
}

// Reminder for outstanding balance (used from Shopkeepers page)
export function buildReminderMessage({ shopName, balance, brandName }) {
  return `Dear ${shopName},

This is a friendly reminder regarding your outstanding balance of ${fmt(balance)}.

Please arrange payment at your earliest convenience.

Thank you for doing business with us.
— ${brandName || 'Brighto/Hoshi'} Team`;
}

// Full account summary — old purchases + payments + remaining balance
export function buildAccountSummaryMessage({ shopName, brandName, totalPurchased, totalPaid, balance, recentInvoices }) {
  const recentLines = recentInvoices.slice(0, 5).map(inv =>
    `• ${inv.date}: ${fmt(inv.total)} (${inv.status})`
  ).join('\n');
  return `Dear ${shopName},

Your account summary with us:

Total purchased to date: ${fmt(totalPurchased)}
Total paid to date: ${fmt(totalPaid)}
*Current outstanding balance: ${fmt(balance)}*

Recent transactions:
${recentLines || 'None yet'}

Thank you for your continued business!
— ${brandName || 'Brighto/Hoshi'} Team`;
}
