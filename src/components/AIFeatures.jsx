import { useState, useRef, useCallback } from 'react';
import { Modal, Btn } from './UI';
import { useStore } from '../data/store';
import { callAI, isAIAvailable, AIUnavailableError } from '../api/aiProvider';

// ── OCR Invoice Scanner ───────────────────────────────────────────────────────
export function OCRScanner({ onResult, onClose }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const { products, suppliers, shopkeepers } = useStore();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const scanInvoice = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError('');
    try {
      const systemPrompt = `You are an OCR assistant for a Pakistani electrical/lighting wholesale business.
Extract invoice data from the image and return ONLY valid JSON with this exact structure:
{
  "supplier": "supplier name or null",
  "shopkeeper": "customer/shop name or null",
  "date": "YYYY-MM-DD or today",
  "items": [
    { "name": "product name", "qty": number, "unitPrice": number }
  ],
  "totalAmount": number or null,
  "notes": "any additional notes"
}
If you cannot find a field, use null. For Pakistani invoices, amounts are in PKR (₨).
Return ONLY the JSON, no other text.`;

      const text = await callAI(systemPrompt, 'Extract all invoice data from this image.', imageBase64);

      const parsed = JSON.parse(text);

      // Try to match extracted names to existing records
      const matchedSupplier = parsed.supplier
        ? suppliers.find(s => s.name.toLowerCase().includes(parsed.supplier.toLowerCase().slice(0, 5)))
        : null;
      const matchedShopkeeper = parsed.shopkeeper
        ? shopkeepers.find(s => s.shopName.toLowerCase().includes(parsed.shopkeeper.toLowerCase().slice(0, 5)))
        : null;

      const enriched = {
        ...parsed,
        matchedSupplierId: matchedSupplier?.id || null,
        matchedShopkeeperId: matchedShopkeeper?.id || null,
        items: parsed.items.map(item => ({
          ...item,
          matchedProduct: products.find(p =>
            p.name.toLowerCase().includes(item.name.toLowerCase().slice(0, 4))
          ) || null
        }))
      };

      setResult(enriched);
    } catch (e) {
      if (e instanceof AIUnavailableError) {
        setError(`🔒 ${e.message}`);
      } else {
        setError('Could not parse invoice. Try a clearer image or fill in manually.');
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="📷 OCR Invoice Scanner" onClose={onClose} width={640}>
      {!result ? (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current.click()}
            style={{
              border: `2px dashed ${image ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16,
              background: image ? 'var(--accent-dim)' : 'var(--bg3)',
            }}
          >
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            {image
              ? <img src={image} alt="Invoice" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, objectFit: 'contain' }} />
              : <div>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Drop invoice image here</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>or click to browse — supports JPG, PNG, PDF screenshots</div>
              </div>
            }
          </div>

          {image && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" onClick={() => { setImage(null); setImageBase64(null); }}>Clear</Btn>
              <Btn onClick={scanInvoice} style={{ flex: 1 }}>
                {loading ? '⏳ Scanning with AI...' : '🔍 Scan & Extract Data'}
              </Btn>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: 10, background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 'var(--radius)', fontSize: 13 }}>
              {error}
            </div>
          )}
        </>
      ) : (
        <OCRResult result={result} onUse={() => { onResult(result); onClose(); }} onBack={() => setResult(null)} />
      )}
    </Modal>
  );
}

function OCRResult({ result, onUse, onBack }) {
  return (
    <div>
      <div style={{ background: 'var(--green-dim)', border: '0.5px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--green)' }}>
        ✓ Invoice scanned successfully
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Supplier / From</div>
          <div style={{ fontWeight: 500 }}>{result.supplier || '—'}</div>
          {result.matchedSupplierId && <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ Matched in system</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Customer / Shop</div>
          <div style={{ fontWeight: 500 }}>{result.shopkeeper || '—'}</div>
          {result.matchedShopkeeperId && <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ Matched in system</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Date</div>
          <div style={{ fontWeight: 500 }}>{result.date}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Total Amount</div>
          <div style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {result.totalAmount ? `₨${result.totalAmount.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Extracted line items
      </div>
      {result.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 500 }}>{item.name}</div>
            {item.matchedProduct && <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ → {item.matchedProduct.name}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>×{item.qty}</span>
            {' @ '}
            <span style={{ fontWeight: 600 }}>₨{item.unitPrice}</span>
          </div>
        </div>
      ))}

      {result.notes && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', fontStyle: 'italic' }}>
          Notes: {result.notes}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Btn variant="ghost" onClick={onBack}>← Re-scan</Btn>
        <Btn onClick={onUse} style={{ flex: 1 }}>Use this data →</Btn>
      </div>
    </div>
  );
}

// ── Voice Input ───────────────────────────────────────────────────────────────
export function VoiceInput({ onResult, onClose }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const { products, shopkeepers, brands } = useStore();

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ur-PK'; // Supports Urdu; fallback to en-US if needed

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(text);
    };
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') setError('Microphone error: ' + e.error);
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setTranscript('');
    setError('');
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  const toggleLang = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = recognitionRef.current.lang === 'ur-PK' ? 'en-US' : 'ur-PK';
    }
  }, []);

  const parseVoice = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    try {
      const systemPrompt = `You are a voice command parser for a Pakistani electrical wholesale business.
The user may speak in Urdu, English, or a mix (Urdu+English is common in Pakistan).

Available products: ${products.map(p => `${p.name} (id:${p.id})`).join(', ')}
Available shopkeepers: ${shopkeepers.map(s => `${s.shopName} (id:${s.id})`).join(', ')}
Available brands: ${brands.map(b => `${b.name} (id:${b.id})`).join(', ')}

Parse the voice command and return ONLY valid JSON:
{
  "action": "sale" | "payment" | "purchase" | "expense" | "unknown",
  "shopkeeperId": "matched id or null",
  "shopkeeperName": "extracted name",
  "brandId": "matched id or null",
  "amount": number or null,
  "paymentAmount": number or null,
  "date": "YYYY-MM-DD or today",
  "items": [{ "productId": "matched id or null", "productName": "extracted name", "qty": number, "unitPrice": number or null }],
  "confidence": "high" | "medium" | "low",
  "urduSummary": "تصدیق کریں: مختصر اردو خلاصہ",
  "englishSummary": "Confirmation: brief English summary"
}`;

      const text = await callAI(systemPrompt, `Parse this voice command: "${transcript}"`);

      const parsed = JSON.parse(text);
      setResult(parsed);
    } catch (e) {
      if (e instanceof AIUnavailableError) {
        setError(`🔒 ${e.message}`);
      } else {
        setError('Could not understand command. Try again or type manually.');
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="🎤 Voice Command" onClose={onClose} width={580}>
      {/* Language toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>Language:</div>
        <button onClick={toggleLang} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--bg3)', border: '0.5px solid var(--border2)', color: 'var(--text)', cursor: 'pointer' }}>
          🇵🇰 Urdu / 🇬🇧 English
        </button>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          Mix of both works too
        </div>
      </div>

      {/* Examples */}
      <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Example commands:</div>
        <div style={{ color: 'var(--text)', marginBottom: 3 }}>"Sold 50 twelve watt Brighto bulbs to Madina Electric, received ten thousand rupees"</div>
        <div style={{ color: 'var(--text)', marginBottom: 3 }}>"مدینہ الیکٹرک سے دس ہزار روپے وصول ہوئے"</div>
        <div style={{ color: 'var(--text)' }}>"Expense: rent paid forty five thousand"</div>
      </div>

      {/* Recording area */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <button
          onClick={recording ? stopRecording : startRecording}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: recording ? 'var(--red-dim)' : 'var(--accent-dim)',
            border: recording ? '3px solid var(--red)' : '3px solid var(--accent)',
            fontSize: 32, cursor: 'pointer', transition: 'all 0.2s',
            animation: recording ? 'pulse 1s infinite' : 'none',
          }}
        >
          {recording ? '⏹' : '🎤'}
        </button>
        <div style={{ marginTop: 8, fontSize: 13, color: recording ? 'var(--red)' : 'var(--text2)' }}>
          {recording ? 'Listening… click to stop' : 'Click to speak'}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>

      {/* Transcript */}
      {transcript && (
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 12, minHeight: 60 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Transcript</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{transcript}</div>
        </div>
      )}

      {/* Manual input fallback */}
      <textarea
        placeholder="Or type your command here in Urdu or English..."
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        style={{
          width: '100%', minHeight: 60, padding: '8px 12px',
          background: 'var(--bg3)', border: '0.5px solid var(--border2)',
          borderRadius: 'var(--radius)', color: 'var(--text)', resize: 'vertical',
          fontFamily: 'inherit', fontSize: 14, marginBottom: 12, outline: 'none'
        }}
      />

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {!result ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={parseVoice} style={{ flex: 1 }} >
            {loading ? '⏳ Parsing...' : '✨ Parse Command'}
          </Btn>
        </div>
      ) : (
        <VoiceResult result={result} onUse={() => { onResult(result); onClose(); }} onBack={() => setResult(null)} />
      )}
    </Modal>
  );
}

