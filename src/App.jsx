import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';

function App() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  // Verifica sessão salva no localStorage ao carregar
  useEffect(() => {
    const stored = localStorage.getItem('tabacaria_admin_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Sessão válida por 24h
        if (parsed.authenticated && (Date.now() - parsed.timestamp) < 86400000) {
          setIsAdminAuth(true);
        } else {
          localStorage.removeItem('tabacaria_admin_auth');
        }
      } catch {
        localStorage.removeItem('tabacaria_admin_auth');
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAdminAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tabacaria_admin_auth');
    setIsAdminAuth(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Catálogo do Cliente */}
        <Route path="/" element={<Home />} />

        {/* Login do Admin */}
        <Route
          path="/login"
          element={
            isAdminAuth
              ? <Navigate to="/admin" replace />
              : <AdminLogin onLoginSuccess={handleLoginSuccess} />
          }
        />

        {/* Painel Admin (Protegido) */}
        <Route
          path="/admin"
          element={
            isAdminAuth
              ? <AdminPanel onLogout={handleLogout} />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
