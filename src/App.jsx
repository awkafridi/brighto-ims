import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './data/store';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Shopkeepers from './pages/Shopkeepers';
import Invoices from './pages/Invoices';
import Ledger from './pages/Ledger';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import { OCRScanner, VoiceInput, AIFab } from './components/AIFeatures';

function ProtectedLayout({ activeBrand, setActiveBrand }) {
  const [showOCR, setShowOCR] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [ocrPrefill, setOcrPrefill] = useState(null);

  const handleOCRResult = (data) => { setOcrPrefill(data); };
  const handleVoiceResult = (data) => { console.log('Voice parsed:', data); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeBrand={activeBrand} setActiveBrand={setActiveBrand} />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '100%' }}>
        <Routes>
          <Route path="/" element={<Dashboard activeBrand={activeBrand} />} />
          <Route path="/inventory" element={<Inventory activeBrand={activeBrand} />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/shopkeepers" element={<Shopkeepers />} />
          <Route path="/invoices" element={<Invoices activeBrand={activeBrand} prefill={ocrPrefill} />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/expenses" element={<Expenses activeBrand={activeBrand} />} />
        </Routes>
      </main>
      <AIFab onOCR={() => setShowOCR(true)} onVoice={() => setShowVoice(true)} />
      {showOCR && <OCRScanner onResult={handleOCRResult} onClose={() => setShowOCR(false)} />}
      {showVoice && <VoiceInput onResult={handleVoiceResult} onClose={() => setShowVoice(false)} />}
    </div>
  );
}

function AppRoutes() {
  const [activeBrand, setActiveBrand] = useState('all');
  const savedUser = localStorage.getItem('ims_user');
  const [authed, setAuthed] = useState(!!savedUser);

  const handleLogin = (user) => setAuthed(true);
  const handleLogout = () => { localStorage.removeItem('ims_user'); setAuthed(false); };

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
      <Route path="/*" element={
        authed
          ? <ProtectedLayout activeBrand={activeBrand} setActiveBrand={setActiveBrand} onLogout={handleLogout} />
          : <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/brighto-ims">
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </BrowserRouter>
  );
}
