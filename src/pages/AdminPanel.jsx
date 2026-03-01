/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package, ClipboardList, LogOut, Truck, LayoutDashboard,
    MessageCircle, TrendingUp, RefreshCw, Users, Settings as SettingsIcon,
    Bell, Clock, Search, Zap, PackageOpen, Calculator, AlertCircle,
    Send, Store, CheckCircle2, X, Plus, Pencil, Trash2, ChevronDown
} from 'lucide-react';

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
        id: null, email_admin: '', senha_admin: '',
        whatsapp_suporte: '', link_catalogo: '',
        dia_prospeccao: '', horario_prospeccao: '', mensagem_prospeccao: ''
    });

    // Filtros e Seleções
    const [logSearch, setLogSearch] = useState('');
    const [selectedLogIds, setSelectedLogIds] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [selectedClientIds, setSelectedClientIds] = useState([]);

    // Estados de Modais e Edição Unificada
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({ nome: '', whatsapp: '', marcas: '', endereco: '' });

    // 1. SEGURANÇA E CONEXÃO
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
        } catch (err) { console.error('Erro na sincronização:', err); }
        setLoading(false);
    };

    // --- LOGÍSTICA (ENVIAR/REMOVER) ---
    const toggleLogistics = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ enviado_logistica: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchAllData();
        } catch (err) {
            alert('Erro ao atualizar status logístico.');
        }
    };

    // --- STATUS DO PEDIDO ---
    const updateOrderStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ situacao: newStatus }) // Usamos 'situacao' para o progresso do pedido
                .eq('id', id);

            if (error) throw error;
            fetchAllData();
        } catch (err) {
            alert('Erro ao atualizar status do pedido.');
        }
    };

    // --- LÓGICA DE SALVAMENTO ---
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        const table = activeTab === 'fornecedores' ? 'fornecedores' : 'clientes';
        const payload = { nome: form.nome, whatsapp: form.whatsapp };
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
            alert('Salvo com sucesso!');
        } catch (err) {
            alert('Erro ao salvar no banco.');
        }
        setLoading(false);
    };

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

    const handleDelete = async (id, table) => {
        if (!confirm('Deseja excluir permanentemente?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            fetchAllData();
        } catch (err) {
            alert('Erro ao excluir.');
        }
        setLoading(false);
    };

    // --- LOGÍSTICA PREMIUM ---
    const logisticsData = useMemo(() => {
        const itemMap = {};
        let totalVolume = 0;
        orders.filter(o => o.enviado_logistica).forEach(order => {
            const parts = (order.status || '').split(' - ');
            if (parts.length >= 2) {
                parts[1].split(', ').forEach(raw => {
                    const match = raw.match(/(.+) \((\d+)[x| un]*\)/i) || raw.match(/^(\d+)[x| un]*\s+(.+)$/i);
                    if (match) {
                        const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                        const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]) || 1;
                        itemMap[name] = (itemMap[name] || 0) + qty;
                        totalVolume += qty;
                    }
                });
            }
        });
        return { list: Object.entries(itemMap).map(([name, qty], idx) => ({ id: `log-${idx}`, name, qty })), totalVolume };
    }, [orders]);

    const selectedVolume = logisticsData.list.filter(i => selectedLogIds.includes(i.id)).reduce((acc, curr) => acc + curr.qty, 0);

    const handleSendLogistics = () => {
        const selected = logisticsData.list.filter(i => selectedLogIds.includes(i.id));
        const targetSup = suppliers.find(s => s.id === selectedSupplierId);
        if (!targetSup) return alert('Selecione um fornecedor!');
        let text = `*PEDIDO LOGÍSTICO - ${targetSup.nome.toUpperCase()}*%0A%0A`;
        selected.forEach(i => text += `• ${i.name}: *${i.qty} un*%0A`);
        window.open(`https://wa.me/${targetSup.whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await supabase.from('configuracoes').update(settings).eq('id', settings.id);
            alert('Configurações atualizadas!');
        } catch (err) { alert('Erro nas configurações.'); }
        setLoading(false);
    };

    // --- PROSPECÇÃO ---
    const isProspectionDay = useMemo(() => {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return days[new Date().getDay()] === settings.dia_prospeccao;
    }, [settings.dia_prospeccao]);

    const enviarCatalogo = (p_client) => {
        const link = settings.link_catalogo || '';
        const message = `Olá ${p_client.nome}, estamos com novidades! Confira nosso catálogo: ${link}`;
        window.open(`https://wa.me/${p_client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleBulkCatalog = () => {
        if (selectedClientIds.length === 0) return alert('Selecione clientes!');
        clients.filter(c => selectedClientIds.includes(c.id)).forEach((c, idx) => {
            setTimeout(() => enviarCatalogo(c), idx * 1000);
        });
    };

    const tabs = [
        { id: 'vendas', label: 'Vendas', icon: <ClipboardList size={18} /> },
        { id: 'logistica', label: 'Logística', icon: <Truck size={18} /> },
        { id: 'mensagens', label: 'Suporte', icon: <MessageCircle size={18} />, badge: messages.filter(m => !m.lida).length },
        { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
        { id: 'fornecedores', label: 'Fornecedores', icon: <Store size={18} /> },
        { id: 'configuracoes', label: 'Configurações', icon: <SettingsIcon size={18} /> }
    ];

    if (!session) return <div className="min-h-screen bg-black flex items-center justify-center animate-pulse"><Package className="text-primary" size={50} /></div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            {/* Nav Lateral */}
            <aside className="w-full md:w-72 bg-dark-800 border-r border-dark-700 flex flex-col h-full z-50">
                <div className="h-24 px-8 flex items-center gap-4 bg-dark-900/40 border-b border-dark-700 select-none">
                    <Package className="text-primary" size={24} />
                    <h2 className="font-black text-white text-2xl tracking-tighter uppercase">HUB<span className="text-primary">ADMIN</span></h2>
                </div>
                <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary text-dark-900 shadow-2xl scale-[1.05]' : 'text-neutral-500 hover:bg-dark-700'}`}>
                            <div className="flex items-center gap-4">{tab.icon} {tab.label}</div>
                            {tab.badge > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] animate-bounce">{tab.badge}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Painel Principal */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {isProspectionDay && (
                    <div className="bg-primary p-3 flex items-center justify-center gap-4 text-dark-900 font-black text-[10px] uppercase tracking-widest z-[60] shadow-xl">
                        <Zap size={14} className="animate-pulse" /> 🚀 Hoje é dia de prospecção! {clients.length} clientes aguardam catálogo.
                        <button onClick={() => setActiveTab('clientes')} className="bg-dark-900 text-white px-4 py-1.5 rounded-lg ml-4 hover:scale-105 transition-all">Ir para Clientes</button>
                    </div>
                )}

                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-10 shadow-lg shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <span className="text-[8px] font-black text-neutral-500 uppercase block mt-1 tracking-widest">Sincronizado: {lastSync}</span>
                    </div>
                    <button onClick={fetchAllData} className="px-6 py-3.5 bg-primary text-dark-900 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-primary/20">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Carregando...' : 'Sincronizar'}
                    </button>
                </header>

                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto pb-20">

                        {activeTab === 'vendas' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-2xl font-black text-white italic uppercase mb-8">Fluxo de Vendas</h3>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <table className="w-full text-left font-bold border-collapse">
                                        <thead className="bg-dark-900 text-neutral-500 uppercase text-[10px]">
                                            <tr>
                                                <th className="p-8">🛒 Log</th>
                                                <th className="p-8">Cliente</th>
                                                <th className="p-8">Detalhes</th>
                                                <th className="p-8 text-center">Status</th>
                                                <th className="p-8 text-center">Data</th>
                                                <th className="p-8 text-right">Valor</th>
                                                <th className="p-8 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {orders.map(o => (
                                                <tr key={o.id} className={`hover:bg-dark-700/30 transition-all ${o.enviado_logistica ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-8">
                                                        <input
                                                            type="checkbox"
                                                            checked={o.enviado_logistica || false}
                                                            onChange={() => toggleLogistics(o.id, o.enviado_logistica)}
                                                            className="w-5 h-5 accent-primary cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="p-8 text-white italic uppercase">{o.nome_cliente || 'Consumidor'}</td>
                                                    <td className="p-8 text-neutral-400 text-xs italic">{o.status}</td>
                                                    <td className="p-8 text-center">
                                                        <select
                                                            value={o.situacao || 'Pendente'}
                                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                            className="bg-dark-900 border border-dark-600 rounded-lg px-3 py-1 text-[9px] font-black uppercase text-primary outline-none focus:border-primary transition-all"
                                                        >
                                                            <option value="Pendente">Pendente</option>
                                                            <option value="Pago">Pago</option>
                                                            <option value="Enviado">Enviado</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-8 text-center text-neutral-600 uppercase text-[9px] font-black">{new Date(o.created_at).toLocaleDateString()}</td>
                                                    <td className="p-8 text-right text-primary font-black italic text-xl">R$ {o.total?.toLocaleString('pt-BR') || o.valor?.toLocaleString('pt-BR') || '0,00'}</td>
                                                    <td className="p-8 text-center">
                                                        <button
                                                            onClick={() => handleDelete(o.id, 'pedidos')}
                                                            className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all shadow-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logistica' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white shadow-3xl p-8 rounded-[2.5rem] mb-10 border border-neutral-200 flex justify-between items-center flex-wrap gap-8">
                                    <div className="flex items-center gap-6"><PackageOpen size={30} className="text-neutral-500" /><h2 className="text-4xl font-black italic text-neutral-800">Fila Restante: <span className="text-primary">{logisticsData.totalVolume - selectedVolume}</span></h2></div>
                                    <div className="flex items-center gap-6"><Zap size={30} className="text-primary fill-current" /><h2 className="text-4xl font-black italic text-neutral-800">Marcados: {selectedVolume}</h2></div>
                                </div>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden">
                                    <div className="p-6 bg-dark-900 border-b border-dark-700 flex justify-between items-center flex-wrap gap-4">
                                        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="bg-dark-700 p-3 rounded-xl text-white font-black text-[10px] uppercase outline-none">
                                            <option value="">Destinar Fornecedor</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                        <button onClick={handleSendLogistics} disabled={!selectedSupplierId || selectedLogIds.length === 0} className="bg-primary text-dark-900 font-black px-10 py-4 rounded-xl uppercase text-xs disabled:opacity-20 shadow-xl shadow-primary/20">Enviar WhatsApp</button>
                                    </div>
                                    <table className="w-full text-left font-bold border-collapse">
                                        <thead className="bg-dark-900 text-neutral-500 uppercase text-[10px]"><tr><th className="p-8">Sel</th><th className="p-8">Item</th><th className="p-8 text-right">Quantidade</th></tr></thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {logisticsData.list.map(item => (
                                                <tr key={item.id} onClick={() => setSelectedLogIds(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])} className={`hover:bg-dark-700/50 cursor-pointer ${selectedLogIds.includes(item.id) ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-8"><div className={`w-7 h-7 border-2 rounded-xl transition-all ${selectedLogIds.includes(item.id) ? 'bg-primary border-primary rotate-12' : 'border-dark-600'}`}>{selectedLogIds.includes(item.id) && <CheckCircle2 size={16} className="text-dark-900" />}</div></td>
                                                    <td className="p-8 text-white font-black uppercase italic text-xl">{item.name}</td>
                                                    <td className="p-8 text-right"><span className="bg-dark-900 px-4 py-1.5 rounded-lg border border-dark-700 text-xs text-neutral-500 font-black">{item.qty} un</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'clientes' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-10 flex-wrap gap-6">
                                    <div className="flex gap-4 items-center">
                                        <h3 className="text-2xl font-black text-white italic uppercase">Clientes</h3>
                                        <div className="bg-dark-900 px-4 py-2 rounded-xl flex items-center gap-3 border border-dark-700 cursor-pointer" onClick={() => setSelectedClientIds(selectedClientIds.length === clients.length ? [] : clients.map(c => c.id))}>
                                            <input type="checkbox" checked={selectedClientIds.length === clients.length} readOnly className="w-4 h-4 accent-primary" />
                                            <span className="text-[9px] font-black uppercase text-neutral-500 italic">Selecionar Todos</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {selectedClientIds.length > 0 && <button onClick={handleBulkCatalog} className="bg-green-500 text-white font-black px-8 py-4 rounded-xl uppercase text-[10px] shadow-lg shadow-green-500/10">Disparar p/ {selectedClientIds.length}</button>}
                                        <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-8 py-4 rounded-xl uppercase text-[10px] shadow-lg">+ Novo Cliente</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {clients.map(item => {
                                        const isSel = selectedClientIds.includes(item.id);
                                        return (
                                            <div key={item.id} className={`bg-dark-800 border-2 p-8 rounded-[3rem] relative group transition-all ${isSel ? 'border-primary shadow-xl shadow-primary/10' : 'border-dark-700'}`}>
                                                <div className="absolute top-8 left-8"><input type="checkbox" checked={isSel} onChange={() => setSelectedClientIds(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id])} className="w-6 h-6 accent-primary cursor-pointer" /></div>
                                                <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleEdit(item)} className="p-2 bg-dark-700 rounded-lg hover:text-primary"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDelete(item.id, 'clientes')} className="p-2 bg-dark-700 rounded-lg hover:text-red-500"><Trash2 size={12} /></button>
                                                </div>
                                                <div className="mt-12 h-16 w-16 bg-dark-900 rounded-[1.5rem] flex items-center justify-center border border-dark-700 mb-6 group-hover:bg-primary/5 transition-all"><Users className="text-primary" /></div>
                                                <h4 className="text-2xl font-black text-white italic truncate uppercase">{item.nome}</h4>
                                                <p className="text-neutral-500 font-black text-[10px] uppercase tracking-widest">{item.whatsapp}</p>
                                                <button
                                                    onClick={() => enviarCatalogo(item)}
                                                    className="w-full mt-6 py-4 bg-dark-900 hover:bg-primary/10 border border-dark-700 text-neutral-500 hover:text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                                >
                                                    <MessageCircle size={14} /> Enviar Catálogo
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'fornecedores' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-white italic uppercase">Fornecedores</h3>
                                    <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-8 py-4 rounded-xl uppercase text-[10px]">+ Novo Parceiro</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {suppliers.map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[3rem] relative group hover:border-primary/20 transition-all">
                                            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEdit(item)} className="p-2 bg-dark-700 rounded-lg"><Pencil size={12} /></button>
                                                <button onClick={() => handleDelete(item.id, 'fornecedores')} className="p-2 bg-dark-700 rounded-lg"><Trash2 size={12} /></button>
                                            </div>
                                            <div className="h-16 w-16 bg-dark-900 rounded-[1.5rem] flex items-center justify-center border border-dark-700 mb-6"><Store className="text-primary" /></div>
                                            <h4 className="text-2xl font-black text-white italic truncate uppercase mb-2">{item.nome}</h4>
                                            <div className="flex flex-wrap gap-2 pt-4 border-t border-dark-700/50">
                                                {item.marcas?.split(',').map((m, idx) => <span key={idx} className="bg-dark-900 text-neutral-500 px-3 py-1.5 rounded-lg text-[9px] uppercase font-black italic">{m.trim()}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'mensagens' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-2xl font-black text-white italic uppercase mb-10">Inbox Suporte</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {messages.map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[3rem] relative group">
                                            <div className="absolute top-8 right-8"><button onClick={() => handleDelete(item.id, 'mensagens')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all shadow-lg"><Trash2 size={14} /></button></div>
                                            <div className="h-14 w-14 bg-dark-900 rounded-2xl flex items-center justify-center mb-6 text-primary border border-dark-700"><MessageCircle size={24} /></div>
                                            <h4 className="text-xl font-black text-white italic uppercase truncate mb-1">{item.nome || 'Cliente Anônimo'}</h4>
                                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-4">{item.whatsapp || 'Whats não informado'}</span>
                                            <p className="text-white font-bold bg-dark-900/50 p-6 border border-dark-700 rounded-2xl italic leading-tight text-lg uppercase shadow-inner">
                                                "{item.conteudo || item.mensagem || item.texto || 'Mensagem sem conteúdo'}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'configuracoes' && (
                            <div className="max-w-4xl mx-auto animate-in scale-95 duration-500">
                                <form onSubmit={handleUpdateSettings} className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-12 shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-primary uppercase text-[10px] font-black border-b border-primary/20 pb-2 italic select-none">Acesso Hub</h4>
                                        <div><label className="text-neutral-500 uppercase text-[9px] font-black mb-2 block italic">E-mail Administrativo</label><input type="email" value={settings.email_admin} onChange={e => setSettings({ ...settings, email_admin: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary transition-all shadow-inner" /></div>
                                        <div><label className="text-neutral-500 uppercase text-[9px] font-black mb-2 block italic">WhatsApp Suporte</label><input type="text" value={settings.whatsapp_suporte} onChange={e => setSettings({ ...settings, whatsapp_suporte: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white font-bold outline-none" /></div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-primary uppercase text-[10px] font-black border-b border-primary/20 pb-2 italic select-none">Prospecção</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-neutral-500 uppercase text-[9px] font-black mb-2 block italic">Dia Alerta</label><select value={settings.dia_prospeccao} onChange={e => setSettings({ ...settings, dia_prospeccao: e.target.value })} className="w-full bg-dark-900 p-5 border-2 border-dark-700 rounded-2xl text-white font-bold italic appearance-none">{['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                            <div><label className="text-neutral-500 uppercase text-[9px] font-black mb-2 block italic">Hora Sugerida</label><input type="time" value={settings.horario_prospeccao} onChange={e => setSettings({ ...settings, horario_prospeccao: e.target.value })} className="w-full bg-dark-900 p-5 border-2 border-dark-700 rounded-2xl text-white font-bold" /></div>
                                        </div>
                                        <div><label className="text-neutral-500 uppercase text-[9px] font-black mb-2 block italic">Link Catálogo</label><input type="text" value={settings.link_catalogo} onChange={e => setSettings({ ...settings, link_catalogo: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-5 text-white font-bold" /></div>
                                    </div>
                                    <button type="submit" className="md:col-span-2 w-full bg-primary text-dark-900 font-black py-6 rounded-[2rem] uppercase tracking-widest italic shadow-xl hover:scale-[1.02] transition-all">Salvar Sistema</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODAL UNIFICADO */}
            {showModal && (
                <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-8 animate-in fade-in">
                    <div className="bg-dark-800 border-4 border-dark-700 w-full max-w-xl rounded-[4rem] p-12 shadow-3xl relative animate-in zoom-in-95">
                        <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-4 bg-dark-700 rounded-2xl text-neutral-500 hover:text-white transition-all shadow-xl hover:bg-red-500/10"><X size={24} /></button>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-10 select-none">{editingItem ? 'Editar' : 'Novo'} {activeTab === 'fornecedores' ? 'Fornecedor' : 'Cliente'}</h2>
                        <form onSubmit={handleSave} className="space-y-8">
                            <div><label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-widest">Identificação Social</label><input required type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value.toUpperCase() })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-3xl p-6 text-white font-black italic focus:border-primary outline-none shadow-inner uppercase" placeholder="NOME OU RAZÃO..." /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div><label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-widest">WhatsApp (Com 55)</label><input required type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-3xl p-6 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="55..." /></div>
                                {activeTab === 'fornecedores' ? (
                                    <div><label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-widest">Marcas do Catálogo</label><input type="text" value={form.marcas} onChange={e => setForm({ ...form, marcas: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-3xl p-6 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="Ex: Zomo, Nay..." /></div>
                                ) : (
                                    <div><label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-widest">Endereço da Loja</label><input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-3xl p-6 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="Opcional..." /></div>
                                )}
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary text-dark-900 font-black py-8 rounded-[2.5rem] uppercase tracking-[0.3em] shadow-2xl hover:scale-103 active:scale-95 transition-all text-sm mt-8 border-none flex items-center justify-center gap-4">
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                {editingItem ? 'ATUALIZAR DADOS' : 'FINALIZAR CADASTRO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
