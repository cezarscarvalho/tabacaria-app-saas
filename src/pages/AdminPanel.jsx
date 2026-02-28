import React, { useEffect, useState, useRef } from 'react';
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
    Bell
} from 'lucide-react';

// Sub-componentes Admin
import Orders from '../components/admin/Orders';
import Logistics from '../components/admin/Logistics';
import Messages from '../components/admin/Messages';
import Finance from '../components/admin/Finance';

export default function AdminPanel() {
    console.log('[DEBUG] AdminPanel: Renderizando Shell Premium Estabilizado.');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('vendas');

    // Estado para o "Plim" Seguro
    const [msgCount, setMsgCount] = useState(0);
    const prevMsgCount = useRef(0);
    const [unreadCount, setUnreadCount] = useState(0);

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

    // 2. Monitoramento de Mensagens para o "Plim" Seguro
    useEffect(() => {
        if (!session) return;

        const checkNewMessages = async () => {
            try {
                const { data, count, error } = await supabase
                    .from('mensagens')
                    .select('*', { count: 'exact', head: true })
                    .eq('lida', false);

                if (error) throw error;

                const currentCount = count || 0;
                setUnreadCount(currentCount);

                // O "Plim" Seguro: Toca apenas se o número aumentou
                if (currentCount > prevMsgCount.current && prevMsgCount.current > 0) {
                    console.log('[DEBUG] Novo alerta: Mensagens aumentaram de', prevMsgCount.current, 'para', currentCount);
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(e => console.warn('Áudio bloqueado pelo browser:', e.message));
                }

                // Atualiza a referência para a próxima comparação
                prevMsgCount.current = currentCount;
            } catch (err) {
                console.error('Erro ao verificar mensagens:', err.message);
            }
        };

        checkNewMessages();
    }, [session, activeTab]); // Re-checa ao trocar de aba ou logar

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-white text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="text-primary" size={32} />
                    </div>
                    <p className="font-bold text-lg animate-pulse uppercase tracking-widest text-primary">Autenticando Painel...</p>
                    <button onClick={() => window.location.reload()} className="mt-8 text-[10px] uppercase font-black text-neutral-600 hover:text-neutral-400 tracking-tighter">Recarregar Sistema</button>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'vendas': return <Orders />;
            case 'mensagens': return <Messages />;
            case 'logistica': return <Logistics />;
            case 'financeiro': return <Finance />;
            default: return <Orders />;
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row font-sans">
            {/* Sidebar Shell Premium */}
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 flex flex-col sticky top-0 md:h-screen z-50 shadow-2xl">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-dark-700 bg-dark-900/40">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <Package className="text-primary" size={24} />
                    </div>
                    <div>
                        <span className="font-black text-white uppercase tracking-tighter text-xl block leading-none">Admin</span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1.5 block">Premium Suite</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-y-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('vendas')}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'vendas' ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <ClipboardList size={18} /> Vendas
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('mensagens')}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'mensagens' ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <MessageCircle size={18} /> Suporte
                        </div>
                        {unreadCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse ${activeTab === 'mensagens' ? 'bg-dark-900 text-primary' : 'bg-primary text-dark-900'}`}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('logistica')}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'logistica' ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Truck size={18} /> Logística
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'financeiro' ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <TrendingUp size={18} /> Financeiro
                        </div>
                    </button>
                </nav>

                <div className="p-4 border-t border-dark-700 bg-dark-900/20">
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full mt-3 p-4 bg-dark-700 hover:bg-dark-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <LayoutDashboard size={16} /> Ver Loja
                    </button>
                </div>
            </aside>

            {/* Main Viewport */}
            <main className="flex-1 p-4 md:p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-dark-800/50 via-dark-900 to-dark-900 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
