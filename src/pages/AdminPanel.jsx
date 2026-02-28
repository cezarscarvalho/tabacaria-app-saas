import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import Login from '../components/Login';
import ForcePasswordChange from '../components/ForcePasswordChange';
import Orders from '../components/admin/Orders';
import Finance from '../components/admin/Finance';
import Messages from '../components/admin/Messages';
import Logistics from '../components/admin/Logistics';
import { LayoutDashboard, LogOut, Truck, ClipboardList, TrendingUp, Mail, Package } from 'lucide-react';

export default function AdminPanel() {
    const [session, setSession] = useState(null);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [activeTab, setActiveTab] = useState('orders');
    const [unreadMessages, setUnreadMessages] = useState(0);
    const prevUnreadCount = useRef(0);

    // Sidebar Items Configuration
    const menuItems = [
        { id: 'orders', label: 'Vendas', icon: <ClipboardList size={18} /> },
        { id: 'logistics', label: 'Logística', icon: <Truck size={18} /> },
        { id: 'messages', label: 'Suporte', icon: <Mail size={18} />, badge: true },
        { id: 'finance', label: 'Financeiro', icon: <TrendingUp size={18} /> },
    ];

    // Auth & Session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Message Notifications
    const fetchUnreadCount = async () => {
        try {
            const { count, error } = await supabase
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('lida', false);

            if (!error) setUnreadMessages(count || 0);
        } catch (err) {
            console.error('Erro no contador:', err);
        }
    };

    useEffect(() => {
        if (session) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    useEffect(() => {
        if (unreadMessages > prevUnreadCount.current) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => { });
        }
        prevUnreadCount.current = unreadMessages;
    }, [unreadMessages]);

    const handleLogout = () => supabase.auth.signOut();

    if (!session) return <Login onLogin={(s, needs) => { setSession(s); setForcePasswordChange(needs); }} />;
    if (forcePasswordChange) return <ForcePasswordChange onComplete={() => setForcePasswordChange(false)} />;

    const renderTabContent = () => {
        try {
            switch (activeTab) {
                case 'orders': return <Orders />;
                case 'logistics': return <Logistics />;
                case 'messages': return <Messages />;
                case 'finance': return <Finance />;
                default: return <Orders />;
            }
        } catch (err) {
            return (
                <div className="p-12 text-center bg-dark-800 border-2 border-dashed border-red-500/30 rounded-3xl">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Ops! Algo deu errado nesta aba.</h2>
                    <p className="text-neutral-500">O erro foi isolado para proteger o restante do painel.</p>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-100/10 flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-50 shadow-2xl">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-100/10">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Package className="text-dark-900" size={20} />
                    </div>
                    <span className="font-black text-xl text-white tracking-tighter">ADMIN v3</span>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 flex md:flex-col gap-1.5 no-scrollbar">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all font-black text-sm w-full text-left uppercase tracking-widest ${activeTab === item.id
                                    ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'text-neutral-500 hover:bg-dark-700/50 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.badge && unreadMessages > 0 && (
                                <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg font-black">
                                    {unreadMessages}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-dark-100/10 bg-dark-900/50">
                    <button onClick={handleLogout} className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center gap-2 font-black uppercase text-xs tracking-tighter border border-red-500/20">
                        <LogOut size={16} /> Sair do Painel
                    </button>
                    <Link to="/" className="w-full mt-2 p-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-tighter border border-dark-600">
                        <LayoutDashboard size={16} /> Voltar para Loja
                    </Link>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
