import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, Package, ClipboardList, LogOut } from 'lucide-react';

export default function AdminPanel() {
    console.log('[EMERGENCY] AdminPanel montado com sucesso.');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Auth Simples
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('[EMERGENCY] Auth Change:', _event);
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    // 2. Busca de Pedidos (Apenas se logado)
    useEffect(() => {
        if (session) {
            fetchOrders();
        }
    }, [session]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            console.log('[EMERGENCY] Buscando pedidos...');
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('[EMERGENCY] Erro ao buscar pedidos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
                <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 text-center">
                    <h1 className="text-xl font-bold text-white mb-4">Painel Restrito</h1>
                    <p className="text-neutral-400 mb-6 text-sm">Por favor, acesse via login.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-primary px-6 py-2 rounded-xl text-dark-900 font-bold"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 flex flex-col sticky top-0 md:h-screen z-50">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-700">
                    <Package className="text-primary" />
                    <span className="font-bold text-white uppercase tracking-widest text-sm">Hard Reset Mode</span>
                </div>
                <nav className="flex-1 p-4 flex md:flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'orders' ? 'bg-primary text-dark-900' : 'text-neutral-400 hover:bg-dark-700'}`}
                    >
                        <ClipboardList size={18} /> Vendas
                    </button>
                </nav>
                <div className="p-4 border-t border-dark-700">
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="w-full p-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs uppercase"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full mt-2 p-3 bg-dark-700 text-white rounded-xl font-bold text-xs uppercase"
                    >
                        Voltar Loja
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-6 md:p-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Lista de Vendas (Modo Seguro)</h1>
                        <button
                            onClick={fetchOrders}
                            className="text-xs bg-dark-800 border border-dark-700 px-4 py-2 rounded-lg text-neutral-400 hover:text-white"
                        >
                            Atualizar Agora
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-neutral-500 font-bold uppercase tracking-widest animate-pulse">Carregando dados...</div>
                    ) : (
                        <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-dark-900/50 border-b border-dark-700 text-[10px] font-black uppercase text-neutral-500 tracking-widest">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Status / Detalhes</th>
                                        <th className="p-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-dark-700/50 transition-colors">
                                            <td className="p-4 text-sm text-neutral-600 font-mono">#{order.id}</td>
                                            <td className="p-4 text-sm text-neutral-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-4 text-sm text-white truncate max-w-md">{order.status}</td>
                                            <td className="p-4 text-right font-bold text-emerald-400">R$ {order.valor_total?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center text-neutral-600">Nenhum pedido recente.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
