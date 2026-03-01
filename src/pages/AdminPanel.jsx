/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package, ClipboardList, LogOut, Truck, LayoutDashboard,
    MessageCircle, TrendingUp, RefreshCw, Users, Settings as SettingsIcon,
    Bell, Clock, Search, Zap, PackageOpen, Calculator, AlertCircle,
    Send, Store, CheckCircle2, X, Plus, Pencil, Trash2, ChevronDown,
    Printer
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
    const [selectedLogIds, setSelectedLogIds] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [printingOrder, setPrintingOrder] = useState(null);

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

    const toggleLogistics = async (id, currentStatus) => {
        try {
            const { error } = await supabase.from('pedidos').update({ enviado_logistica: !currentStatus }).eq('id', id);
            if (error) throw error;
            fetchAllData();
        } catch (err) { alert('Erro na logística.'); }
    };

    const updateOrderStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase.from('pedidos').update({ situacao: newStatus }).eq('id', id);
            if (error) throw error;
            fetchAllData();
        } catch (err) { alert('Erro no status.'); }
    };

    const handlePrint = (order) => {
        setPrintingOrder(order);
        // Pequeno delay para garantir que o DOM renderizou o pedido no ReceiptContent
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        const table = activeTab === 'fornecedores' ? 'fornecedores' : 'clientes';
        const payload = { nome: form.nome, whatsapp: form.whatsapp };
        if (activeTab === 'fornecedores') payload.marcas = form.marcas;
        if (activeTab === 'clientes') payload.endereco = form.endereco;

        try {
            if (editingItem?.id) {
                await supabase.from(table).update(payload).eq('id', editingItem.id);
            } else {
                await supabase.from(table).insert([payload]);
            }
            setShowModal(false);
            setEditingItem(null);
            setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' });
            fetchAllData();
            alert('Salvo com sucesso!');
        } catch (err) { alert('Erro ao salvar.'); }
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
        if (!confirm('Deseja excluir?')) return;
        setLoading(true);
        try {
            await supabase.from(table).delete().eq('id', id);
            fetchAllData();
        } catch (err) { alert('Erro ao excluir.'); }
        setLoading(false);
    };

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
            alert('Configurações salvas!');
        } catch (err) { alert('Erro ao salvar as configurações.'); }
        setLoading(false);
    };

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

    const formatarMoeda = (valor) => {
        return `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col md:flex-row h-screen overflow-hidden font-sans relative">

            {/* CSS DE IMPRESSÃO TÉRMICA (ESTRITA) */}
            <style>
                {`
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                        body * { visibility: hidden !important; background: white !important; }
                        #print-receipt-section, #print-receipt-section * { 
                            visibility: visible !important; 
                            display: block !important;
                        }
                        #print-receipt-section {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm;
                            padding: 4mm;
                            color: black !important;
                            font-family: 'Courier New', Courier, monospace;
                        }
                        .no-print { display: none !important; }
                        aside, header, main, nav, button, .modal-backdrop { display: none !important; }
                    }
                `}
            </style>

            {/* Nav Lateral */}
            <aside className="w-full md:w-72 bg-dark-800 border-r border-dark-700 flex flex-col h-full z-50 transition-all no-print">
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
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative no-print">
                {isProspectionDay && (
                    <div className="bg-primary p-3 flex items-center justify-center gap-4 text-dark-900 font-black text-[10px] uppercase tracking-widest z-[60] shadow-xl">
                        <Zap size={14} className="animate-pulse" /> 🚀 Hoje é dia de prospecção! {clients.length} clientes aguardam catálogo.
                        <button onClick={() => setActiveTab('clientes')} className="bg-dark-900 text-white px-4 py-1.5 rounded-lg ml-4 hover:scale-105 transition-all uppercase text-[8px]">Ir para Clientes</button>
                    </div>
                )}

                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-10 shadow-lg shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <span className="text-[8px] font-black text-neutral-500 uppercase block mt-1 tracking-widest italic">Sincronizado: {lastSync}</span>
                    </div>
                    <button onClick={fetchAllData} className="px-6 py-3.5 bg-primary text-dark-900 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
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
                                                <th className="p-8">Itens</th>
                                                <th className="p-8 text-center">Status</th>
                                                <th className="p-8 text-center">Data</th>
                                                <th className="p-8 text-right">VALOR TOTAL (R$)</th>
                                                <th className="p-8 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {orders.map(o => (
                                                <tr key={o.id} className={`hover:bg-dark-700/30 transition-all ${o.enviado_logistica ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-8">
                                                        <input type="checkbox" checked={o.enviado_logistica || false} onChange={() => toggleLogistics(o.id, o.enviado_logistica)} className="w-5 h-5 accent-primary cursor-pointer" />
                                                    </td>
                                                    <td className="p-8 text-white italic uppercase text-sm">{o.nome_cliente || 'Consumidor'}</td>
                                                    <td className="p-8 text-neutral-400 text-[10px] italic leading-relaxed">{o.status}</td>
                                                    <td className="p-8 text-center">
                                                        <select value={o.situacao || 'Pendente'} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="bg-dark-900 border border-dark-600 rounded-xl px-3 py-2 text-[9px] font-black uppercase text-primary outline-none focus:border-primary transition-all cursor-pointer">
                                                            <option value="Pendente">Pendente</option>
                                                            <option value="Pago">Pago</option>
                                                            <option value="Enviado">Enviado</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-8 text-center text-neutral-600 uppercase text-[9px] font-black">{new Date(o.created_at).toLocaleDateString()}</td>
                                                    <td className="p-8 text-right text-primary font-black italic text-xl">
                                                        {formatarMoeda(o.valor_total)}
                                                    </td>
                                                    <td className="p-8 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handlePrint(o)} className="p-3 bg-dark-700 rounded-xl hover:text-primary transition-all text-neutral-400 shadow-lg" title="Imprimir Recibo"><Printer size={14} /></button>
                                                            <button onClick={() => handleDelete(o.id, 'pedidos')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all text-neutral-400 shadow-lg" title="Excluir Venda"><Trash2 size={14} /></button>
                                                        </div>
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
                                <div className="bg-white shadow-3xl p-10 rounded-[2.5rem] mb-12 border border-neutral-200 flex justify-between items-center flex-wrap gap-10">
                                    <div className="flex items-center gap-6"><PackageOpen size={36} className="text-neutral-500" /><h2 className="text-5xl font-black italic text-neutral-800 leading-none">Restante: <span className="text-primary">{logisticsData.totalVolume - selectedVolume}</span></h2></div>
                                    <div className="flex items-center gap-6"><Zap size={36} className="text-primary fill-current" /><h2 className="text-5xl font-black italic text-neutral-800 leading-none">Marcados: {selectedVolume}</h2></div>
                                </div>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden">
                                    <div className="p-8 bg-dark-900 border-b border-dark-700 flex justify-between items-center flex-wrap gap-4">
                                        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="bg-dark-700 p-4 rounded-xl text-white font-black text-[10px] uppercase outline-none border border-dark-600">
                                            <option value="">Selecione o Fornecedor</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                        <button onClick={handleSendLogistics} disabled={!selectedSupplierId || selectedLogIds.length === 0} className="bg-primary hover:bg-primary-hover text-dark-900 font-black px-12 py-5 rounded-2xl uppercase text-xs disabled:opacity-20 shadow-2xl shadow-primary/20 transition-all active:scale-95">Despachar via WhatsApp</button>
                                    </div>
                                    <table className="w-full text-left font-bold border-collapse">
                                        <thead className="bg-dark-900 text-neutral-500 uppercase text-[10px]"><tr><th className="p-8">Sel</th><th className="p-8">Produto / Marca</th><th className="p-8 text-right">Volume</th></tr></thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {logisticsData.list.map(item => (
                                                <tr key={item.id} onClick={() => setSelectedLogIds(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])} className={`hover:bg-dark-700/50 cursor-pointer transition-all ${selectedLogIds.includes(item.id) ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-8"><div className={`w-8 h-8 border-2 rounded-xl flex items-center justify-center transition-all ${selectedLogIds.includes(item.id) ? 'bg-primary border-primary rotate-12 scale-110 shadow-lg' : 'border-dark-600'}`}>{selectedLogIds.includes(item.id) && <CheckCircle2 size={18} className="text-dark-900" />}</div></td>
                                                    <td className="p-8 text-white font-black uppercase italic text-2xl tracking-tighter">{item.name}</td>
                                                    <td className="p-8 text-right"><span className="bg-dark-900 px-6 py-2.5 rounded-2xl border border-dark-700 text-[10px] text-neutral-500 font-black uppercase italic tracking-widest">{item.qty} un</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'clientes' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-10 flex-wrap gap-6 border-b border-dark-700 pb-8">
                                    <div className="flex gap-6 items-center">
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Gestão de Clientes</h3>
                                        <div className="bg-dark-900 px-6 py-3.5 rounded-2xl flex items-center gap-4 border border-dark-700 cursor-pointer hover:border-primary transition-all group" onClick={() => setSelectedClientIds(selectedClientIds.length === clients.length ? [] : clients.map(c => c.id))}>
                                            <input type="checkbox" checked={selectedClientIds.length === clients.length} readOnly className="w-5 h-5 accent-primary" />
                                            <span className="text-[10px] font-black uppercase text-neutral-500 italic group-hover:text-primary transition-colors tracking-widest">Selecionar Base Completa</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {selectedClientIds.length > 0 && <button onClick={handleBulkCatalog} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all active:scale-95">Disparo em Massa ({selectedClientIds.length})</button>}
                                        <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-10 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all active:scale-95">+ Adicionar Cliente</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {clients.map(item => {
                                        const isSel = selectedClientIds.includes(item.id);
                                        return (
                                            <div key={item.id} className={`bg-dark-800 border-2 p-10 rounded-[3.5rem] relative group transition-all duration-300 ${isSel ? 'border-primary shadow-2xl shadow-primary/10 -translate-y-2' : 'border-dark-700'}`}>
                                                <div className="absolute top-10 left-10"><input type="checkbox" checked={isSel} onChange={() => setSelectedClientIds(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id])} className="w-6 h-6 accent-primary cursor-pointer" /></div>
                                                <div className="absolute top-10 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => handleEdit(item)} className="p-3 bg-dark-700 rounded-xl hover:text-primary transition-all"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDelete(item.id, 'clientes')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                                </div>
                                                <div className="mt-14 h-20 w-20 bg-dark-900 rounded-[2rem] flex items-center justify-center border border-dark-700 mb-8 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all"><Users className="text-primary" size={32} /></div>
                                                <h4 className="text-3xl font-black text-white italic truncate uppercase tracking-tighter mb-2">{item.nome}</h4>
                                                <p className="text-neutral-500 font-black text-[11px] uppercase tracking-[0.2em] mb-8">{item.whatsapp}</p>
                                                <button onClick={() => enviarCatalogo(item)} className="w-full py-5 bg-dark-900 hover:bg-primary text-neutral-500 hover:text-dark-900 border border-dark-700 hover:border-primary rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"><MessageCircle size={16} /> Enviar WhatsApp</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'fornecedores' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-12 border-b border-dark-700 pb-8">
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Gestão de Fornecedores</h3>
                                    <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-12 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all active:scale-95">+ Novo Fornecedor</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {suppliers.map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[3.5rem] relative group hover:border-primary/20 transition-all duration-300 hover:-translate-y-2">
                                            <div className="absolute top-10 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEdit(item)} className="p-3 bg-dark-700 rounded-xl hover:text-primary transition-all"><Pencil size={12} /></button>
                                                <button onClick={() => handleDelete(item.id, 'fornecedores')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                            </div>
                                            <div className="h-20 w-20 bg-dark-900 rounded-[2rem] flex items-center justify-center border border-dark-700 mb-8"><Store className="text-primary" size={32} /></div>
                                            <h4 className="text-3xl font-black text-white italic truncate uppercase tracking-tighter mb-4">{item.nome}</h4>
                                            <div className="flex flex-wrap gap-2 pt-6 border-t border-dark-700/50">
                                                {item.marcas?.split(',').map((m, idx) => <span key={idx} className="bg-dark-900 text-neutral-500 px-4 py-2 rounded-xl text-[9px] uppercase font-black italic tracking-widest border border-dark-700">{m.trim()}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'mensagens' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-12">Mensagens de Suporte</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {messages.map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[4rem] relative group overflow-hidden">
                                            <div className="absolute top-10 right-10"><button onClick={() => handleDelete(item.id, 'mensagens')} className="p-4 bg-dark-700 rounded-2xl hover:text-red-500 transition-all shadow-xl"><Trash2 size={16} /></button></div>
                                            <div className="h-16 w-16 bg-dark-900 rounded-3xl flex items-center justify-center mb-8 text-primary border border-dark-700 shadow-inner"><MessageCircle size={28} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase truncate mb-2">{item.nome || 'Cliente Anônimo'}</h4>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] block mb-8">{item.whatsapp || 'Whats não detectado'}</span>
                                            <p className="text-white font-bold bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] italic leading-relaxed text-lg uppercase shadow-2xl relative">
                                                <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                                                {item.conteudo || item.mensagem || item.texto || 'Conteúdo vazio.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'configuracoes' && (
                            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
                                <form onSubmit={handleUpdateSettings} className="bg-dark-800 border-2 border-dark-700 rounded-[4rem] p-16 shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-12 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                                    <div className="space-y-8 relative z-10">
                                        <h4 className="text-primary uppercase text-[11px] font-black border-b-2 border-primary/20 pb-3 italic tracking-[0.3em]">Segurança Hub</h4>
                                        <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">E-mail Master</label><input type="email" value={settings.email_admin} onChange={e => setSettings({ ...settings, email_admin: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary transition-all shadow-inner" /></div>
                                        <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Número Suporte</label><input type="text" value={settings.whatsapp_suporte} onChange={e => setSettings({ ...settings, whatsapp_suporte: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary" /></div>
                                    </div>
                                    <div className="space-y-8 relative z-10">
                                        <h4 className="text-primary uppercase text-[11px] font-black border-b-2 border-primary/20 pb-3 italic tracking-[0.3em]">Automação</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Dia Alerta</label><select value={settings.dia_prospeccao} onChange={e => setSettings({ ...settings, dia_prospeccao: e.target.value })} className="w-full bg-dark-900 p-6 border-2 border-dark-700 rounded-2xl text-white font-bold italic appearance-none cursor-pointer outline-none focus:border-primary">{['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                            <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Horário</label><input type="time" value={settings.horario_prospeccao} onChange={e => setSettings({ ...settings, horario_prospeccao: e.target.value })} className="w-full bg-dark-900 p-6 border-2 border-dark-700 rounded-2xl text-white font-bold outline-none focus:border-primary" /></div>
                                        </div>
                                        <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Link do Catálogo Vivo</label><input type="text" value={settings.link_catalogo} onChange={e => setSettings({ ...settings, link_catalogo: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary" /></div>
                                    </div>
                                    <button type="submit" disabled={loading} className="md:col-span-2 w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-7 rounded-[2.5rem] uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-sm mt-4 border-none flex items-center justify-center gap-4">
                                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} SALVAR ECOSSISTEMA
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* RECIBO TÉRMICO OCULTO (RECEIPT CONTENT) */}
            {printingOrder && (
                <div id="print-receipt-section">
                    <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 5px 0' }}>TABACARIA HUB</h1>
                        <p style={{ fontSize: '12px', margin: '0', letterSpacing: '2px' }}>MODERNA • PREMIUM • ELITE</p>
                    </div>

                    <div style={{ marginBottom: '15px', fontSize: '13px', lineHeight: '1.5' }}>
                        <p><strong>DATA:</strong> {new Date(printingOrder.created_at).toLocaleString('pt-BR')}</p>
                        <p><strong>CLIENTE:</strong> {printingOrder.nome_cliente?.toUpperCase() || 'CONSUMIDOR'}</p>
                        <p style={{ marginTop: '5px' }}><strong>SITUAÇÃO:</strong> {printingOrder.situacao?.toUpperCase() || 'PENDENTE'}</p>
                    </div>

                    <div style={{ borderTop: '1px dashed black', paddingTop: '10px', marginBottom: '10px' }}>
                        <p style={{ fontWeight: '900', fontSize: '14px', marginBottom: '10px' }}>DETALHAMENTO DO PEDIDO:</p>
                        <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6', background: '#f9f9f9', padding: '10px', border: '1px solid #eee' }}>
                            {printingOrder.status?.split('-')[1]?.trim() || 'Sem descrição de itens.'}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', borderTop: '2px solid black', paddingTop: '12px', marginTop: '10px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0' }}>TOTAL: {formatarMoeda(printingOrder.valor_total)}</h2>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid black', paddingTop: '15px' }}>
                        <p style={{ fontSize: '11px', margin: '0', fontStyle: 'italic' }}>OBRIGADO PELA PREFERÊNCIA!</p>
                        <p style={{ fontSize: '9px', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>SISTEMA HUB ADMIN v2.0</p>
                    </div>
                </div>
            )}

            {/* MODAL UNIFICADO (CLIENTE/FORNECEDOR) */}
            {showModal && (
                <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-8 animate-in fade-in transition-all modal-backdrop">
                    <div className="bg-dark-800 border-4 border-dark-700 w-full max-w-2xl rounded-[4rem] p-14 shadow-3xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowModal(false)} className="absolute top-12 right-12 p-4 bg-dark-700 rounded-2xl text-neutral-500 hover:text-white transition-all shadow-xl hover:bg-red-500/10 active:scale-90"><X size={24} /></button>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-12 select-none border-l-8 border-primary pl-6 leading-none">{editingItem ? 'Editar' : 'Novo'} {activeTab === 'fornecedores' ? 'Fornecedor' : 'Cliente'}</h2>
                        <form onSubmit={handleSave} className="space-y-10">
                            <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Nome / Identificação</label><input required type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value.toUpperCase() })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black italic focus:border-primary outline-none shadow-inner uppercase text-lg tracking-tight" placeholder="EX: LOJA DO CENTRO..." /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">WhatsApp (DDI/DDD)</label><input required type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner tracking-widest" placeholder="5511..." /></div>
                                {activeTab === 'fornecedores' ? (
                                    <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Marcas</label><input type="text" value={form.marcas} onChange={e => setForm({ ...form, marcas: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="Ex: Zomo, Nay..." /></div>
                                ) : (
                                    <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Endereço / Obs</label><input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="Ponto de referência..." /></div>
                                )}
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-9 rounded-[2.5rem] uppercase tracking-[0.5em] shadow-2xl hover:scale-102 active:scale-95 transition-all text-sm mt-8 border-none flex items-center justify-center gap-6">
                                {loading ? <RefreshCw className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                {editingItem ? 'SALVAR ALTERAÇÕES' : 'CONCLUIR CADASTRO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
