import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Flame, LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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
                onLogin(data.session);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="••••••••"
                        />
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
