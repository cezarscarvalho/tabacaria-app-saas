import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Check, AlertTriangle, Save, Store, ShieldCheck, Globe, MessageSquare } from 'lucide-react';
import ForcePasswordChange from '../ForcePasswordChange';

export default function Settings({ session, settingsData, refreshFunc }) {
    const [activeTab, setActiveTab] = useState('store'); // 'store' | 'email' | 'password'

    // Form State para Dados da Loja
    const [storeForm, setStoreForm] = useState({
        nome_estabelecimento: '',
        whatsapp_suporte: '',
        email_notificacao: '',
        link_catalogo: ''
    });
    const [savingStore, setSavingStore] = useState(false);

    // Email Form State (Legacy)
    const [newEmail, setNewEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [message, setMessage] = useState(null);

    // Sincroniza dados iniciais vindo do pai
    useEffect(() => {
        if (settingsData) {
            setStoreForm({
                nome_estabelecimento: settingsData.nome_estabelecimento || '',
                whatsapp_suporte: settingsData.whatsapp_suporte || '',
                email_notificacao: settingsData.email_notificacao || '',
                link_catalogo: settingsData.link_catalogo || ''
            });
        }
    }, [settingsData]);

    const handleSaveStore = async (e) => {
        e.preventDefault();
        setSavingStore(true);
        setMessage(null);

        try {
            // Upsert: atualiza se o ID existir, caso contrário insere (usando id 1 como padrão)
            const { error } = await supabase
                .from('configuracoes')
                .upsert({
                    id: settingsData?.id || 1,
                    ...storeForm,
                    updated_at: new Date()
                });

            if (error) throw error;

            alert('Configurações atualizadas com sucesso! 🛡️✨');
            if (refreshFunc) refreshFunc();
        } catch (error) {
            console.error('Erro ao salvar settings:', error.message);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSavingStore(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!newEmail || newEmail === session?.user?.email) return;

        setLoadingEmail(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Confirme a alteração nos dois e-mails.' });
            setNewEmail('');
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoadingEmail(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Configurações Premium</h1>
                <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest mt-1">Gestão de Identidade e Segurança</p>
            </div>

            <div className="bg-dark-800 rounded-[2.5rem] border border-dark-700 overflow-hidden shadow-2xl mb-12">
                <div className="flex border-b border-dark-700 bg-dark-900/50 p-2 gap-2">
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${activeTab === 'store' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:text-white hover:bg-dark-800'}`}
                    >
                        <Store size={14} /> Dados da Loja
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${activeTab === 'email' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:text-white hover:bg-dark-800'}`}
                    >
                        <Mail size={14} /> Conta Admin
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${activeTab === 'password' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:text-white hover:bg-dark-800'}`}
                    >
                        <ShieldCheck size={14} /> Segurança
                    </button>
                </div>

                <div className="p-8 md:p-12">
                    {activeTab === 'store' && (
                        <form onSubmit={handleSaveStore} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Nome do Estabelecimento *</label>
                                    <div className="relative">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                        <input
                                            required
                                            className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 outline-none focus:border-primary text-white font-bold transition-all"
                                            value={storeForm.nome_estabelecimento}
                                            onChange={e => setStoreForm({ ...storeForm, nome_estabelecimento: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">WhatsApp de Suporte (SAC)</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                        <input
                                            className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 outline-none focus:border-primary text-white font-mono transition-all"
                                            placeholder="5511988541006"
                                            value={storeForm.whatsapp_suporte}
                                            onChange={e => setStoreForm({ ...storeForm, whatsapp_suporte: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[9px] text-neutral-600 mt-2 italic">* Este número será usado no botão 'Fale Conosco'</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">E-mail para Notificações</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                        <input
                                            className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 outline-none focus:border-primary text-white font-bold transition-all"
                                            value={storeForm.email_notificacao}
                                            onChange={e => setStoreForm({ ...storeForm, email_notificacao: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Link Público do Catálogo</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                        <input
                                            className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 outline-none focus:border-primary text-white font-bold transition-all"
                                            placeholder="https://sua-loja.vercel.app"
                                            value={storeForm.link_catalogo}
                                            onChange={e => setStoreForm({ ...storeForm, link_catalogo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-8">
                                <button
                                    type="submit"
                                    disabled={savingStore}
                                    className="w-full md:w-auto bg-primary text-dark-900 font-black py-5 px-12 rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {savingStore ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'email' && (
                        <div className="max-w-md">
                            <div className="mb-8 p-6 rounded-3xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-1">E-mail Atual de Acesso</p>
                                    <div className="text-white font-black italic">{session?.user?.email}</div>
                                </div>
                                <ShieldCheck className="text-primary/40" size={32} />
                            </div>

                            <form onSubmit={handleUpdateEmail} className="space-y-6">
                                {message && (
                                    <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                                        {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                                        {message.text}
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Novo E-mail de Admin</label>
                                    <input
                                        required
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 outline-none focus:border-primary text-white font-bold transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loadingEmail || !newEmail || newEmail === session?.user?.email}
                                    className="w-full bg-primary text-dark-900 font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
                                >
                                    Atualizar Login
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="max-w-md">
                            <ForcePasswordChange onComplete={() => alert('Senha alterada!')} variant="inline" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
