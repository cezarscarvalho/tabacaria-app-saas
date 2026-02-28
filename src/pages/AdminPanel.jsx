import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package,
    ClipboardList,
    LogOut,
    Truck,
    LayoutDashboard,
    MessageCircle,
    TrendingUp,
    RefreshCw,
    Users,
    Settings as SettingsIcon,
    Bell,
    Clock
} from 'lucide-react';

// Sub-componentes Admin - Arquitetura Estática Protegida
import Orders from '../components/admin/Orders';
import AdminLogistics from '../components/admin/AdminLogistics';
import Messages from '../components/admin/Messages';
import Finance from '../components/admin/Finance';
import Clients from '../components/admin/Clients';
import Settings from '../components/admin/Settings';

export default function AdminPanel() {
    console.log('[DEBUG-STABLE] Carregando Admin Shell - Garantia de Não-Vazio.');

    // Estados de Sessão e Tab
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('vendas');

    // Estados Centrais - CARREGAMENTO EM CAMADA ÚNICA (Mount-Only)
    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

    // 1. Monitor de Auth: Roda apenas UMA VEZ para estabilidade.
    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (isMounted) setSession(s);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            if (isMounted) setSession(s);
        });
        return () => { isMounted = false; subscription.unsubscribe(); };
    }, []);

    // 2. BUSCA DE DADOS (Arquitetura de Carregamento Único)
    useEffect(() => {
        if (session) {
            console.log('[DEBUG-STABLE] Usuário Autenticado. Buscando dados iniciais...');
            fetchAllData();
        }
    }, [session]);

    const fetchAllData = async () => {
        if (loading) return;
        setLoading(true);
        console.log('[DEBUG-STABLE] Iniciando Sincronização Estática via Supabase.');

        try {
            // Promessas paralelas para máxima performance
            const [ordersRes, messagesRes, clientsRes, settingsRes] = await Promise.all([
                supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
                supabase.from('mensagens').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('*').order('nome', { ascending: true }),
                supabase.from('configuracoes').select('*').limit(1).single()
            ]);

            setOrders(ordersRes.data || []);
            setMessages(messagesRes.data || []);
            setClients(clientsRes.data || []);
            setSettings(settingsRes.data || null);
            setLastUpdate(new Date().toLocaleTimeString());

            console.log('[DEBUG-STABLE] Cache alimentado com sucesso.');
        } catch (error) {
            console.error('[ERRO-STABLE] Falha no carregamento dos dados:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Render de Validação de Acesso
    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center font-sans tracking-tight">
                <div className="animate-in fade-in zoom-in duration-700 bg-dark-800 p-12 rounded-[3.5rem] border border-dark-700 shadow-2xl">
                    <Package className="text-primary mx-auto mb-6 animate-pulse" size={64} />
                    <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter mb-2">Segurança Ativa</h3>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px]">Autenticando sessão protegida...</p>
                </div>
            </div>
        );
    }

    // Gerenciador de Abas Dinâmico e Seguro
    const renderActiveTab = () => {
        const props = { refreshFunc: fetchAllData };
        switch (activeTab) {
            case 'vendas': return <Orders ordersData={orders} {...props} />;
            case 'mensagens': return <Messages messagesData={messages} {...props} />;
            case 'logistica': return <AdminLogistics ordersData={orders} {...props} />;
            case 'financeiro': return <Finance ordersData={orders} {...props} />;
            case 'clientes': return <Clients clientsData={clients} {...props} />;
            case 'configuracoes': return <Settings session={session} settingsData={settings} {...props} />;
            default: return <Orders ordersData={orders} {...props} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-neutral-200 flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            {/* Sidebar High-End */}
            <aside className="w-full md:w-72 bg-dark-800 border-r border-dark-700 flex flex-col md:h-full z-50 shadow-2xl">
                <div className="h-24 flex items-center gap-5 px-8 border-b border-dark-700 bg-dark-900/60 transition-all">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                        <Package className="text-primary" size={28} />
                    </div>
                    <div>
                        <span className="font-black text-white uppercase tracking-tighter text-2xl block leading-none">HUB<span className="text-primary">ADMIN</span></span>
                        <span className="text-[8px] text-primary/60 font-black uppercase tracking-[0.4em] mt-1.5 block">Premium Core v3</span>
                    </div>
                </div>

                <nav className="flex-1 p-6 flex md:flex-col gap-2 overflow-y-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('vendas')}
                        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === 'vendas' ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.02]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <ClipboardList size={20} className={activeTab === 'vendas' ? 'text-dark-900' : 'group-hover:text-primary transition-colors'} /> Vendas
                    </button>

                    <button
                        onClick={() => setActiveTab('mensagens')}
                        className={`group flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === 'mensagens' ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.02]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-4">
                            <MessageCircle size={20} className={activeTab === 'mensagens' ? 'text-dark-900' : 'group-hover:text-primary transition-colors'} /> Suporte
                        </div>
                        {messages.filter(m => !m.lida).length > 0 && <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black shadow-lg shadow-red-500/20">{messages.filter(m => !m.lida).length}</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('logistica')}
                        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === 'logistica' ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.02]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <Truck size={20} className={activeTab === 'logistica' ? 'text-dark-900' : 'group-hover:text-primary transition-colors'} /> Logística
                    </button>

                    <button
                        onClick={() => setActiveTab('clientes')}
                        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === 'clientes' ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.02]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <Users size={20} className={activeTab === 'clientes' ? 'text-dark-900' : 'group-hover:text-primary transition-colors'} /> Clientes
                    </button>

                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === 'financeiro' ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.02]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <TrendingUp size={20} className={activeTab === 'financeiro' ? 'text-dark-900' : 'group-hover:text-primary transition-colors'} /> Financeiro
                    </button>

                    <div className="h-px bg-dark-700 my-4 mx-2 opacity-50"></div>

                    <button
                        onClick={() => setActiveTab('configuracoes')}
                        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === 'configuracoes' ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.02]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <SettingsIcon size={20} className={activeTab === 'configuracoes' ? 'text-dark-900' : 'group-hover:text-primary transition-colors'} /> Perfil & Loja
                    </button>
                </nav>

                <div className="p-6 border-t border-dark-700 bg-dark-900/20">
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 bg-dark-700 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 border border-dark-600 hover:border-red-500/30"
                    >
                        <LogOut size={16} /> Encerrar Sessão
                    </button>
                </div>
            </aside>

            {/* Workplace */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-8 md:px-14 shrink-0 transition-all">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter animate-in slide-in-from-left duration-700">
                            {activeTab} <span className="text-neutral-600 font-normal">/ Overview</span>
                        </h2>
                        <div className="flex items-center gap-2 text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-1.5">
                            <Clock size={10} /> Última sincronização: {lastUpdate}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={fetchAllData}
                            disabled={loading}
                            className={`flex items-center gap-3 px-6 py-3.5 bg-primary text-dark-900 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50`}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Processando...' : 'Sync Global'}
                        </button>

                        <div className="h-10 w-px bg-dark-700 mx-2 opacity-50 hidden md:block"></div>

                        <button onClick={() => window.location.href = '/'} className="p-3 bg-dark-700 hover:bg-primary hover:text-dark-900 rounded-xl text-neutral-300 transition-all border border-dark-600 shadow-lg">
                            <LayoutDashboard size={20} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-8 md:p-14 overflow-y-auto bg-[#0d0d0d] custom-scrollbar animate-in fade-in duration-1000">
                    <div className="max-w-7xl mx-auto pb-16">
                        {renderActiveTab()}
                    </div>
                </main>

                {/* Overlay de Loading Visual */}
                {loading && (
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-[100] animate-pulse"></div>
                )}
            </div>
        </div>
    );
}
