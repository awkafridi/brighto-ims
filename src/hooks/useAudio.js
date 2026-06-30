import { useCallback, useRef, useState } from 'react';

export function formatUrduAmount(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)} لاکھ روپے`;
  if (n >= 1000) return `${Math.round(n / 1000)} ہزار روپے`;
  return `${n} روپے`;
}

export function useAudio() {
  const utterRef = useRef(null);

  const speak = useCallback((text, lang = 'en') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
    utter.rate = 0.9;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      lang === 'ur'
        ? v.lang.startsWith('ur') || v.name.toLowerCase().includes('urdu')
        : v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    );
    if (preferred) utter.voice = preferred;
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => { window.speechSynthesis?.cancel(); }, []);

  const speakSummary = useCallback((stats, lang = 'en') => {
    if (lang === 'ur') {
      speak(`آج کی رپورٹ۔ کل وصولی ${formatUrduAmount(stats.recovered)}۔ باقی وصولی ${formatUrduAmount(stats.receivables)}۔ خالص منافع ${formatUrduAmount(stats.profit)}۔ کل اخراجات ${formatUrduAmount(stats.expenses)}۔`, 'ur');
    } else {
      speak(`Today's summary. Total recovered: ${stats.recovered.toLocaleString()} rupees. Remaining receivables: ${stats.receivables.toLocaleString()} rupees. Net profit: ${stats.profit.toLocaleString()} rupees. Total expenses: ${stats.expenses.toLocaleString()} rupees.`, 'en');
    }
  }, [speak]);

  const speakLedger = useCallback((shopkeeper, entries, lang = 'en') => {
    if (lang === 'ur') {
      speak(`${shopkeeper.shopName} کا حساب کتاب۔ موجودہ بقایا ${formatUrduAmount(shopkeeper.balance)}۔ کل ${(entries || []).length} لین دین ہیں۔`, 'ur');
    } else {
      speak(`Ledger for ${shopkeeper.shopName}. Current outstanding balance: ${shopkeeper.balance.toLocaleString()} rupees. Total transactions: ${(entries || []).length}.`, 'en');
    }
  }, [speak]);

  const speakInvoice = useCallback((invoice, shopkeeper, lang = 'en') => {
    if (lang === 'ur') {
      speak(`انوائس۔ دکان: ${shopkeeper?.shopName}۔ کل رقم: ${formatUrduAmount(invoice.total)}۔ حالت: ${invoice.status === 'paid' ? 'ادا شدہ' : invoice.status === 'partial' ? 'جزوی ادا' : 'غیر ادا شدہ'}۔`, 'ur');
    } else {
      speak(`Invoice for ${shopkeeper?.shopName}. Total amount: ${invoice.total.toLocaleString()} rupees. Status: ${invoice.status}.`, 'en');
    }
  }, [speak]);

  return { speak, stop, speakSummary, speakLedger, speakInvoice };
}
