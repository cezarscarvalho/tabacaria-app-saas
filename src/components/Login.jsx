import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Flame, LogIn, Eye, EyeOff, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Forgot Password State
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
            }

            if (data?.session) {
                // Verifica se a senha usada é uma senha padrão para forçar troca
                const isDefaultPassword = password === 'Mudar123' || password === '123456';
                onLogin(data.session, isDefaultPassword);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setResetMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: window.location.origin + '/admin',
            });

            if (error) throw error;

            // Mensagem genérica por segurança
            setResetMessage({
                type: 'success',
                text: 'Se o e-mail for válido, enviaremos um link de recuperação para ele em instantes.'
            });
            setResetEmail('');
        } catch (err) {
            // Mesma mensagem em caso de erro para não revelar se o email existe ou não
            setResetMessage({
                type: 'success',
                text: 'Se o e-mail for válido, enviaremos um link de recuperação para ele em instantes.'
            });
        } finally {
            setResetLoading(false);
        }
    };

    if (isForgotPassword) {
        return (
            <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-md bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 rounded-3xl shadow-2xl overflow-hidden p-8 z-10">
                    <button
                        onClick={() => { setIsForgotPassword(false); setResetMessage(null); }}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Voltar para o Login
                    </button>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-dark-900 rounded-2xl flex items-center justify-center border border-dark-700 mb-4 shadow-inner">
                            <ShieldCheck size={32} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-wider uppercase mb-2">Recuperar<span className="text-primary">Senha</span></h2>
                        <p className="text-neutral-400 text-sm text-center">Informe seu e-mail para receber o link de redefinição seguro.</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-5">
                        {resetMessage && (
                            <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${resetMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                                {resetMessage.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">E-mail</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3.5 pl-11 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="admin@exemplo.com"
                                />
                                <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={resetLoading}
                            className="w-full mt-4 bg-primary hover:bg-primary-hover text-dark-900 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(234,179,8,0.2)]"
                        >
                            {resetLoading ? (
                                <div className="w-6 h-6 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Mail size={20} className="stroke-[2.5]" />
                                    <span>Enviar Link de Recuperação</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 rounded-3xl shadow-2xl overflow-hidden p-8 z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-dark-900 rounded-2xl flex items-center justify-center border border-dark-700 mb-4 shadow-inner">
                        <Flame size={32} className="text-primary fill-current" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-wider uppercase mb-1">Acesso<span className="text-primary">Admin</span></h2>
                    <p className="text-neutral-400 text-sm text-center">Gestão exclusiva da tabacaria</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="admin@exemplo.com"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-neutral-300">Senha</label>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                                tabIndex="-1"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-primary hover:bg-primary-hover text-dark-900 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(234,179,8,0.2)]"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <LogIn size={20} className="stroke-[2.5]" />
                                <span>Entrar no Painel</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
