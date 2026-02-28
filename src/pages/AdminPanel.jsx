import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Package, ClipboardList, LogOut, Truck, LayoutDashboard } from 'lucide-react';
import Orders from '../components/admin/Orders';
import Logistics from '../components/admin/Logistics';

export default function AdminPanel() {
    console.log('[REBUILD] AdminPanel: Carregando módulos estáveis.');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');

    // 1. Auth Simples e Estável
    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) setSession(s);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            if (mounted) {
                console.log('[REBUILD] Auth Change:', _event);
                setSession(s);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
                <div className="bg-dark-800 p-10 rounded-3xl border border-dark-700 text-center shadow-2xl max-w-sm w-full animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="text-primary" size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Acesso Restrito</h1>
                    <p className="text-neutral-400 mb-8 text-sm leading-relaxed">Este painel é exclusivo para administradores. Por favor, realize o login para continuar.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-4 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-primary/20"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'orders': return <Orders />;
            case 'logistics': return <Logistics />;
            default: return <Orders />;
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row">
            {/* Sidebar Reconstruída */}
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 flex flex-col sticky top-0 md:h-screen z-50 shadow-xl">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-dark-700 bg-dark-900/40">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Package className="text-primary" size={24} />
                    </div>
                    <div>
                        <span className="font-black text-white uppercase tracking-tighter text-lg block leading-none">Admin</span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 block">Estabilidade Ativa</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-y-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'orders' ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20 scale-[1.02]' : 'text-neutral-400 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <ClipboardList size={20} /> Vendas
                    </button>
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'logistics' ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20 scale-[1.02]' : 'text-neutral-400 hover:bg-dark-700 hover:text-white'}`}
                    >
                        <Truck size={20} /> Logística
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
                        <LayoutDashboard size={16} /> Ver Catálogo
                    </button>
                </div>
            </aside>

            {/* Conteúdo Principal (O Coração) */}
            <main className="flex-1 p-4 md:p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-dark-800/50 via-dark-900 to-dark-900">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
