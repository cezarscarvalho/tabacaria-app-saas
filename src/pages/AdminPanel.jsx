import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Package, ClipboardList, LogOut, Truck, LayoutDashboard, Calculator, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
    console.log('[CRITICAL-DEBUG] Tentando renderizar AdminPanel...');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('vendas');

    // Estado Estático Único
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estados On-Demand (Apenas calculados sob clique)
    const [logisticsData, setLogisticsData] = useState(null);
    const [logisticsLoading, setLogisticsLoading] = useState(false);

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

    // 2. Busca de Pedidos: Roda apenas UMA VEZ no carregamento
    useEffect(() => {
        if (session) {
            console.log('[CRITICAL-DEBUG] Disparando busca inicial de pedidos (useEffect []).');
            fetchOrders();
        }
    }, [session]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Lógica de Logística "SOB DEMANDA"
    const handleLoadLogistics = async () => {
        setLogisticsLoading(true);
        console.log('[CRITICAL-DEBUG] Processando Logística por demanda (Manual Click).');
        try {
            const confirmedOrders = orders.filter(o => o.enviado_logistica === true);
            const itemMap = {};

            confirmedOrders.forEach(order => {
                const status = order.status || '';
                const parts = status.split(' - ');
                if (parts.length >= 2) {
                    const itemsArray = parts[1].split(', ');
                    itemsArray.forEach(rawItem => {
                        const match = rawItem.match(/(.+) \((\d+)[x| un]*\)/i) || rawItem.match(/^(\d+)[x| un]*\s+(.+)$/i);
                        if (match) {
                            const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                            const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]);
                            itemMap[name] = (itemMap[name] || 0) + (isNaN(qty) ? 1 : qty);
                        } else {
                            itemMap[rawItem.trim()] = (itemMap[rawItem.trim()] || 0) + 1;
                        }
                    });
                }
            });

            const consolidated = Object.entries(itemMap).map(([name, qty]) => ({ name, qty }));
            setLogisticsData(consolidated);
        } catch (err) {
            console.error('Erro Logistica:', err.message);
        } finally {
            setLogisticsLoading(false);
        }
    };

    const handleToggleCheck = async (id, currentVal) => {
        const newVal = !currentVal;
        // Update Local
        setOrders(prev => prev.map(o => o.id === id ? { ...o, enviado_logistica: newVal } : o));
        // Update DB
        await supabase.from('pedidos').update({ enviado_logistica: newVal }).eq('id', id);
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-white text-center">
                    <p className="animate-pulse">Aguardando Autenticação...</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-xs text-neutral-500">Recarregar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row font-sans">
            {/* Sidebar Minimalista */}
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 p-6 flex flex-col gap-6 h-screen sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Package className="text-primary" size={24} />
                    </div>
                    <span className="font-black text-white text-xl tracking-tighter">ADMIN</span>
                </div>

                <nav className="flex flex-col gap-2 flex-grow">
                    <button onClick={() => setActiveTab('vendas')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'vendas' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700'}`}>
                        <ClipboardList size={20} /> Vendas
                    </button>
                    <button onClick={() => setActiveTab('logistica')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'logistica' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700'}`}>
                        <Truck size={20} /> Logística
                    </button>
                </nav>

                <div className="pt-6 border-t border-dark-700 flex flex-col gap-2">
                    <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all">
                        <LogOut size={20} /> Sair
                    </button>
                    <button onClick={() => window.location.href = '/'} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-neutral-400 hover:bg-dark-700 transition-all">
                        <LayoutDashboard size={20} /> Loja
                    </button>
                </div>
            </aside>

            {/* Conteúdo On-Demand */}
            <main className="flex-1 p-6 md:p-10">
                {activeTab === 'vendas' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Histórico de Vendas</h1>
                            <button onClick={fetchOrders} className="p-3 bg-dark-800 border border-dark-700 rounded-xl text-neutral-400 hover:text-white transition-all">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-dark-900/50 border-b border-dark-700 text-[11px] font-black uppercase text-neutral-500 tracking-widest">
                                    <tr>
                                        <th className="p-5">ID</th>
                                        <th className="p-5">Resumo do Pedido</th>
                                        <th className="p-5">Logística</th>
                                        <th className="p-5 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {orders.map(o => (
                                        <tr key={o.id} className="hover:bg-dark-700/30 transition-colors">
                                            <td className="p-5 text-sm font-mono text-neutral-600">#{o.id}</td>
                                            <td className="p-5 text-sm text-white max-w-md truncate">{o.status}</td>
                                            <td className="p-5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={o.enviado_logistica || false}
                                                    onChange={() => handleToggleCheck(o.id, o.enviado_logistica)}
                                                    className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-5 text-right font-black text-emerald-400">R$ {o.valor_total?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'logistica' && (
                    <div className="animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Consolidação de Logística</h1>

                        {!logisticsData && !logisticsLoading && (
                            <div className="bg-dark-800 border-2 border-dashed border-dark-700 rounded-3xl p-20 text-center">
                                <Calculator className="text-neutral-700 mx-auto mb-6" size={64} />
                                <p className="text-neutral-500 font-bold text-xl mb-8">O cálculo automático foi desativado para segurança.</p>
                                <button
                                    onClick={handleLoadLogistics}
                                    className="bg-primary text-dark-900 px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    Carregar Dados Agora
                                </button>
                            </div>
                        )}

                        {logisticsLoading && (
                            <div className="py-20 text-center text-primary font-black uppercase animate-pulse">
                                Processando números de forma segura...
                            </div>
                        )}

                        {logisticsData && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-2xl">
                                    <table className="w-full text-left">
                                        <thead className="bg-dark-900/50 border-b border-dark-700 text-[11px] font-black uppercase text-neutral-500 p-5">
                                            <tr>
                                                <th className="p-5">Produto</th>
                                                <th className="p-5 text-center">Quantidade Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {logisticsData.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-5 font-bold text-white">{item.name}</td>
                                                    <td className="p-5 text-center">
                                                        <span className="bg-primary/10 text-primary font-black px-4 py-2 rounded-xl border border-primary/20">
                                                            {item.qty} un
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-dark-800 p-10 rounded-3xl border border-dark-700 flex flex-col justify-center items-center text-center">
                                    <Truck size={80} className="text-primary/20 mb-6" />
                                    <p className="text-neutral-400 mb-8 max-w-xs uppercase font-bold text-sm leading-relaxed">
                                        Clique abaixo para resetar os cálculos ou forçar nova leitura.
                                    </p>
                                    <button onClick={handleLoadLogistics} className="w-full bg-dark-700 text-white font-black py-4 rounded-2xl hover:bg-dark-600 transition-all uppercase tracking-widest">
                                        Recalcular Tudo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
