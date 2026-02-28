import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package, ClipboardList, LogOut, Truck, LayoutDashboard,
    MessageCircle, TrendingUp, RefreshCw, Users, Settings as SettingsIcon,
    Bell, Clock, Search, Zap, PackageOpen, Calculator, AlertCircle
} from 'lucide-react';

// Sub-componentes Admin - Importação Externa (Para as abas estáveis)
import Orders from '../components/admin/Orders';
import Messages from '../components/admin/Messages';
import Finance from '../components/admin/Finance';
import Clients from '../components/admin/Clients';
import Settings from '../components/admin/Settings';

/**
 * COMPONENTE LOGÍSTICA INJETADO DIRETAMENTE
 * Objetivo: Evitar erros de cache e garantir integridade de escrita.
 */
function InternalLogistics({ ordersData, refreshFunc }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // 1. Consolidação com Proteção Total
    const consolidation = useMemo(() => {
        try {
            const itemMap = {};
            let globalTotal = 0;
            const confirmedOrders = (ordersData || []).filter(o => o.enviado_logistica === true);

            confirmedOrders.forEach(order => {
                const parts = (order.status || '').split(' - ');
                if (parts.length >= 2) {
                    parts[1].split(', ').forEach(raw => {
                        const match = raw.match(/(.+) \((\d+)[x| un]*\)/i) || raw.match(/^(\d+)[x| un]*\s+(.+)$/i);
                        if (match) {
                            const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                            const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]) || 1;
                            itemMap[name] = (itemMap[name] || 0) + qty;
                            globalTotal += qty;
                        } else if (raw.trim()) {
                            itemMap[raw.trim()] = (itemMap[raw.trim()] || 0) + 1;
                            globalTotal += 1;
                        }
                    });
                }
            });

            const list = Object.entries(itemMap)
                .map(([name, qty], idx) => ({ id: `inj-${idx}-${name}`, name, qty }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return { list, globalTotal, error: false };
        } catch (err) {
            console.error('[INJECTED-LOGISTICS-ERROR]', err);
            return { list: [], globalTotal: 0, error: true };
        }
    }, [ordersData]);

    const { list: consolidatedList, globalTotal, error: hasError } = consolidation;
    const filteredList = consolidatedList.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleItem = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const sendOrder = () => {
        const selected = filteredList.filter(i => selectedIds.includes(i.id));
        if (selected.length === 0) return alert('Selecione itens primeiro!');
        let text = `*PEDIDO LOGÍSTICA* 🚚%0A*Data:* ${new Date().toLocaleDateString()}%0A%0A`;
        selected.forEach(i => text += `• ${i.name}: *${i.qty} un*%0A`);
        text += `%0A*Total Selecionado: ${selected.reduce((a, b) => a + b.qty, 0)} unidades*`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <Truck className="text-primary" /> Centro de Triagem Premium
                </h1>
                <div className="relative w-full lg:w-80">
                    <input
                        type="text" placeholder="Filtrar Marca/Produto..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-primary outline-none font-bold shadow-xl"
                    />
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                </div>
            </div>

            <div className={`p-10 rounded-[2.5rem] border-2 mb-10 transition-all ${hasError ? 'bg-red-500/10 border-red-500/40' : 'bg-gradient-to-br from-primary to-emerald-400 border-primary/20 shadow-2xl shadow-primary/10'}`}>
                {hasError ? (
                    <div className="flex items-center gap-4 text-red-500"><AlertCircle size={40} /><h2 className="text-2xl font-black uppercase italic">Erro ao calcular volume</h2></div>
                ) : (
                    <div className="relative z-10">
                        <span className="text-dark-900/50 font-black uppercase text-[10px] tracking-widest block mb-1">Carga Consolidada do Dia</span>
                        <h2 className="text-5xl font-black text-dark-900 uppercase italic tracking-tighter">Volume Total: <span className="text-white underline decoration-dark-900/10">{globalTotal}</span> pacotes</h2>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-dark-900/50 p-6 rounded-3xl border border-dark-700 flex justify-between items-center">
                    <div className="flex gap-3">
                        <button onClick={() => setSelectedIds(filteredList.map(i => i.id))} className="px-4 py-3 bg-dark-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-dark-600 hover:bg-dark-700 transition-all">Todos</button>
                        <button onClick={() => setSelectedIds([])} className="px-4 py-3 bg-dark-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-dark-600 hover:bg-dark-700 transition-all">Limpar</button>
                    </div>
                    <button onClick={sendOrder} className="bg-primary text-dark-900 font-black py-4 px-10 rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all text-xs italic">Gerar Pedido WhatsApp</button>
                </div>

                <div className="bg-dark-800 rounded-[2.5rem] border-2 border-dark-700 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-dark-900 border-b-2 border-dark-700 text-neutral-500 font-black text-[10px] uppercase tracking-widest">
                            <tr><th className="p-8 w-20 text-center">Sel</th><th className="p-8">Produto</th><th className="p-8 text-right">Qtd Total</th></tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {filteredList.map(item => {
                                const isSelected = selectedIds.includes(item.id);
                                return (
                                    <tr key={item.id} onClick={() => toggleItem(item.id)} className={`hover:bg-dark-700/50 cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : ''}`}>
                                        <td className="p-8 text-center"><div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center mx-auto transition-all ${isSelected ? 'bg-primary border-primary rotate-12' : 'border-dark-600'}`}>{isSelected && <Zap size={16} className="text-dark-900 fill-current" />}</div></td>
                                        <td className="p-8 font-black text-white italic text-xl uppercase tracking-tighter group-hover:text-primary">{item.name}</td>
                                        <td className="p-8 text-right"><span className={`inline-block font-black px-6 py-2 rounded-xl border-2 ${isSelected ? 'bg-primary text-dark-900 border-primary' : 'bg-dark-900 text-neutral-500 border-dark-700'}`}>{item.qty} un</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// COMPONENTE PRINCIPAL ADMINPANEL
export default function AdminPanel() {
    console.log('[DEBUG-INJECTION] Renderizando Admin Core com Logística Integrada.');

    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('vendas');
    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastSync, setLastSync] = useState('--:--:--');

    // Auth & Data Flow
    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session: s } }) => { if (mounted) setSession(s); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { if (mounted) setSession(s); });
        return () => { mounted = false; subscription.unsubscribe(); };
    }, []);

    useEffect(() => { if (session) fetchAll(); }, [session]);

    const fetchAll = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const [ords, msgs, clis, cfgs] = await Promise.all([
                supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
                supabase.from('mensagens').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('*').order('nome', { ascending: true }),
                supabase.from('configuracoes').select('*').limit(1).single()
            ]);
            setOrders(ords.data || []);
            setMessages(msgs.data || []);
            setClients(clis.data || []);
            setSettings(cfgs.data || null);
            setLastSync(new Date().toLocaleTimeString());
        } catch (e) { console.error('Error syncing:', e); }
        setLoading(false);
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-8">
                <div className="bg-dark-800 p-12 rounded-[3.5rem] border border-dark-700 text-center animate-in zoom-in duration-500">
                    <Package className="text-primary mx-auto mb-6 animate-pulse" size={60} />
                    <h3 className="text-white font-black text-2xl uppercase italic italic">Acesso Restrito</h3>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[9px] mt-2">Sincronizando Credenciais...</p>
                </div>
            </div>
        );
    }

    const renderTab = () => {
        const commProps = { refreshFunc: fetchAll };
        switch (activeTab) {
            case 'vendas': return <Orders ordersData={orders} {...commProps} />;
            case 'mensagens': return <Messages messagesData={messages} {...commProps} />;
            case 'logistica': return <InternalLogistics ordersData={orders} {...commProps} />;
            case 'financeiro': return <Finance ordersData={orders} {...commProps} />;
            case 'clientes': return <Clients clientsData={clients} {...commProps} />;
            case 'configuracoes': return <Settings session={session} settingsData={settings} {...commProps} />;
            default: return <Orders ordersData={orders} {...commProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            <aside className="w-full md:w-72 bg-dark-800 border-r border-dark-700 flex flex-col h-full z-50">
                <div className="h-24 px-8 flex items-center gap-4 bg-dark-900/40 border-b border-dark-700">
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20"><Package className="text-primary" size={24} /></div>
                    <h2 className="font-black text-white text-2xl tracking-tighter uppercase leading-none">HUB<span className="text-primary">ADMIN</span></h2>
                </div>

                <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                    <TabBtn active={activeTab === 'vendas'} icon={<ClipboardList size={18} />} label="Vendas" onClick={() => setActiveTab('vendas')} />
                    <TabBtn active={activeTab === 'mensagens'} icon={<MessageCircle size={18} />} label="Suporte" onClick={() => setActiveTab('mensagens')} badge={messages.filter(m => !m.lida).length} />
                    <TabBtn active={activeTab === 'logistica'} icon={<Truck size={18} />} label="Logística" onClick={() => setActiveTab('logistica')} />
                    <TabBtn active={activeTab === 'clientes'} icon={<Users size={18} />} label="Clientes" onClick={() => setActiveTab('clientes')} />
                    <TabBtn active={activeTab === 'financeiro'} icon={<TrendingUp size={18} />} label="Financeiro" onClick={() => setActiveTab('financeiro')} />
                    <div className="h-px bg-dark-700 my-4 mx-2"></div>
                    <TabBtn active={activeTab === 'configuracoes'} icon={<SettingsIcon size={18} />} label="Configurações" onClick={() => setActiveTab('configuracoes')} />
                </nav>

                <div className="p-6 bg-dark-900/20 border-t border-dark-700">
                    <button onClick={() => supabase.auth.signOut()} className="w-full p-4 bg-dark-700 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-dark-600">Sair da Conta</button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-10 shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">{activeTab} <span className="text-neutral-600 font-normal">/ Admin Panel</span></h2>
                        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-1.5 flex items-center gap-2"><Clock size={10} /> Sync: {lastSync}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchAll} disabled={loading} className="px-6 py-3.5 bg-primary text-dark-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-primary/20">{loading ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />} {loading ? 'Sincronizando' : 'Sync Dados'}</button>
                        <button onClick={() => window.location.href = '/'} className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 transition-all"><LayoutDashboard size={20} /></button>
                    </div>
                </header>

                <div className="flex-1 p-10 overflow-y-auto bg-[#0a0a0a] custom-scrollbar animate-in fade-in duration-1000">
                    <div className="max-w-7xl mx-auto pb-10">{renderTab()}</div>
                </div>
            </main>
        </div>
    );
}

// BOTAO DE NAVEGAÇÃO REUTILIZÁVEL
function TabBtn({ active, icon, label, onClick, badge }) {
    return (
        <button onClick={onClick} className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${active ? 'bg-primary text-dark-900 shadow-xl shadow-primary/20 scale-[1.03]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}>
            <div className="flex items-center gap-4">{icon} {label}</div>
            {badge > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black">{badge}</span>}
        </button>
    );
}
