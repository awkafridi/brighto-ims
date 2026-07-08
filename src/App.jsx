import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider } from './data/store';
import { ThemeProvider } from './hooks/useTheme';
import { getCurrentUser, isAdmin } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Shopkeepers from './pages/Shopkeepers';
import Invoices from './pages/Invoices';
import Ledger from './pages/Ledger';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import ImportData from './pages/ImportData';
import Approvals from './pages/Approvals';
import Login from './pages/Login';
import { OCRScanner, VoiceInput, AIFab } from './components/AIFeatures';

// Pages only admin can access
const ADMIN_ONLY_PATHS = ['/inventory', '/suppliers', '/ledger', '/expenses', '/import', '/settings', '/approvals'];

function GuardedRoute({ children }) {
  const location = useLocation();
  const admin = isAdmin();
  const isAdminOnly = ADMIN_ONLY_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  if (isAdminOnly && !admin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text2)', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Access restricted</div>
        <div style={{ fontSize: 14 }}>This page requires an admin account.</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Contact your administrator or log in as admin.</div>
      </div>
    );
  }
  return children;
}

function ProtectedLayout({ activeBrand, setActiveBrand }) {
  const [showOCR, setShowOCR] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [ocrPrefill, setOcrPrefill] = useState(null);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeBrand={activeBrand} setActiveBrand={setActiveBrand} />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '100%' }}>
        <Routes>
          <Route path="/" element={<Dashboard activeBrand={activeBrand} />} />
          <Route path="/shopkeepers" element={<GuardedRoute><Shopkeepers /></GuardedRoute>} />
          <Route path="/invoices" element={<GuardedRoute><Invoices activeBrand={activeBrand} prefill={ocrPrefill} /></GuardedRoute>} />
          <Route path="/inventory" element={<GuardedRoute><Inventory activeBrand={activeBrand} /></GuardedRoute>} />
          <Route path="/suppliers" element={<GuardedRoute><Suppliers /></GuardedRoute>} />
          <Route path="/ledger" element={<GuardedRoute><Ledger /></GuardedRoute>} />
          <Route path="/expenses" element={<GuardedRoute><Expenses activeBrand={activeBrand} /></GuardedRoute>} />
          <Route path="/import" element={<GuardedRoute><ImportData /></GuardedRoute>} />
          <Route path="/approvals" element={<GuardedRoute><Approvals /></GuardedRoute>} />
          <Route path="/settings" element={<GuardedRoute><Settings /></GuardedRoute>} />
        </Routes>
      </main>
      <AIFab onOCR={() => setShowOCR(true)} onVoice={() => setShowVoice(true)} />
      {showOCR && <OCRScanner onResult={r => setOcrPrefill(r)} onClose={() => setShowOCR(false)} />}
      {showVoice && <VoiceInput onResult={() => {}} onClose={() => setShowVoice(false)} />}
    </div>
  );
}

function AppRoutes() {
  const [activeBrand, setActiveBrand] = useState('all');
  const savedUser = localStorage.getItem('ims_user');
  const [authed, setAuthed] = useState(!!savedUser);

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" /> : <Login onLogin={() => setAuthed(true)} />} />
      <Route path="/*" element={
        authed
          ? <ProtectedLayout activeBrand={activeBrand} setActiveBrand={setActiveBrand} />
          : <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/brighto-ims">
      <ThemeProvider>
        <StoreProvider>
          <AppRoutes />
        </StoreProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
