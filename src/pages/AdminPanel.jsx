import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package, ClipboardList, LogOut, Truck, LayoutDashboard,
    MessageCircle, TrendingUp, RefreshCw, Users, Settings as SettingsIcon,
    Bell, Clock, Search, Zap, PackageOpen, Calculator, AlertCircle,
    Send, Store, CheckCircle2, X, Plus, Pencil, Trash2, ChevronDown
} from 'lucide-react';

/**
 * ADMIN PANEL - VERSÃO COMPLETA (ESTÁVEL)
 * Arquitetura de Carregamento Único com Gestão de Fornecedores e Integração Logística.
 */
export default function AdminPanel() {
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('vendas');
    const [loading, setLoading] = useState(false);
    const [lastSync, setLastSync] = useState('--:--:--');

    // Estados de Dados
    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [settings, setSettings] = useState(null);

    // Filtros e Seleções (Logística)
    const [logSearch, setLogSearch] = useState('');
    const [selectedLogIds, setSelectedLogIds] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    // Estados de Modais (Fornecedores)
    const [showSupModal, setShowSupModal] = useState(false);
    const [editingSup, setEditingSup] = useState(null);
    const [supForm, setSupForm] = useState({ nome: '', whatsapp: '', marcas: '' });

    // 1. SEGURANÇA: useEffect com [] para evitar Loops
    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) setSession(s);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
            if (mounted) setSession(s);
        });
        return () => { mounted = false; subscription.unsubscribe(); };
    }, []);

    useEffect(() => {
        if (session) fetchAllData();
    }, [session]);

    const fetchAllData = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const [ords, msgs, clis, sups, cfgs] = await Promise.all([
                supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
                supabase.from('mensagens').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('*').order('nome', { ascending: true }),
                supabase.from('fornecedores').select('*').order('nome', { ascending: true }),
                supabase.from('configuracoes').select('*').limit(1).single()
            ]);
            setOrders(ords.data || []);
            setMessages(msgs.data || []);
            setClients(clis.data || []);
            setSuppliers(sups.data || []);
            setSettings(cfgs.data || null);
            setLastSync(new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Erro na sincronização:', err);
        }
        setLoading(false);
    };

    // --- LÓGICA DE LOGÍSTICA (O CORAÇÃO) ---
    const logisticsData = useMemo(() => {
        try {
            const itemMap = {};
            let totalVolume = 0;
            const confirmed = orders.filter(o => o.enviado_logistica === true);

            confirmed.forEach(order => {
                const parts = (order.status || '').split(' - ');
                if (parts.length >= 2) {
                    const itemsText = parts[1];
                    itemsText.split(', ').forEach(raw => {
                        const match = raw.match(/(.+) \((\d+)[x| un]*\)/i) || raw.match(/^(\d+)[x| un]*\s+(.+)$/i);
                        if (match) {
                            const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                            const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]) || 1;
                            itemMap[name] = (itemMap[name] || 0) + qty;
                            totalVolume += qty;
                        } else if (raw.trim()) {
                            itemMap[raw.trim()] = (itemMap[raw.trim()] || 0) + 1;
                            totalVolume += 1;
                        }
                    });
                }
            });

            const list = Object.entries(itemMap)
                .map(([name, qty], idx) => ({ id: `log-${idx}`, name, qty }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return { list, totalVolume };
        } catch (e) {
            return { list: [], totalVolume: 0 };
        }
    }, [orders]);

    const filteredLogistics = logisticsData.list.filter(item =>
        item.name.toLowerCase().includes(logSearch.toLowerCase())
    );

    // Contagem Dinâmica para UI Premium
    const selectedVolume = useMemo(() => {
        return logisticsData.list
            .filter(i => selectedLogIds.includes(i.id))
            .reduce((acc, curr) => acc + curr.qty, 0);
    }, [logisticsData.list, selectedLogIds]);

    const handleSendLogistics = () => {
        const selected = logisticsData.list.filter(i => selectedLogIds.includes(i.id));
        if (selected.length === 0) return alert('Selecione itens primeiro!');

        const targetSup = suppliers.find(s => s.id === selectedSupplierId);
        const phone = targetSup ? targetSup.whatsapp.replace(/\D/g, '') : '';
        const supName = targetSup ? targetSup.nome : 'Fornecedor';

        let text = `*PEDIDO DE COMPRA - ${supName.toUpperCase()}* 🚚%0A*Data:* ${new Date().toLocaleDateString()}%0A%0A`;
        selected.forEach(i => text += `• ${i.name}: *${i.qty} un*%0A`);
        text += `%0A*Volume Total Selecionado: ${selected.reduce((a, b) => a + b.qty, 0)} unidades*`;

        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    // --- MENSAGENS: RESPOSTA RÁPIDA ---
    const replyMessage = (msg) => {
        const text = `Olá! Respondendo sua dúvida: "${msg.conteudo}"%0A%0A`;
        window.open(`https://wa.me/${msg.whatsapp?.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    // --- GESTÃO DE FORNECEDORES (CRUD) ---
    const handleSaveSupplier = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingSup) {
                await supabase.from('fornecedores').update(supForm).eq('id', editingSup.id);
            } else {
                await supabase.from('fornecedores').insert([supForm]);
            }
            setShowSupModal(false);
            setEditingSup(null);
            setSupForm({ nome: '', whatsapp: '', marcas: '' });
            fetchAllData();
        } catch (err) { alert('Erro ao salvar fornecedor.'); }
        setLoading(false);
    };

    const handleDeleteSupplier = async (id) => {
        if (!confirm('Excluir este fornecedor?')) return;
        setLoading(true);
        try {
            await supabase.from('fornecedores').delete().eq('id', id);
            fetchAllData();
        } catch (err) { alert('Erro ao excluir.'); }
        setLoading(false);
    };

    // 2. Mapeamento de Menu (Abas Ativas)
    const tabs = [
        { id: 'vendas', label: 'Vendas', icon: <ClipboardList size={18} /> },
        { id: 'logistica', label: 'Logística', icon: <Truck size={18} /> },
        { id: 'mensagens', label: 'Suporte', icon: <MessageCircle size={18} />, badge: messages.filter(m => !m.lida).length },
        { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
        { id: 'fornecedores', label: 'Fornecedores', icon: <Store size={18} /> },
        { id: 'configuracoes', label: 'Configurações', icon: <SettingsIcon size={18} /> }
    ];

    if (!session) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="text-center animate-pulse">
                <Package className="text-primary mx-auto mb-4" size={50} />
                <p className="text-primary uppercase font-black tracking-widest text-xs">Sincronizando Admin...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            {/* Sidebar Shell */}
            <aside className="w-full md:w-72 bg-dark-800 border-r border-dark-700 flex flex-col h-full z-50 shadow-2xl">
                <div className="h-24 px-8 flex items-center gap-4 bg-dark-900/40 border-b border-dark-700">
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20"><Package className="text-primary" size={24} /></div>
                    <h2 className="font-black text-white text-2xl tracking-tighter uppercase leading-none">HUB<span className="text-primary">ADMIN</span></h2>
                </div>

                <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto no-scrollbar">
                    {tabs.map(tab => (
                        <TabBtn
                            key={tab.id}
                            active={activeTab === tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            onClick={() => setActiveTab(tab.id)}
                            badge={tab.badge}
                        />
                    ))}
                    <div className="h-px bg-dark-700 my-4 mx-2 opacity-50"></div>
                </nav>

                <div className="p-6 bg-dark-900/20 border-t border-dark-700">
                    <button onClick={() => supabase.auth.signOut()} className="w-full p-4 bg-dark-700 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-dark-600">Sair da Conta</button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-10 shrink-0 shadow-lg">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">{tabs.find(t => t.id === activeTab)?.label} <span className="text-neutral-600 font-normal">/ Admin Panel</span></h2>
                        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-1.5 flex items-center gap-2 tracking-[0.2em]"><Clock size={10} /> Sincronizado: {lastSync}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchAllData} disabled={loading} className="px-6 py-3.5 bg-primary text-dark-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-primary/20">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Carregando' : 'Sincronizar'}
                        </button>
                        <button onClick={() => window.location.href = '/'} className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 transition-all shadow-lg"><LayoutDashboard size={20} /></button>
                    </div>
                </header>

                <div className="flex-1 p-10 overflow-y-auto bg-[#0a0a0a] custom-scrollbar animate-in fade-in duration-500">
                    <div className="max-w-7xl mx-auto pb-10">

                        {/* ABA VENDAS */}
                        {activeTab === 'vendas' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-700">
                                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3"><ClipboardList className="text-primary" /> Itens Vendidos</h1>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <table className="w-full text-left">
                                        <thead className="bg-dark-900 border-b-2 border-dark-700 text-neutral-500 font-black uppercase text-[10px]">
                                            <tr><th className="p-8">Cliente</th><th className="p-8">Pedido / Detalhes</th><th className="p-8 text-center text-primary">Logística?</th><th className="p-8 text-right">Valor</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {orders.map(o => (
                                                <tr key={o.id} className="hover:bg-dark-700/30 transition-all font-bold group">
                                                    <td className="p-8 text-white uppercase italic">{o.nome_cliente || 'Final/Consumidor'}</td>
                                                    <td className="p-8 text-neutral-500 text-xs max-w-sm truncate italic">{o.status}</td>
                                                    <td className="p-8 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={o.enviado_logistica || false}
                                                            onChange={async (e) => {
                                                                await supabase.from('pedidos').update({ enviado_logistica: e.target.checked }).eq('id', o.id);
                                                                fetchAllData();
                                                            }}
                                                            className="w-6 h-6 rounded-lg accent-primary cursor-pointer transition-transform hover:scale-110"
                                                        />
                                                    </td>
                                                    <td className="p-8 text-right text-primary font-black italic">R$ {o.total?.toLocaleString('pt-BR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ABA LOGÍSTICA (O CORAÇÃO) */}
                        {activeTab === 'logistica' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3"><Truck className="text-primary" /> Centro de Triagem</h1>
                                    <div className="relative w-full lg:w-80 shadow-2xl">
                                        <input
                                            type="text" placeholder="Filtrar Marca/Produto..." value={logSearch}
                                            onChange={e => setLogSearch(e.target.value)}
                                            className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-primary outline-none font-bold"
                                        />
                                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    </div>
                                </div>

                                {/* CONTADORES DINÂMICOS PREMIUM */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    <div className="bg-gradient-to-r from-primary to-emerald-400 p-8 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden group">
                                        <Calculator size={100} className="absolute -right-4 -bottom-4 text-dark-900/10 group-hover:scale-110 transition-transform" />
                                        <span className="text-dark-900/50 font-black uppercase text-[10px] tracking-widest block mb-1">Carga Geral</span>
                                        <h2 className="text-4xl font-black text-dark-900 italic tracking-tighter">{logisticsData.totalVolume} <span className="text-[14px]">pacotes</span></h2>
                                    </div>
                                    <div className="bg-dark-800 border-2 border-primary/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                                        <Zap size={100} className="absolute -right-4 -bottom-4 text-primary/5 group-hover:scale-110 transition-transform" />
                                        <span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-1">Selecionado para Envio</span>
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter">{selectedVolume} <span className="text-primary text-[14px]">un</span></h2>
                                    </div>
                                    <div className="bg-dark-800 border-2 border-dark-700 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                                        <PackageOpen size={100} className="absolute -right-4 -bottom-4 text-neutral-800/20 group-hover:scale-110 transition-transform" />
                                        <span className="text-neutral-500 font-black uppercase text-[10px] tracking-widest block mb-1">Restante em Espera</span>
                                        <h2 className="text-4xl font-black text-neutral-400 italic tracking-tighter">{logisticsData.totalVolume - selectedVolume} <span className="text-[14px]">un</span></h2>
                                    </div>
                                </div>

                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    {/* BARRA DE AÇÕES LOGÍSTICA */}
                                    <div className="p-6 bg-dark-900 border-b border-dark-700 flex flex-wrap justify-between items-center gap-6">
                                        <div className="flex gap-2">
                                            <button onClick={() => setSelectedLogIds(filteredLogistics.map(i => i.id))} className="px-5 py-3 bg-dark-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dark-600 transition-all">Sim, Todos</button>
                                            <button onClick={() => setSelectedLogIds([])} className="px-5 py-3 bg-dark-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dark-600 transition-all">Limpar</button>
                                        </div>

                                        <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
                                            <div className="relative w-full md:w-64">
                                                <select
                                                    value={selectedSupplierId}
                                                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                                                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                                                >
                                                    <option value="">Selecione Fornecedor</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.nome}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                            </div>
                                            <button
                                                onClick={handleSendLogistics}
                                                disabled={!selectedSupplierId || selectedLogIds.length === 0}
                                                className={`flex-1 md:flex-none bg-primary hover:scale-105 active:scale-95 text-dark-900 font-black py-4 px-10 rounded-2xl uppercase tracking-[0.2em] shadow-xl text-xs italic transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-3`}
                                            >
                                                {selectedLogIds.length > 0
                                                    ? `Enviar ${selectedLogIds.length} itens selecionados`
                                                    : <><Zap size={14} className="fill-current" /> Selecione Itens Primeiro</>}
                                            </button>
                                        </div>
                                    </div>

                                    <table className="w-full text-left">
                                        <thead className="bg-dark-900 text-neutral-500 font-black uppercase text-[10px] tracking-widest">
                                            <tr><th className="p-8 w-24 text-center">Sel</th><th className="p-8">Especificação do Produto</th><th className="p-8 text-right">Quantidade</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {filteredLogistics.map(item => {
                                                const isSel = selectedLogIds.includes(item.id);
                                                return (
                                                    <tr key={item.id} onClick={() => setSelectedLogIds(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])} className={`hover:bg-dark-700/50 cursor-pointer group transition-all even:bg-dark-900/30 ${isSel ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}>
                                                        <td className="p-8 text-center">
                                                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center mx-auto transition-all ${isSel ? 'bg-primary border-primary rotate-12' : 'border-dark-600 group-hover:border-primary/30'}`}>
                                                                {isSel && <Zap size={16} className="text-dark-900 fill-current" />}
                                                            </div>
                                                        </td>
                                                        <td className="p-8 font-black text-white italic text-xl uppercase tracking-tighter group-hover:text-primary transition-colors">{item.name}</td>
                                                        <td className="p-8 text-right">
                                                            <span className={`inline-block font-black px-5 py-2 rounded-xl border-2 transition-all text-xs tracking-widest uppercase ${isSel ? 'bg-primary text-dark-900 border-primary shadow-lg shadow-primary/20' : 'bg-dark-900/50 text-neutral-500 border-dark-700'}`}>{item.qty} un</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ABA MENSAGENS */}
                        {activeTab === 'mensagens' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-700">
                                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3"><MessageCircle className="text-primary" /> Suporte ao Cliente</h1>
                                <div className="grid grid-cols-1 gap-6">
                                    {messages.map(m => (
                                        <div key={m.id} className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[2rem] hover:border-primary/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-primary font-black uppercase text-[10px] tracking-[0.2em]">{m.nome}</span>
                                                    <span className="text-neutral-600 text-[10px] uppercase font-bold">• {new Date(m.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-white font-bold italic text-lg leading-tight uppercase tracking-tight">"{m.conteudo}"</p>
                                            </div>
                                            <button onClick={() => replyMessage(m)} className="bg-primary/10 hover:bg-primary text-primary hover:text-dark-900 border border-primary/20 p-5 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                <Send size={18} /> Responder WA
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ABA CLIENTES */}
                        {activeTab === 'clientes' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-700">
                                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3"><Users className="text-primary" /> Prospecção de Lojas</h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {clients.map(c => (
                                        <div key={c.id} className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[2.5rem] hover:border-primary/30 transition-all group shadow-2xl overflow-hidden relative">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="bg-dark-900 p-3 rounded-2xl border border-dark-700 group-hover:bg-primary/10 transition-colors"><Store className="text-primary" size={24} /></div>
                                                <div className="flex gap-1">
                                                    <div className="w-1.5 h-6 bg-primary/20 rounded-full"></div>
                                                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 italic truncate">{c.nome}</h3>
                                            <p className="text-neutral-500 font-bold text-xs mb-8 uppercase tracking-widest">{c.whatsapp}</p>
                                            <button
                                                onClick={() => {
                                                    const text = `Olá *${c.nome}*!%0AClique abaixo para conferir nosso catálogo atualizado:%0A%0A${settings?.link_catalogo || window.location.origin}`;
                                                    window.open(`https://wa.me/${c.whatsapp?.replace(/\D/g, '')}?text=${text}`, '_blank');
                                                }}
                                                className="w-full bg-dark-900 hover:bg-primary text-neutral-400 hover:text-dark-900 font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.3em] transition-all border border-dark-700"
                                            >
                                                Enviar Catálogo
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ABA FORNECEDORES (NOVA) */}
                        {activeTab === 'fornecedores' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-700">
                                <div className="flex justify-between items-center mb-10">
                                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3"><Store className="text-primary" /> Parceiros & Fornecedores</h1>
                                    <button
                                        onClick={() => { setEditingSup(null); setSupForm({ nome: '', whatsapp: '', marcas: '' }); setShowSupModal(true); }}
                                        className="bg-primary text-dark-900 font-black px-8 py-4 rounded-2xl flex items-center gap-3 uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                                    >
                                        <Plus size={18} /> Novo Fornecedor
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {suppliers.map(s => (
                                        <div key={s.id} className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[3rem] hover:border-primary/20 transition-all group shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => { setEditingSup(s); setSupForm(s); setShowSupModal(true); }} className="p-3 bg-dark-700 hover:bg-primary hover:text-dark-900 rounded-xl transition-all border border-dark-600"><Pencil size={14} /></button>
                                                <button onClick={() => handleDeleteSupplier(s.id)} className="p-3 bg-dark-700 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-dark-600"><Trash2 size={14} /></button>
                                            </div>

                                            <div className="bg-dark-900 w-16 h-16 rounded-[1.5rem] border border-dark-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Truck className="text-primary" size={28} />
                                            </div>

                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 italic truncate">{s.nome}</h3>
                                            <p className="text-neutral-500 font-bold text-[10px] mb-6 uppercase tracking-[0.2em]">{s.whatsapp}</p>

                                            <div className="flex flex-wrap gap-2 pt-6 border-t border-dark-700/50">
                                                {s.marcas?.split(',').map((m, idx) => (
                                                    <span key={idx} className="bg-dark-900 text-neutral-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-dark-700 italic">{m.trim()}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* MODAL FORNECEDOR */}
                                {showSupModal && (
                                    <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
                                        <div className="bg-dark-800 border-2 border-dark-700 w-full max-w-xl rounded-[3rem] p-12 shadow-3xl shadow-primary/5 animate-in zoom-in-95 duration-300">
                                            <div className="flex justify-between items-center mb-10">
                                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{editingSup ? 'Editar' : 'Novo'} Fornecedor</h2>
                                                <button onClick={() => setShowSupModal(false)} className="p-4 bg-dark-700 rounded-2xl text-neutral-500 hover:text-white transition-all"><X size={20} /></button>
                                            </div>
                                            <form onSubmit={handleSaveSupplier} className="space-y-6">
                                                <div>
                                                    <label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block">Nome da Empresa</label>
                                                    <input required type="text" value={supForm.nome} onChange={e => setSupForm({ ...supForm, nome: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all font-bold" placeholder="Ex: Zomo Logistics" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block">WhatsApp</label>
                                                        <input required type="text" value={supForm.whatsapp} onChange={e => setSupForm({ ...supForm, whatsapp: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all font-bold" placeholder="55..." />
                                                    </div>
                                                    <div>
                                                        <label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block">Marcas (separado por vírgula)</label>
                                                        <input type="text" value={supForm.marcas} onChange={e => setSupForm({ ...supForm, marcas: e.target.value })} className="w-full bg-dark-900 border-2 border-700 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all font-bold" placeholder="Zomo, Nay, Ziggy..." />
                                                    </div>
                                                </div>
                                                <button type="submit" className="w-full bg-primary text-dark-900 font-black py-6 rounded-3xl uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs italic mt-8">Salvar Dados do Fornecedor</button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ABA CONFIGURAÇÕES */}
                        {activeTab === 'configuracoes' && (
                            <div className="p-20 text-center border-4 border-dashed border-dark-700 rounded-[4rem] animate-pulse">
                                <SettingsIcon size={80} className="mx-auto text-neutral-800 mb-6" />
                                <h1 className="text-4xl font-black text-neutral-700 uppercase italic">Ajustes Premium</h1>
                                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-4">Área de parametrização da loja sob demanda.</p>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}

// BOTAO DE NAVEGAÇÃO REUTILIZÁVEL
function TabBtn({ active, icon, label, onClick, badge }) {
    return (
        <button onClick={onClick} className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${active ? 'bg-primary text-dark-900 shadow-xl shadow-primary/30 scale-[1.05]' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}>
            <div className="flex items-center gap-4">{icon} {label}</div>
            {badge > 0 && <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black shadow-lg">{badge}</span>}
        </button>
    );
}
