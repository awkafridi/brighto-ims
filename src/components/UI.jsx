import { useState } from 'react';

export function Badge({ color = 'accent', children }) {
  const colors = {
    accent: { bg: 'rgba(79,142,247,0.12)', text: '#4f8ef7', border: 'rgba(79,142,247,0.25)' },
    green: { bg: 'rgba(52,211,153,0.12)', text: '#34d399', border: 'rgba(52,211,153,0.25)' },
    amber: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    red: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
    purple: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
    gray: { bg: 'rgba(255,255,255,0.06)', text: '#8b92a8', border: 'rgba(255,255,255,0.1)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      whiteSpace: 'nowrap'
    }}>{children}</span>
  );
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      ...(onClick ? { cursor: 'pointer' } : {}),
      ...style
    }}>{children}</div>
  );
}

export function KpiCard({ label, value, sub, color = 'var(--text)', icon }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 20, opacity: 0.5 }}>{icon}</div>}
      </div>
    </Card>
  );
}

export function Table({ columns, data, onRowClick }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '8px 12px', textAlign: col.align || 'left',
                fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap'
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} onClick={() => onRowClick && onRowClick(row)}
              style={{ borderBottom: '0.5px solid var(--border)', transition: 'background 0.15s',
                cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '11px 12px', textAlign: col.align || 'left', color: col.muted ? 'var(--text2)' : 'var(--text)' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, children, onClose, width = 560 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border2)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ color: 'var(--text2)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>{label}</div>}
      <input {...props} style={{
        width: '100%', padding: '8px 12px', background: 'var(--bg3)',
        border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
        color: 'var(--text)', outline: 'none', transition: 'border-color 0.15s',
        ...(props.style || {})
      }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>{label}</div>}
      <select {...props} style={{
        width: '100%', padding: '8px 12px', background: 'var(--bg3)',
        border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
        color: 'var(--text)', outline: 'none', ...(props.style || {})
      }}>{children}</select>
    </div>
  );
}

export function Btn({ variant = 'primary', children, style = {}, ...props }) {
  const styles = {
    primary: { background: 'var(--accent)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--text2)', border: '0.5px solid var(--border2)' },
    danger: { background: 'var(--red-dim)', color: 'var(--red)', border: '0.5px solid rgba(248,113,113,0.2)' },
  };
  return (
    <button {...props} style={{
      padding: '8px 16px', borderRadius: 'var(--radius)', fontWeight: 500,
      fontSize: 13, cursor: 'pointer', transition: 'opacity 0.15s',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      ...styles[variant], ...style
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >{children}</button>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text)' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ color: 'var(--text2)', fontSize: 13 }}>{description}</div>
    </div>
  );
}

export function StatBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 500 }}>₨{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}
