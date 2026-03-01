import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import { Flame, Mail, Lock, LogIn, RefreshCw, ShieldAlert, ArrowLeft, Send } from 'lucide-react';

/* ─── Componente de Login + Recuperação ─── */
function AdminLoginGate({ children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [checking, setChecking] = useState(true);

  // Estado de Recuperação de Senha
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Verifica sessão salva (expira em 24h)
  useEffect(() => {
    const stored = localStorage.getItem('tabacaria_admin_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.authenticated && (Date.now() - parsed.timestamp) < 86400000) {
          setIsAuth(true);
        } else {
          localStorage.removeItem('tabacaria_admin_auth');
        }
      } catch {
        localStorage.removeItem('tabacaria_admin_auth');
      }
    }
    setChecking(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('configuracoes')
        .select('email_admin, senha_admin')
        .limit(1)
        .single();

      if (fetchError) throw new Error('Erro ao conectar com o servidor.');

      if (data.email_admin === email.trim() && data.senha_admin === password) {
        localStorage.setItem('tabacaria_admin_auth', JSON.stringify({
          authenticated: true,
          email: email.trim(),
          timestamp: Date.now()
        }));
        setIsAuth(true);
      } else {
        setError('Acesso Negado. E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError(err.message || 'Erro de conexão.');
    }
    setLoading(false);
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryMsg('');
    setRecoveryLoading(true);
    try {
      // Verifica se o e-mail existe na tabela configuracoes
      const { data, error: fetchError } = await supabase
        .from('configuracoes')
        .select('email_admin')
        .limit(1)
        .single();

      if (fetchError) throw new Error('Erro de conexão.');

      if (data.email_admin !== recoveryEmail.trim()) {
        setRecoveryError('E-mail não encontrado nas configurações do sistema.');
      } else {
        // Envia link de recuperação via Supabase Auth
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          recoveryEmail.trim(),
          { redirectTo: window.location.origin + '/admin' }
        );
        if (resetError) throw resetError;
        setRecoveryMsg('Link de recuperação enviado para o seu e-mail! Verifique sua caixa de entrada.');
      }
    } catch (err) {
      setRecoveryError(err.message || 'Erro ao processar recuperação.');
    }
    setRecoveryLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('tabacaria_admin_auth');
    setIsAuth(false);
  };

  // Loading inicial
  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Flame size={40} className="text-primary animate-pulse" />
      </div>
    );
  }

  // Se autenticado → renderiza o AdminPanel
  if (isAuth) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  // ─── TELA DE RECUPERAÇÃO DE SENHA ───
  if (showRecovery) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] animate-pulse"></div>
        </div>
        <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-dark-800 border-2 border-dark-700 rounded-[2rem] mb-8 shadow-2xl">
              <Mail size={40} className="text-primary" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none mb-3">
              Recuperar<span className="text-primary"> Acesso</span>
            </h1>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
              Digite o e-mail cadastrado no sistema
            </p>
          </div>

          <form onSubmit={handleRecovery} className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-12 shadow-3xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            {recoveryError && (
              <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 px-6 py-5 rounded-2xl text-xs font-black uppercase italic text-center animate-in fade-in flex items-center justify-center gap-3">
                <ShieldAlert size={16} /> {recoveryError}
              </div>
            )}
            {recoveryMsg && (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 px-6 py-5 rounded-2xl text-xs font-black uppercase italic text-center animate-in fade-in flex items-center justify-center gap-3">
                <Send size={16} /> {recoveryMsg}
              </div>
            )}

            <div className="relative z-10">
              <label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-[0.3em]">
                E-mail do Administrador
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  placeholder="admin@tabacaria.com"
                  className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 pl-14 text-white font-bold outline-none focus:border-primary transition-all shadow-inner hover:border-dark-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="relative z-10 w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-7 rounded-[2rem] uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-4"
            >
              {recoveryLoading ? (
                <><RefreshCw className="animate-spin" size={20} /> ENVIANDO...</>
              ) : (
                <><Send size={20} /> ENVIAR LINK DE RECUPERAÇÃO</>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setShowRecovery(false); setRecoveryError(''); setRecoveryMsg(''); }}
              className="relative z-10 w-full text-neutral-500 hover:text-white font-black py-4 uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 transition-all"
            >
              <ArrowLeft size={14} /> Voltar ao Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── TELA DE LOGIN ───
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
        {/* Logo */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-dark-800 border-2 border-dark-700 rounded-[2rem] mb-8 shadow-2xl relative group">
            <Flame size={40} className="text-primary fill-current animate-pulse" />
            <div className="absolute inset-0 bg-primary/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none mb-3">
            HUB<span className="text-primary">ADMIN</span>
          </h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.5em] italic">
            Painel de Controle Exclusivo
          </p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-12 shadow-3xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 px-6 py-5 rounded-2xl text-xs font-black uppercase italic text-center animate-in fade-in slide-in-from-top-4 duration-300 flex items-center justify-center gap-3">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          {/* E-mail */}
          <div className="relative z-10">
            <label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-[0.3em]">
              E-mail do Administrador
            </label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@tabacaria.com"
                className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 pl-14 text-white font-bold outline-none focus:border-primary transition-all shadow-inner hover:border-dark-600"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="relative z-10">
            <label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-[0.3em]">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 pl-14 pr-14 text-white font-bold outline-none focus:border-primary transition-all shadow-inner hover:border-dark-600"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-primary transition-colors text-[9px] font-black uppercase tracking-widest"
              >
                {showPw ? 'Ocultar' : 'Exibir'}
              </button>
            </div>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="relative z-10 w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-7 rounded-[2rem] uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-4 mt-4"
          >
            {loading ? (
              <><RefreshCw className="animate-spin" size={20} /> AUTENTICANDO...</>
            ) : (
              <><LogIn size={20} /> ENTRAR NO HUB</>
            )}
          </button>

          {/* Link Esqueci Senha */}
          <button
            type="button"
            onClick={() => { setShowRecovery(true); setError(''); }}
            className="relative z-10 w-full text-neutral-500 hover:text-primary font-black py-2 uppercase tracking-[0.3em] text-[9px] flex items-center justify-center gap-2 transition-all"
          >
            <Lock size={12} /> Esqueci minha senha
          </button>
        </form>

        <p className="text-center text-neutral-600 text-[8px] font-black uppercase tracking-[0.4em] mt-10 italic">
          Acesso exclusivo para administradores
        </p>
      </div>
    </div>
  );
}

/* ─── App Principal ─── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminLoginGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
