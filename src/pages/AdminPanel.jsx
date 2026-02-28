import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, ClipboardList, Mail, Truck, TrendingUp, Calendar } from 'lucide-react';

// Componente de Login Simples integrado para evitar erros de importação
function SimpleLogin({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else onLogin(data.session);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            <form onSubmit={handleLogin} className="bg-dark-800 p-8 rounded-2xl border border-dark-700 w-full max-w-md shadow-2xl">
                <div className="flex justify-center mb-6"><Package size={48} className="text-primary" /></div>
                <h1 className="text-2xl font-bold text-white text-center mb-6">Restaurar Acesso</h1>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(email)} className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 mb-4 text-white outline-none focus:border-primary" required />
                <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(password)} className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 mb-6 text-white outline-none focus:border-primary" required />
                <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-bold p-3 rounded-xl transition-all">
                    {loading ? 'Entrando...' : 'Entrar no Painel'}
                </button>
            </form>
        </div>
    );
}

export default function AdminPanel() {
    console.log('Admin carregado com sucesso');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session && activeTab === 'orders') fetchOrders();
    }, [session, activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Erro ao buscar:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!session) return <SimpleLogin onLogin={setSession} />;

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row">
            {/* Sidebar Simples */}
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 flex flex-col sticky top-0 md:h-screen z-50">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-700">
                    <Package className="text-primary" />
                    <span className="font-bold text-xl text-white">ADMIN RESGATADO</span>
                </div>
                <nav className="flex-1 p-4 flex md:flex-col gap-2">
                    <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'orders' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700'}`}>
                        <ClipboardList size={18} /> Vendas
                    </button>
                    <button onClick={() => setActiveTab('logistics')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'logistics' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700'}`}>
                        <Truck size={18} /> Logística
                    </button>
                    <button onClick={() => setActiveTab('messages')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'messages' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700'}`}>
                        <Mail size={18} /> Suporte
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'finance' ? 'bg-primary text-dark-900' : 'text-neutral-500 hover:bg-dark-700'}`}>
                        <TrendingUp size={18} /> Financeiro
                    </button>
                </nav>
                <div className="p-4 border-t border-dark-700">
                    <button onClick={() => supabase.auth.signOut()} className="w-full p-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs uppercase hover:bg-red-500/20 transition-all">Sair</button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 p-4 md:p-10 overflow-y-auto">
                {activeTab === 'orders' ? (
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-bold text-white">Vendas Recentes</h1>
                            <button onClick={fetchOrders} className="p-2 bg-dark-800 rounded-lg text-neutral-400 hover:text-white border border-dark-700">Atualizar</button>
                        </div>

                        {loading ? (
                            <div className="p-20 text-center text-neutral-500">Carregando...</div>
                        ) : (
                            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-dark-900/50 border-b border-dark-700 text-xs text-neutral-500 uppercase">
                                        <tr>
                                            <th className="p-4">ID</th>
                                            <th className="p-4">Data</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-700">
                                        {orders.map(order => (
                                            <tr key={order.id} className="hover:bg-dark-700/30">
                                                <td className="p-4 text-sm text-neutral-500">#{order.id}</td>
                                                <td className="p-4 text-sm"><div className="flex items-center gap-2"><Calendar size={14} className="text-neutral-600" /> {new Date(order.created_at).toLocaleDateString('pt-BR')}</div></td>
                                                <td className="p-4 text-sm text-white truncate max-w-xs">{order.status}</td>
                                                <td className="p-4 text-right font-bold text-emerald-400">R$ {order.valor_total?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && <tr><td colSpan="4" className="p-10 text-center text-neutral-500">Nenhum pedido encontrado.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-dark-800 rounded-3xl border border-dark-700">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"><Package className="text-primary" /></div>
                        <h2 className="text-xl font-bold text-white mb-2">Aba "{activeTab}" em Manutenção</h2>
                        <p className="text-neutral-500">Estamos simplificando o código para restaurar a estabilidade total.</p>
                        <button onClick={() => setActiveTab('orders')} className="mt-6 text-primary font-bold hover:underline">Voltar para Vendas</button>
                    </div>
                )}
            </main>
        </div>
    );
}