function VoiceResult({ result, onUse, onBack }) {
  const confidenceColor = { high: 'var(--green)', medium: 'var(--amber)', low: 'var(--red)' };

  return (
    <div>
      <div style={{ background: 'var(--accent-dim)', border: '0.5px solid rgba(79,142,247,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>English: {result.englishSummary}</div>
        <div style={{ fontSize: 13, direction: 'rtl', textAlign: 'right', color: 'var(--text2)' }}>{result.urduSummary}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Action</div>
          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{result.action}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Shop</div>
          <div style={{ fontWeight: 600 }}>{result.shopkeeperName || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Confidence</div>
          <div style={{ fontWeight: 600, color: confidenceColor[result.confidence] }}>{result.confidence}</div>
        </div>
      </div>

      {result.items?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase' }}>Items</div>
          {result.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div>
                <div>{item.productName}</div>
                {item.productId && <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ Matched</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                ×{item.qty} {item.unitPrice ? `@ ₨${item.unitPrice}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.amount && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Amount</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)' }}>
            ₨{result.amount.toLocaleString()}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onBack}>← Try again</Btn>
        <Btn onClick={onUse} style={{ flex: 1 }}>✓ Use this →</Btn>
      </div>
    </div>
  );
}

// ── Floating AI Button ────────────────────────────────────────────────────────
export function AIFab({ onOCR, onVoice }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 60, right: 0,
          background: 'var(--bg2)', border: '0.5px solid var(--border2)',
          borderRadius: 'var(--radius-lg)', padding: '8px', display: 'flex',
          flexDirection: 'column', gap: 6, minWidth: 180,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          {!isAIAvailable() && (
            <div style={{ fontSize: 11, color: 'var(--text3)', padding: '4px 10px 8px', borderBottom: '0.5px solid var(--border)', marginBottom: 2 }}>
              ⓘ No AI key configured — add a free one in <strong style={{ color: 'var(--accent)' }}>Settings → AI Provider</strong>
            </div>
          )}
          <button onClick={() => { setOpen(false); onOCR(); }} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 'var(--radius)', background: 'var(--bg3)', border: 'none',
            color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s'
          }} onMouseEnter={e => e.target.style.background = 'var(--accent-dim)'}
            onMouseLeave={e => e.target.style.background = 'var(--bg3)'}>
            📷 Scan Invoice (OCR)
          </button>
          <button onClick={() => { setOpen(false); onVoice(); }} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 'var(--radius)', background: 'var(--bg3)', border: 'none',
            color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s'
          }} onMouseEnter={e => e.target.style.background = 'var(--accent-dim)'}
            onMouseLeave={e => e.target.style.background = 'var(--bg3)'}>
            🎤 Voice Command
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: open ? 'var(--accent2)' : 'var(--accent)',
          border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(79,142,247,0.4)',
          transition: 'all 0.2s', transform: open ? 'rotate(45deg)' : 'none'
        }}
      >
        ✦
      </button>
    </div>
  );
}
