import { useState } from 'react';

// Simple local auth — no server needed
// Change these credentials by editing this file
const CREDENTIALS = [
  { username: 'admin', password: 'admin123', name: 'Admin', role: 'Owner' },
  { username: 'staff', password: 'staff123', name: 'Staff User', role: 'Manager' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = CREDENTIALS.find(c => c.username === username && c.password === password);
      if (user) {
        localStorage.setItem('ims_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Incorrect username or password');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16
    }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '2.5rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #4f8ef7, #7c6af7)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 14, boxShadow: '0 8px 24px rgba(79,142,247,0.3)'
          }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>StockLedger IMS</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Brighto & Hoshi Inventory System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Username</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ width: '100%', padding: '10px 40px 10px 12px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: 2 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-dim)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius)', padding: '9px 12px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading || !username || !password} style={{
            width: '100%', padding: '11px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (!username || !password) ? 0.5 : 1,
            fontFamily: 'inherit', transition: 'opacity 0.15s',
            boxShadow: '0 4px 14px rgba(79,142,247,0.3)'
          }}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Demo credentials</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>👤 <code style={{ color: 'var(--accent)' }}>admin</code> / <code style={{ color: 'var(--accent)' }}>admin123</code> — Full access</div>
            <div>👤 <code style={{ color: 'var(--purple)' }}>staff</code> / <code style={{ color: 'var(--purple)' }}>staff123</code> — Manager</div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>
          All data saved locally in your browser · No server required
        </p>
      </div>
    </div>
  );
}
