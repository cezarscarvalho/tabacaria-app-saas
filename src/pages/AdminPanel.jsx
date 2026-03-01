import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package, ClipboardList, LogOut, Truck, LayoutDashboard,
    MessageCircle, TrendingUp, RefreshCw, Users, Settings as SettingsIcon,
    Bell, Clock, Search, Zap, PackageOpen, Calculator, AlertCircle,
    Send, Store, CheckCircle2, X, Plus, Pencil, Trash2, ChevronDown
} from 'lucide-react';

/**
 * ADMIN PANEL - MASTER GOLD VERSION (FINAL)
 * 6 Abas, Logística Premium, Edição Unificada e Configurações de Sistema.
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
    const [settings, setSettings] = useState({
        id: null,
        email_admin: '',
        senha_admin: '',
        whatsapp_suporte: '',
        link_catalogo: ''
    });

    // Filtros e Seleções (Logística)
    const [logSearch, setLogSearch] = useState('');
    const [selectedLogIds, setSelectedLogIds] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    // Estados de Modais e Edição Unificada (Clientes/Fornecedores)
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({ nome: '', whatsapp: '', marcas: '', endereco: '' });

    // 1. SEGURANÇA E CARREGAMENTO (useEffect estável)
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
            if (cfgs.data) setSettings(cfgs.data);
            setLastSync(new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Erro na sincronização:', err);
        }
        setLoading(false);
    };

    // --- LÓGICA DE EDIÇÃO UNIFICADA (Clientes e Fornecedores) ---
    const handleEdit = (item) => {
        setEditingItem(item);
        setForm({
            nome: item.nome || '',
            whatsapp: item.whatsapp || '',
            marcas: item.marcas || '',
            endereco: item.endereco || ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const table = activeTab === 'fornecedores' ? 'fornecedores' : 'clientes';

        // Payload limpo para evitar erros de metadados
        const payload = {
            nome: form.nome,
            whatsapp: form.whatsapp
        };
        if (activeTab === 'fornecedores') payload.marcas = form.marcas;
        if (activeTab === 'clientes') payload.endereco = form.endereco;

        try {
            if (editingItem?.id) {
                const { error } = await supabase.from(table).update(payload).eq('id', editingItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            setEditingItem(null);
            setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' });
            fetchAllData();
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Falha ao processar operação.');
        }
        setLoading(false);
    };

    const handleDelete = async (id, table) => {
        if (!confirm('Deseja excluir este registro permanentemente?')) return;
        setLoading(true);
        try {
            await supabase.from(table).delete().eq('id', id);
            fetchAllData();
        } catch (err) { alert('Erro ao excluir.'); }
        setLoading(false);
    };

    // --- LÓGICA DE LOGÍSTICA PREMIUM ---
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
        } catch (e) { return { list: [], totalVolume: 0 }; }
    }, [orders]);

    const filteredLogistics = logisticsData.list.filter(item =>
        item.name.toLowerCase().includes(logSearch.toLowerCase())
    );

    const selectedVolume = useMemo(() => {
        return logisticsData.list
            .filter(i => selectedLogIds.includes(i.id))
            .reduce((acc, curr) => acc + curr.qty, 0);
    }, [logisticsData.list, selectedLogIds]);

    const handleSendLogistics = () => {
        const selected = logisticsData.list.filter(i => selectedLogIds.includes(i.id));
        const targetSup = suppliers.find(s => s.id === selectedSupplierId);
        if (!targetSup) return alert('Selecione um fornecedor para o envio!');

        let text = `*PEDIDO DE LOGÍSTICA - ${targetSup.nome.toUpperCase()}* 🚀%0A%0A`;
        selected.forEach(i => text += `• ${i.name}: *${i.qty} unidades*%0A`);
        text += `%0A*Volume Total: ${selected.reduce((a, b) => a + b.qty, 0)} pacotes*`;

        window.open(`https://wa.me/${targetSup.whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    // --- LÓGICA DE CONFIGURAÇÕES ---
    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('configuracoes').update({
                email_admin: settings.email_admin,
                senha_admin: settings.senha_admin,
                whatsapp_suporte: settings.whatsapp_suporte,
                link_catalogo: settings.link_catalogo
            }).eq('id', settings.id);
            if (error) throw error;
            alert('Configurações salvas com sucesso!');
        } catch (err) { alert('Erro ao atualizar sistema.'); }
        setLoading(false);
    };

    // --- ESTRUTURA DE ABAS (6 MÓDULOS) ---
    const tabs = [
        { id: 'vendas', label: 'Vendas', icon: <ClipboardList size={18} /> },
        { id: 'logistica', label: 'Logística', icon: <Truck size={18} /> },
        { id: 'mensagens', label: 'Suporte', icon: <MessageCircle size={18} />, badge: messages.filter(m => !m.lida).length },
        { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
        { id: 'fornecedores', label: 'Fornecedores', icon: <Store size={18} /> },
        { id: 'configuracoes', label: 'Configurações', icon: <SettingsIcon size={18} /> }
    ];

    if (!session) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center animate-pulse">
                <Package className="text-primary mx-auto mb-4" size={50} />
                <p className="text-primary uppercase font-black tracking-widest text-[10px]">Autenticando Hub...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col md:flex-row h-screen overflow-hidden font-sans">

            {/* Nav Lateral */}
            <aside className="w-full md:w-72 bg-dark-800 border-r border-dark-700 flex flex-col h-full z-50">
                <div className="h-24 px-8 flex items-center gap-4 bg-dark-900/40 border-b border-dark-700">
                    <div className="p-2 bg-primary/10 rounded-xl"><Package className="text-primary" size={24} /></div>
                    <h2 className="font-black text-white text-2xl tracking-tighter uppercase leading-none">HUB<span className="text-primary">ADMIN</span></h2>
                </div>
                <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto no-scrollbar">
                    {tabs.map(tab => (
                        <TabBtn key={tab.id} active={activeTab === tab.id} icon={tab.icon} label={tab.label} onClick={() => setActiveTab(tab.id)} badge={tab.badge} />
                    ))}
                </nav>
                <div className="p-6 border-t border-dark-700">
                    <button onClick={() => supabase.auth.signOut()} className="w-full p-4 bg-dark-700 hover:bg-red-500/10 text-neutral-500 hover:text-white rounded-2xl font-black text-[10px] uppercase transition-all">Encerrar Sessão</button>
                </div>
            </aside>

            {/* Painel Principal */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-10 shrink-0 shadow-lg">
                    <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-1.5 flex items-center gap-2 italic"><Clock size={10} /> ATUALIZADO: {lastSync}</span>
                    </div>
                    <button onClick={fetchAllData} className="px-6 py-3.5 bg-primary text-dark-900 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-103 active:scale-95">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'SINCRONIZANDO' : 'FORÇAR SINCRONIA'}
                    </button>
                </header>

                <div className="flex-1 p-10 overflow-y-auto bg-[#0a0a0a] custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-20">

                        {/* ABA VENDAS */}
                        {activeTab === 'vendas' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-2xl font-black text-white uppercase mb-8 italic flex items-center gap-3"><ClipboardList className="text-primary" /> Fluxo de Pedidos</h3>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <table className="w-full text-left font-bold">
                                        <thead className="bg-dark-900 border-b border-dark-700 text-neutral-500 font-black uppercase text-[10px]">
                                            <tr>
                                                <th className="p-8">Cliente</th>
                                                <th className="p-8">Detalhes dos Itens</th>
                                                <th className="p-8 text-center">Status / Data</th>
                                                <th className="p-8 text-center text-primary">Logística</th>
                                                <th className="p-8 text-right">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {orders.map(o => (
                                                <tr key={o.id} className="hover:bg-dark-700/30 transition-all group">
                                                    <td className="p-8 text-white uppercase italic">{o.nome_cliente || 'Final/Consumidor'}</td>
                                                    <td className="p-8 text-neutral-400 text-xs italic group-hover:text-white">{o.status}</td>
                                                    <td className="p-8 text-center">
                                                        <span className="text-[9px] font-black text-neutral-600 block mb-1 uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString()}</span>
                                                        <span className="text-[9px] bg-dark-900 px-2 py-1 rounded border border-dark-700 text-neutral-500 uppercase">Processado</span>
                                                    </td>
                                                    <td className="p-8 text-center">
                                                        <input type="checkbox" checked={o.enviado_logistica || false}
                                                            onChange={async (e) => {
                                                                await supabase.from('pedidos').update({ enviado_logistica: e.target.checked }).eq('id', o.id);
                                                                fetchAllData();
                                                            }}
                                                            className="w-6 h-6 rounded accent-primary cursor-pointer hover:scale-110 transition-transform" />
                                                    </td>
                                                    <td className="p-8 text-right text-primary font-black italic text-lg">R$ {o.total?.toLocaleString('pt-BR') || o.valor?.toLocaleString('pt-BR') || '0,00'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ABA LOGÍSTICA PREMIUM */}
                        {activeTab === 'logistica' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
                                    <h3 className="text-2xl font-black text-white italic uppercase flex items-center gap-3"><Truck className="text-primary" /> Central de Cargas</h3>
                                    <div className="relative w-full lg:w-80"><input type="text" placeholder="Filtrar por marca..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-primary outline-none font-bold" /><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" /></div>
                                </div>

                                {/* CARD CONTADOR REATIVO */}
                                <div className="bg-white shadow-2xl border border-neutral-200 p-8 rounded-[2.5rem] mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-neutral-100 p-5 rounded-2xl border border-neutral-200 shadow-sm"><PackageOpen size={32} className="text-neutral-600" /></div>
                                        <div><span className="text-neutral-400 font-black uppercase text-[10px] tracking-widest block mb-1">Restante em Fila</span><h2 className="text-4xl font-black text-neutral-800 italic tracking-tighter">Volume Total: <span className="text-primary">{logisticsData.totalVolume - selectedVolume}</span> <span className="text-[14px] text-neutral-500 uppercase tracking-tighter">pacs</span></h2></div>
                                    </div>
                                    <div className="h-16 w-px bg-neutral-200 hidden md:block opacity-50"></div>
                                    <div className="flex items-center gap-6">
                                        <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-sm"><Zap size={32} className="text-primary fill-current" /></div>
                                        <div><span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-1">Itens Marcados</span><h2 className="text-4xl font-black text-neutral-800 italic tracking-tighter">{selectedVolume} <span className="text-neutral-400 text-[14px] uppercase tracking-tighter">unidades</span></h2></div>
                                    </div>
                                </div>

                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <div className="p-6 bg-dark-900 border-b border-dark-700 flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex gap-2"><button onClick={() => setSelectedLogIds(filteredLogistics.map(i => i.id))} className="px-5 py-3 bg-dark-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-dark-900 transition-all">Todos</button><button onClick={() => setSelectedLogIds([])} className="px-5 py-3 bg-dark-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">Reset</button></div>
                                        <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
                                            <div className="relative w-full md:w-64">
                                                <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="w-full bg-dark-700 border-2 border-dark-600 rounded-xl px-4 py-3 text-white focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer">
                                                    <option value="">Destinar Para Fornecedor</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                            </div>
                                            <button onClick={handleSendLogistics} disabled={!selectedSupplierId || selectedLogIds.length === 0} className="flex-1 md:flex-none bg-primary text-dark-900 font-black py-4 px-10 rounded-2xl uppercase tracking-[0.2em] shadow-xl text-xs hover:scale-105 active:scale-95 disabled:opacity-30 transition-all">
                                                {selectedLogIds.length > 0 ? `ENVIAR ${selectedLogIds.length} ITENS` : 'SELECIONE P/ ENVIO'}
                                            </button>
                                        </div>
                                    </div>
                                    <table className="w-full text-left font-bold">
                                        <thead className="bg-dark-900 text-neutral-500 font-black uppercase text-[10px]"><tr><th className="p-8 w-24 text-center">Sel</th><th className="p-8">Produto / Marca</th><th className="p-8 text-right">Qtd</th></tr></thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {filteredLogistics.map(item => {
                                                const isSel = selectedLogIds.includes(item.id);
                                                return (
                                                    <tr key={item.id} onClick={() => setSelectedLogIds(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])}
                                                        className={`hover:bg-dark-700/50 cursor-pointer transition-all even:bg-dark-900/20 ${isSel ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                                                        <td className="p-8 flex justify-center"><div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSel ? 'bg-primary border-primary rotate-6' : 'border-dark-600'}`}>{isSel && <CheckCircle2 size={16} className="text-dark-900" />}</div></td>
                                                        <td className={`p-8 font-black uppercase italic text-xl tracking-tighter transition-colors ${isSel ? 'text-primary' : 'text-white'}`}>{item.name}</td>
                                                        <td className="p-8 text-right"><span className={`inline-block font-black px-6 py-2 rounded-xl border-2 text-xs ${isSel ? 'bg-primary text-dark-900 border-primary shadow-lg shadow-primary/20' : 'bg-dark-900 text-neutral-500 border-dark-700'}`}>{item.qty} un</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* MÓDULOS PADRONIZADOS (Suporte, Clientes, Fornecedores) */}
                        {['mensagens', 'clientes', 'fornecedores'].includes(activeTab) && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-white italic uppercase">{activeTab === 'mensagens' ? 'Gestão de Suporte' : activeTab === 'clientes' ? 'Base de Clientes' : 'Cadastro de Parceiros'}</h3>
                                    {activeTab !== 'mensagens' && (
                                        <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-8 py-4 rounded-2xl flex items-center gap-3 uppercase text-[10px] tracking-widest hover:scale-105 active:rotate-2 shadow-xl shadow-primary/20"><Plus size={18} /> Novo Item</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {(activeTab === 'mensagens' ? messages : activeTab === 'clientes' ? clients : suppliers).map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[3rem] hover:border-primary/20 transition-all group shadow-2xl relative">
                                            <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {activeTab !== 'mensagens' && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-3 bg-dark-700 hover:bg-primary hover:text-dark-900 rounded-xl transition-all border border-dark-600 shadow-xl"><Pencil size={14} /></button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, activeTab); }} className="p-3 bg-dark-700 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-dark-600 shadow-xl"><Trash2 size={14} /></button>
                                            </div>
                                            <div className="bg-dark-900 w-16 h-16 rounded-[1.5rem] border border-dark-700 flex items-center justify-center mb-6">{activeTab === 'mensagens' ? <MessageCircle className="text-primary" /> : activeTab === 'clientes' ? <Users className="text-primary" /> : <Store className="text-primary" />}</div>
                                            <h4 className="text-2xl font-black text-white uppercase italic truncate mb-1">{item.nome}</h4>
                                            <p className="text-neutral-500 font-bold text-[10px] mb-6 uppercase tracking-widest">{item.whatsapp}</p>

                                            {activeTab === 'mensagens' && <p className="text-white font-bold italic text-lg leading-tight uppercase bg-dark-900/50 p-4 rounded-xl border border-dark-700">"{item.conteudo}"</p>}
                                            {activeTab === 'clientes' && item.endereco && <p className="text-neutral-600 text-[10px] font-bold uppercase truncate italic"><Truck size={12} className="inline mr-2" />{item.endereco}</p>}
                                            {activeTab === 'fornecedores' && item.marcas && (
                                                <div className="flex flex-wrap gap-2 pt-6 border-t border-dark-700/50">
                                                    {item.marcas.split(',').map((m, idx) => <span key={idx} className="bg-dark-900 text-neutral-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-dark-700 italic">{m.trim()}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ABA CONFIGURAÇÕES (RESTAURADO) */}
                        {activeTab === 'configuracoes' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                                <h3 className="text-2xl font-black text-white uppercase mb-8 italic text-center">Configurações do Ecossistema</h3>
                                <form onSubmit={handleUpdateSettings} className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-12 space-y-8 shadow-3xl">
                                    <div className="grid grid-cols-1 gap-8">
                                        <div><label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block italic">E-mail Administrativo</label><input type="email" value={settings.email_admin} onChange={e => setSettings({ ...settings, email_admin: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white focus:border-primary outline-none font-bold" /></div>
                                        <div><label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block italic">Senha de Acesso Admin</label><input type="password" value={settings.senha_admin} onChange={e => setSettings({ ...settings, senha_admin: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white focus:border-primary outline-none font-bold" /></div>
                                        <div><label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block italic">WhatsApp de Suporte Master</label><input type="text" value={settings.whatsapp_suporte} onChange={e => setSettings({ ...settings, whatsapp_suporte: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white focus:border-primary outline-none font-bold" /></div>
                                        <div><label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mb-3 block italic">Link do Catálogo de Preços</label><input type="text" value={settings.link_catalogo} onChange={e => setSettings({ ...settings, link_catalogo: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white focus:border-primary outline-none font-bold" /></div>
                                    </div>
                                    <button type="submit" className="w-full bg-primary text-dark-900 font-black py-6 rounded-3xl uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all text-xs italic">ATUALIZAR SISTEMA</button>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* MODAL UNIFICADO (EDIÇÃO/NOVO) */}
            {showModal && (
                <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="bg-dark-800 border-2 border-dark-700 w-full max-w-xl rounded-[3rem] p-12 shadow-3xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{editingItem ? 'Editar Registro' : 'Novo Cadastro'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-4 bg-dark-700 rounded-2xl text-neutral-500 hover:text-white transition-all shadow-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div><label className="text-neutral-500 font-black uppercase text-[10px] mb-3 block italic">NOME / RAZÃO SOCIAL</label><input required type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white outline-none focus:border-primary font-bold" placeholder="Identificação Completa" /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-neutral-500 font-black uppercase text-[10px] mb-3 block italic">WHATSAPP (55...)</label><input required type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white outline-none focus:border-primary font-bold" placeholder="5511999999999" /></div>
                                {activeTab === 'fornecedores' ? (
                                    <div><label className="text-neutral-500 font-black uppercase text-[10px] mb-3 block italic">MARCAS ATENDIDAS</label><input type="text" value={form.marcas} onChange={e => setForm({ ...form, marcas: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white outline-none focus:border-primary font-bold" placeholder="Ex: Zomo, Nay" /></div>
                                ) : (
                                    <div><label className="text-neutral-500 font-black uppercase text-[10px] mb-3 block italic">ENDEREÇO / LOJA</label><input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white outline-none focus:border-primary font-bold" placeholder="Opcional" /></div>
                                )}
                            </div>
                            <button type="submit" className="w-full bg-primary text-dark-900 font-black py-6 rounded-3xl uppercase tracking-[0.3em] shadow-xl hover:scale-102 active:scale-95 transition-all text-xs italic mt-8">FINALIZAR CADASTRO</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Botão de Aba Modular
function TabBtn({ active, icon, label, onClick, badge }) {
    return (
        <button onClick={onClick} className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${active ? 'bg-primary text-dark-900 shadow-2xl scale-[1.05] shadow-primary/20 rotate-1' : 'text-neutral-500 hover:bg-dark-700 hover:text-white'}`}>
            <div className="flex items-center gap-4">{icon} {label}</div>
            {badge > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] shadow-lg animate-bounce">{badge}</span>}
        </button>
    );
}
