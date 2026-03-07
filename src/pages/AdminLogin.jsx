import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../core/supabaseClient';
import { Package, Mail, Lock, LogIn, RefreshCw, ShieldAlert, Flame } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Busca credenciais da tabela configuracoes
            const { data, error: fetchError } = await supabase
                .from('configuracoes')
                .select('email_admin, senha_admin')
                .limit(1)
                .single();

            if (fetchError) throw new Error('Erro ao conectar com o servidor.');

            // Verifica credenciais
            if (data.email_admin === email.trim() && data.senha_admin === password) {
                // Login bem-sucedido → salva sessão local
                localStorage.setItem('tabacaria_admin_auth', JSON.stringify({
                    authenticated: true,
                    email: email.trim(),
                    timestamp: Date.now()
                }));
                if (onLoginSuccess) onLoginSuccess();
                navigate('/admin');
            } else {
                setError('Acesso Negado. E-mail ou senha incorretos.');
            }
        } catch (err) {
            setError(err.message || 'Erro de conexão.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
                {/* Logo / Branding */}
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

                {/* Login Card */}
                <form onSubmit={handleLogin} className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-12 shadow-3xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-[80px] pointer-events-none"></div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 px-6 py-5 rounded-2xl text-xs font-black uppercase italic text-center animate-in fade-in slide-in-from-top-4 duration-300 flex items-center justify-center gap-3">
                            <ShieldAlert size={16} /> {error}
                        </div>
                    )}

                    {/* Email Field */}
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

                    {/* Password Field */}
                    <div className="relative z-10">
                        <label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-[0.3em]">
                            Senha de Acesso
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 pl-14 pr-14 text-white font-bold outline-none focus:border-primary transition-all shadow-inner hover:border-dark-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-primary transition-colors text-[9px] font-black uppercase tracking-widest"
                            >
                                {showPassword ? 'Ocultar' : 'Exibir'}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
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
                </form>

                {/* Footer */}
                <p className="text-center text-neutral-600 text-[8px] font-black uppercase tracking-[0.4em] mt-10 italic">
                    Acesso exclusivo para administradores
                </p>
            </div>
        </div>
    );
}
