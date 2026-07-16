import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useStore } from '../data/store';
import { useTheme } from '../hooks/useTheme';
import { getCurrentUser, isAdmin } from '../hooks/useAuth';
import { pendingCount } from '../utils/auditLog';
import { BusinessManager } from './BusinessManager';

// All nav items — filtered by role below
const ALL_NAV = [
  { path: '/',            label: 'Dashboard',    icon: '⬡',  adminOnly: false },
  { path: '/shopkeepers', label: 'Shopkeepers',  icon: '🏪',  adminOnly: false },
  { path: '/invoices',    label: 'Invoices',     icon: '🧾',  adminOnly: false },
  { path: '/inventory',   label: 'Inventory',    icon: '📦',  adminOnly: true  },
  { path: '/suppliers',   label: 'Suppliers',    icon: '🌐',  adminOnly: true  },
  { path: '/purchases',   label: 'Purchases',    icon: '🚢',  adminOnly: true  },
  { path: '/ledger',      label: 'Ledger',       icon: '📒',  adminOnly: true  },
  { path: '/reports',     label: 'Reports',      icon: '📊',  adminOnly: true  },
  { path: '/expenses',    label: 'Expenses',     icon: '💸',  adminOnly: true  },
  { path: '/import',      label: 'Import Data',  icon: '📥',  adminOnly: true  },
  { path: '/approvals',   label: 'Approvals',    icon: '✅',  adminOnly: true  },
  { path: '/settings',    label: 'Settings',     icon: '⚙️',  adminOnly: true  },
];

export default function Sidebar({ activeBrand, setActiveBrand }) {
  const { brands } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [showBusiness, setShowBusiness] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const admin = isAdmin();
  const [pending, setPending] = useState(pendingCount());

  // Refresh pending count every 10s
  useEffect(() => {
    const t = setInterval(() => setPending(pendingCount()), 10000);
    return () => clearInterval(t);
  }, []);

  const navItems = ALL_NAV.filter(item => admin || !item.adminOnly);

  const handleLogout = () => {
    localStorage.removeItem('ims_user');
    window.location.href = window.location.pathname.includes('brighto-ims')
      ? '/brighto-ims/login'
      : '/login';
  };

  return (
    <>
      <aside style={{
        width: 220, minHeight: '100vh', background: 'var(--bg2)',
        borderRight: '0.5px solid var(--border)', display: 'flex',
        flexDirection: 'column', flexShrink: 0, position: 'sticky',
        top: 0, height: '100vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4f8ef7, #7c6af7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>StockLedger</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>IMS Pro</div>
            </div>
          </div>
        </div>

        {/* Brand switcher — admin only */}
        {admin && (
          <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Active brand</div>
              <button onClick={() => setShowBusiness(true)} style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontWeight: 600 }}>+ Manage</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => setActiveBrand('all')} style={{ width: '100%', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: activeBrand === 'all' ? 600 : 400, background: activeBrand === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeBrand === 'all' ? 'var(--text)' : 'var(--text3)', border: activeBrand === 'all' ? '0.5px solid var(--border2)' : '0.5px solid transparent', cursor: 'pointer', textAlign: 'left' }}>All brands</button>
              {brands.map(b => (
                <button key={b.id} onClick={() => setActiveBrand(b.id)} style={{ width: '100%', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: activeBrand === b.id ? b.color + '18' : 'transparent', color: activeBrand === b.id ? b.color : 'var(--text3)', border: activeBrand === b.id ? `0.5px solid ${b.color}40` : '0.5px solid transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Staff badge */}
        {!admin && (
          <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--border)', background: 'var(--amber-dim)' }}>
            <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>👤 Staff account</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Limited access mode</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: '10px', flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
              padding: '9px 10px', borderRadius: 'var(--radius)', marginBottom: 2,
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              fontWeight: isActive ? 600 : 400, fontSize: 13, transition: 'all 0.15s',
            })}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </span>
              {item.path === '/approvals' && pending > 0 && (
                <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px', borderTop: '0.5px solid var(--border)' }}>
          <button onClick={toggleTheme} style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text3)', border: '0.5px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: admin ? 'var(--accent-dim)' : 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: admin ? 'var(--accent)' : 'var(--amber)', flexShrink: 0 }}>
              {(user.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username || 'User'}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{admin ? 'Owner / Admin' : 'Staff'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{ fontSize: 16, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
            >⏻</button>
          </div>
        </div>
      </aside>

      {showBusiness && <BusinessManager onClose={() => setShowBusiness(false)} />}
    </>
  );
}
