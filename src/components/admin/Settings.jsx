import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Mail, Check, AlertTriangle, Save } from 'lucide-react';
import ForcePasswordChange from '../ForcePasswordChange';

export default function Settings({ session }) {
    const [activeTab, setActiveTab] = useState('email'); // 'email' | 'password'

    // Email Form State
    const [newEmail, setNewEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [emailMessage, setEmailMessage] = useState(null);

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!newEmail || newEmail === session?.user?.email) return;

        setLoadingEmail(true);
        setEmailMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });

            if (error) throw error;

            setEmailMessage({
                type: 'success',
                text: 'Um link de confirmação foi enviado para os dois e-mails (o atual e o novo). Confirme a alteração neles.'
            });
            setNewEmail('');
        } catch (error) {
            setEmailMessage({
                type: 'error',
                text: error.message
            });
        } finally {
            setLoadingEmail(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Configurações Base</h1>
                <p className="text-neutral-400 text-sm mt-1">Gerencie as senhas e credenciais de acesso do painel de administração</p>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl mb-8">
                <div className="flex border-b border-dark-700 bg-dark-900/50">
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'email' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-white hover:bg-dark-800'}`}
                    >
                        Alterar E-mail
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'password' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-white hover:bg-dark-800'}`}
                    >
                        Alterar Senha
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {activeTab === 'email' ? (
                        <div className="max-w-md">
                            <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">E-mail Atual</p>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <Mail size={16} className="text-neutral-400" />
                                    {session?.user?.email}
                                </div>
                            </div>

                            <form onSubmit={handleUpdateEmail} className="space-y-4">
                                {emailMessage && (
                                    <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${emailMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                                        {emailMessage.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                                        {emailMessage.text}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Novo E-mail de Acesso</label>
                                    <input
                                        required
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="novo_admin@exemplo.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loadingEmail || !newEmail || newEmail === session?.user?.email}
                                    className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-dark-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingEmail ? (
                                        <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={18} className="stroke-[2.5]" />
                                            Solicitar Alteração
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="relative z-0">
                            {/* Reusing force change logic but styling it inline without the full screen block */}
                            <div className="max-w-md transform scale-100 origin-top-left">
                                <ForcePasswordChange onComplete={() => alert('Senha alterada com sucesso!')} variant="inline" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
