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
    Bell
} from 'lucide-react';

// Sub-componentes Admin
import Orders from '../components/admin/Orders';
import Logistics from '../components/admin/Logistics';
import Messages from '../components/admin/Messages';
import Finance from '../components/admin/Finance';
import Clients from '../components/admin/Clients';

export default function AdminPanel() {
    console.log('[DEBUG-STATIC] Renderizando Admin Shell (Arquitetura Estática).');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('vendas');

    // Estados Centrais - CARREGAMENTO ESTÁTICO
    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    // 1. Auth Estrito: Roda apenas UMA VEZ
    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) setSession(s);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            if (mounted) setSession(s);
        });
        return () => { mounted = false; subscription.unsubscribe(); };
    }, []);

    // 2. BUSCA ÚNICA (useEffect []) - Coração da Estabilidade
    useEffect(() => {
        if (session) {
            console.log('[DEBUG-STATIC] Disparando Carregamento Único Inicial.');
            fetchAllData();
        }
    }, [session]);

    const fetchAllData = async () => {
        if (loading) return;
        setLoading(true);
        console.log('[DEBUG-STATIC] Buscando dados do Supabase...');

        try {
            // Busca Pedidos
            const { data: ords } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
            setOrders(ords || []);

            // Busca Mensagens
            const { data: msgs } = await supabase.from('mensagens').select('*').order('created_at', { ascending: false });
            setMessages(msgs || []);
            setUnreadMessages((msgs || []).filter(m => !m.lida).length);

            // Busca Clientes
            const { data: clis } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
            setClients(clis || []);

        } catch (err) {
            console.error('Erro no carregamento estático:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
                <div className="animate-in fade-in zoom-in duration-500">
                    <Package className="text-primary mx-auto mb-4 animate-bounce" size={48} />
                    <p className="text-primary font-black uppercase tracking-[0.2em] text-sm">Validando Acesso...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'vendas': return <Orders ordersData={orders} refreshFunc={fetchAllData} />;
            case 'mensagens': return <Messages messagesData={messages} refreshFunc={fetchAllData} />;
            case 'logistica': return <Logistics ordersData={orders} refreshFunc={fetchAllData} />;
            case 'financeiro': return <Finance ordersData={orders} refreshFunc={fetchAllData} />;
            case 'clientes': return <Clients clientsData={clients} refreshFunc={fetchAllData} />;
            default: return <Orders ordersData={orders} refreshFunc={fetchAllData} />;
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row font-sans overflow-hidden h-screen">
            {/* Sidebar Shell */}
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 flex flex-col md:h-full z-50">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-dark-700 bg-dark-900/40">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <Package className="text-primary" size={24} />
                    </div>
                    <div>
                        <span className="font-black text-white uppercase tracking-tighter text-xl block leading-none">ADMIN</span>
                        <span className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1 block">Static Load v2</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex md:flex-col gap-1.5 overflow-y-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('vendas')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'vendas' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <ClipboardList size={18} /> Vendas
                    </button>

                    <button
                        onClick={() => setActiveTab('mensagens')}
                        className={`flex items-center justify-between px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'mensagens' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <MessageCircle size={18} /> Mensagens
                        </div>
                        {unreadMessages > 0 && <span className="bg-primary text-dark-900 px-2 py-0.5 rounded-full text-[9px] font-black">{unreadMessages}</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('logistica')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'logistica' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <Truck size={18} /> Logística
                    </button>

                    <button
                        onClick={() => setActiveTab('clientes')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'clientes' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <Users size={18} /> Clientes
                    </button>

                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'financeiro' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <TrendingUp size={18} /> Financeiro
                    </button>
                </nav>

                <div className="p-4 border-t border-dark-700">
                    <button
                        onClick={handleLogout}
                        className="w-full p-3 bg-dark-700 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header Estático com Botão de Refresh */}
                <header className="h-20 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-6 md:px-10 shrink-0">
                    <h2 className="text-sm font-black text-neutral-400 uppercase tracking-widest animate-in slide-in-from-left duration-500">
                        Painel de Controle <span className="text-white">/ {activeTab}</span>
                    </h2>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchAllData}
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50`}
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Sincronizando...' : 'Atualizar Dados'}
                        </button>
                        <button onClick={() => window.location.href = '/'} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-neutral-300 transition-all">
                            <LayoutDashboard size={20} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-dark-900 custom-scrollbar animate-in fade-in duration-700">
                    <div className="max-w-7xl mx-auto pb-10">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}
