// Centralized WhatsApp message builders

function fmt(n) {
  return `₨${Number(n || 0).toLocaleString()}`;
}

export function openWhatsApp(phone, message) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    // Can't use alert() on GitHub Pages — show in console and use a toast instead
    console.warn('No phone number for this shopkeeper');
    return;
  }
  const encoded = encodeURIComponent(message);
  // wa.me works on ALL platforms: opens app on mobile, web.whatsapp.com on desktop
  // Using location.href avoids popup blockers entirely
  window.location.href = `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function buildPurchaseMessage({ shopName, brandName, items, productNames, total, previousBalance, newBalance, date }) {
  const itemLines = (items || []).map((it, i) => `${i + 1}. ${productNames?.[i] || 'Item'} × ${it.qty} @ ${fmt(it.unitPrice)}`).join('\n');
  return `Dear ${shopName},

New purchase on ${date}:

${itemLines}

New purchase: ${fmt(total)}
Previous balance: ${fmt(previousBalance)}
*Total balance: ${fmt(newBalance)}*

Thank you!
— ${brandName || 'Brighto/Hoshi'} Team`;
}

export function buildPaymentReceivedMessage({ shopName, brandName, amountReceived, previousBalance, newBalance, date }) {
  const cleared = newBalance <= 0 ? '\n✅ Account fully cleared. Thank you!' : `\n*Remaining balance: ${fmt(newBalance)}*`;
  return `Dear ${shopName},

Payment received on ${date}: ${fmt(amountReceived)}

Previous balance: ${fmt(previousBalance)}${cleared}

Thank you!
— ${brandName || 'Brighto/Hoshi'} Team`;
}

export function buildReminderMessage({ shopName, balance, brandName }) {
  return `Dear ${shopName},

Friendly reminder: your outstanding balance is *${fmt(balance)}*.

Please arrange payment at your earliest convenience.

Thank you,
— ${brandName || 'Brighto/Hoshi'} Team`;
}

export function buildAccountSummaryMessage({ shopName, brandName, totalPurchased, totalPaid, balance, recentInvoices }) {
  const lines = (recentInvoices || []).slice(0, 5).map(inv => `• ${inv.date}: ${fmt(inv.total)} (${inv.status})`).join('\n');
  return `Dear ${shopName},

Your account summary:

Total purchased: ${fmt(totalPurchased)}
Total paid: ${fmt(totalPaid)}
*Outstanding balance: ${fmt(balance)}*

Recent transactions:
${lines || 'None'}

Thank you!
— ${brandName || 'Brighto/Hoshi'} Team`;
}
