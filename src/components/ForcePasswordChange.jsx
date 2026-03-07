import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';

export default function ForcePasswordChange({ onComplete, variant = 'fullscreen' }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Strength calculations
    const hasMinLength = password.length >= 6;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    let strength = 0; // 0 = Fraca, 1 = Média, 2 = Forte

    if (hasMinLength) {
        if (hasLetters && hasNumbers && hasSpecial) {
            strength = 2;
        } else if ((hasLetters && hasNumbers) || (hasLetters && hasSpecial) || (hasNumbers && hasSpecial)) {
            strength = 1;
        }
    }

    const strengthWidths = ['w-1/3', 'w-2/3', 'w-full'];
    const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
    const strengthLabels = ['Fraca', 'Média', 'Forte'];

    const getStrengthBar = () => {
        if (password.length === 0) return <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden mt-2"></div>;
        return (
            <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-neutral-400 font-medium">Força da senha:</span>
                    <span className={`text-xs font-bold ${strengthColors[strength].replace('bg-', 'text-')}`}>
                        {strengthLabels[strength]}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthColors[strength]} ${strengthWidths[strength]} transition-all duration-300`}></div>
                </div>
            </div>
        );
    };

    const isFormValid = strength >= 1 && password === confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const formContent = (
        <>
            <div className="flex flex-col items-center mb-6">
                {variant === 'fullscreen' && (
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mb-4 shadow-inner text-red-400">
                        <ShieldAlert size={32} />
                    </div>
                )}
                <h2 className={`font-black text-white px-2 text-center uppercase mb-2 ${variant === 'fullscreen' ? 'text-2xl' : 'text-xl'}`}>
                    {variant === 'fullscreen' ? (
                        <>Ação<span className="text-red-400">Obrigatória</span></>
                    ) : (
                        <>Nova<span className="text-primary">Senha</span></>
                    )}
                </h2>
                {variant === 'fullscreen' && (
                    <p className="text-neutral-400 text-sm text-center">Por motivos de segurança, você precisa alterar sua senha padrão antes de acessar o painel.</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Nova Senha</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Mínimo 6 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {getStrengthBar()}

                    <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                            {hasMinLength ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-neutral-500" />}
                            <span className={hasMinLength ? "text-emerald-500" : "text-neutral-500"}>Pelo menos 6 caracteres</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            {(hasLetters && hasNumbers) ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-neutral-500" />}
                            <span className={(hasLetters && hasNumbers) ? "text-emerald-500" : "text-neutral-500"}>Letras e números</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Confirmar Nova Senha</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full bg-dark-900/50 border rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:ring-1 transition-all ${confirmPassword && confirmPassword !== password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-dark-600 focus:border-primary focus:ring-primary'}`}
                            placeholder="Repita a senha"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                        <p className="text-red-400 text-xs mt-2 font-medium">As senhas não coincidem.</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(234,179,8,0.2)]"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Lock size={20} className="stroke-[2.5]" />
                                <span>{variant === 'fullscreen' ? 'Salvar e Acessar Painel' : 'Salvar Nova Senha'}</span>
                            </>
                        )}
                    </button>

                    {variant === 'fullscreen' && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-neutral-400 hover:text-white text-sm font-medium py-2 transition-colors"
                        >
                            Cancelar e Sair
                        </button>
                    )}
                </div>
            </form>
        </>
    );

    if (variant === 'inline') {
        return formContent;
    }

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 rounded-3xl shadow-2xl overflow-hidden p-8 z-10">
                {formContent}
            </div>
        </div>
    );
}
