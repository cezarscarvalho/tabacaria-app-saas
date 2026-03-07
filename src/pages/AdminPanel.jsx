/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../core/supabaseClient';
import {
    Package, ClipboardList, LogOut, Truck, LayoutDashboard,
    MessageCircle, TrendingUp, RefreshCw, Users, Settings as SettingsIcon,
    Bell, Clock, Search, Zap, PackageOpen, Calculator, AlertCircle,
    Send, Store, CheckCircle2, X, Plus, Pencil, Trash2, ChevronDown,
    Printer, Inbox, ShieldAlert, HelpCircle, BookOpen, Lightbulb
} from 'lucide-react';

export default function AdminPanel({ onLogout }) {
    const [activeTab, setActiveTab] = useState('vendas');
    const [loading, setLoading] = useState(false);
    const [lastSync, setLastSync] = useState('--:--:--');

    // Estados de Dados
    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]); // Estoque
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
    const [form, setForm] = useState({
        nome: '', whatsapp: '', marcas: '', endereco: '',
        quantidade: '', preco_compra: '', preco_venda: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const [ords, msgs, clis, sups, cfgs, prods] = await Promise.all([
                supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
                supabase.from('mensagens').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('*').order('nome', { ascending: true }),
                supabase.from('fornecedores').select('*').order('nome', { ascending: true }),
                supabase.from('configuracoes').select('*').limit(1).single(),
                supabase.from('produtos').select('*').order('nome', { ascending: true })
            ]);
            setOrders(ords.data || []);
            setMessages(msgs.data || []);
            setClients(clis.data || []);
            setSuppliers(sups.data || []);
            if (cfgs.data) setSettings(cfgs.data);
            setProducts(prods.data || []);
            setLastSync(new Date().toLocaleTimeString());
        } catch (err) { console.error('Erro na sincronização:', err); }
        setLoading(false);
    };

    // --- LOGÍSTICA (ENVIAR/REMOVER) ---
    const toggleLogistics = async (id, currentStatus) => {
        try {
            const { error } = await supabase.from('pedidos').update({ enviado_logistica: !currentStatus }).eq('id', id);
            if (error) throw error;
            fetchAllData();
        } catch (err) { alert('Erro na logística.'); }
    };

    // --- STATUS DO PEDIDO + DEDUÇÃO DE ESTOQUE ---
    const updateOrderStatus = async (id, newStatus) => {
        try {
            // Se o status mudar para "Pago" ou "Enviado", podemos deduzir o estoque (Lógica de Giro)
            const order = orders.find(o => o.id === id);

            // Dedução de estoque simplificada se estiver marcando como "Pago" agora pela primeira vez
            if ((newStatus === 'Pago' || newStatus === 'Enviado') && order.situacao !== 'Pago' && order.situacao !== 'Enviado') {
                const parts = (order.status || '').split(' - ');
                if (parts.length >= 2) {
                    const itemsText = parts[1];
                    // Exemplo: "Produto A (10x), Produto B (5x)"
                    itemsText.split(', ').forEach(async (raw) => {
                        const match = raw.match(/(.+) \((\d+)[x| un]*\)/i) || raw.match(/^(\d+)[x| un]*\s+(.+)$/i);
                        if (match) {
                            const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                            const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]) || 1;

                            // Busca o produto no estado local para saber o ID e quantidade atual
                            const prod = products.find(p => p.nome.toLowerCase() === name.toLowerCase());
                            if (prod) {
                                await supabase.from('produtos').update({ quantidade: Math.max(0, prod.quantidade - qty) }).eq('id', prod.id);
                            }
                        }
                    });
                }
            }

            const { error } = await supabase.from('pedidos').update({ situacao: newStatus }).eq('id', id);
            if (error) throw error;
            fetchAllData();
        } catch (err) { alert('Erro no status.'); }
    };

    // --- IMPRESSÃO TÉRMICA ---
    const handlePrint = (order) => {
        setPrintingOrder(order);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // --- LÓGICA DE SALVAMENTO UNIFICADA ---
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        let table = '';
        if (activeTab === 'fornecedores') table = 'fornecedores';
        else if (activeTab === 'clientes') table = 'clientes';
        else if (activeTab === 'estoque') table = 'produtos';

        const payload = { nome: form.nome };
        if (activeTab === 'clientes') {
            payload.whatsapp = form.whatsapp;
            payload.endereco = form.endereco;
        }
        if (activeTab === 'fornecedores') {
            payload.whatsapp = form.whatsapp;
            payload.marcas = form.marcas;
        }
        if (activeTab === 'estoque') {
            payload.quantidade = parseInt(form.quantidade) || 0;
            payload.preco_compra = parseFloat(form.preco_compra) || 0;
            payload.preco_venda = parseFloat(form.preco_venda) || 0;
        }

        try {
            if (editingItem?.id) {
                await supabase.from(table).update(payload).eq('id', editingItem.id);
            } else {
                await supabase.from(table).insert([payload]);
            }
            setShowModal(false);
            setEditingItem(null);
            setForm({ nome: '', whatsapp: '', marcas: '', endereco: '', quantidade: '', preco_compra: '', preco_venda: '' });
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
            endereco: item.endereco || '',
            quantidade: item.quantidade?.toString() || '',
            preco_compra: item.preco_compra?.toString() || '',
            preco_venda: item.preco_venda?.toString() || ''
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

    // --- PARSER DE ITENS DO PEDIDO (Reusável) ---
    const parseOrderItems = (statusStr) => {
        const items = [];
        const parts = (statusStr || '').split(' - ');
        if (parts.length >= 2) {
            parts[1].split(', ').forEach(raw => {
                const match = raw.match(/(.+) \((\d+)[x| un]*\)/i) || raw.match(/^(\d+)[x| un]*\s+(.+)$/i);
                if (match) {
                    const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                    const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]) || 1;
                    items.push({ name, qty });
                }
            });
        }
        return items;
    };

    // --- ALERTA DE RUPTURA POR PEDIDO (Aba Vendas) ---
    const getOrderStockAlerts = (order) => {
        const items = parseOrderItems(order.status);
        const alerts = [];
        items.forEach(item => {
            const prod = products.find(p => p.nome.toLowerCase() === item.name.toLowerCase());
            const stockQty = prod ? prod.quantidade : 0;
            if (item.qty > stockQty) {
                alerts.push({ name: item.name, falta: item.qty - stockQty });
            }
        });
        return alerts;
    };

    // --- LOGÍSTICA PREMIUM + INTELIGÊNCIA DE ESTOQUE ---
    const logisticsData = useMemo(() => {
        const itemMap = {};
        let totalVolume = 0;
        orders.filter(o => o.enviado_logistica).forEach(order => {
            parseOrderItems(order.status).forEach(item => {
                itemMap[item.name] = (itemMap[item.name] || 0) + item.qty;
                totalVolume += item.qty;
            });
        });

        // Calcula Déficit (Inteligência de Reposição)
        const list = Object.entries(itemMap).map(([name, qty], idx) => {
            const prod = products.find(p => p.nome.toLowerCase() === name.toLowerCase());
            const stockQty = prod ? prod.quantidade : 0;
            const deficit = Math.max(0, qty - stockQty);
            return { id: `log-${idx}`, name, qty, stockQty, deficit };
        });

        // Ordena: déficit maior primeiro
        list.sort((a, b) => b.deficit - a.deficit);

        return { list, totalVolume };
    }, [orders, products]);

    // --- ESTOQUE ORDENADO (Zero/Negativo no topo) ---
    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => a.quantidade - b.quantidade);
    }, [products]);

    const selectedVolume = logisticsData.list.filter(i => selectedLogIds.includes(i.id)).reduce((acc, curr) => acc + curr.qty, 0);

    const handleSendLogistics = () => {
        const selected = logisticsData.list.filter(i => selectedLogIds.includes(i.id));
        const targetSup = suppliers.find(s => s.id === selectedSupplierId);
        if (!targetSup) return alert('Selecione um fornecedor!');
        let text = `*PEDIDO LOGÍSTICO - ${targetSup.nome.toUpperCase()}*%0A%0A`;
        selected.forEach(i => {
            text += `• ${i.name}: *${i.qty} un*`;
            if (i.deficit > 0) text += ` _(Déficit: ${i.deficit} un)_`;
            text += `%0A`;
        });
        window.open(`https://wa.me/${targetSup.whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await supabase.from('configuracoes').update(settings).eq('id', settings.id);
            alert('Configurações salvas!');
        } catch (err) { alert('Erro nas configurações.'); }
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
        { id: 'estoque', label: 'Estoque', icon: <Inbox size={18} /> },
        { id: 'mensagens', label: 'Suporte', icon: <MessageCircle size={18} />, badge: messages.filter(m => !m.lida).length },
        { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
        { id: 'fornecedores', label: 'Fornecedores', icon: <Store size={18} /> },
        { id: 'configuracoes', label: 'Configurações', icon: <SettingsIcon size={18} /> },
        { id: 'ajuda', label: 'Ajuda', icon: <HelpCircle size={18} /> }
    ];


    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col md:flex-row font-sans relative">
            {/* CSS DE IMPRESSÃO TÉRMICA */}
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
                            position: absolute; left: 0; top: 0; width: 80mm; padding: 4mm;
                            color: black !important; font-family: 'Courier New', Courier, monospace;
                        }
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
                {onLogout && (
                    <div className="p-6 border-t border-dark-700">
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all">
                            <LogOut size={16} /> Sair do Hub
                        </button>
                    </div>
                )}
            </aside>

            {/* Painel Principal */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative no-print">
                <header className="h-24 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-10 shadow-lg shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <span className="text-[8px] font-black text-neutral-500 uppercase block mt-1 tracking-widest italic tracking-widest">Sinc: {lastSync}</span>
                    </div>
                    <button onClick={fetchAllData} className="px-6 py-3.5 bg-primary text-dark-900 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Carregando...' : 'Sincronizar'}
                    </button>
                </header>

                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto pb-20">

                        {activeTab === 'vendas' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-2xl font-black text-white italic uppercase mb-8">Vendas Recebidas</h3>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <table className="w-full text-left font-bold border-collapse">
                                        <thead className="bg-dark-900 text-neutral-500 uppercase text-[10px]">
                                            <tr>
                                                <th className="p-8">🛒 Log</th>
                                                <th className="p-8">Cliente</th>
                                                <th className="p-8">Itens</th>
                                                <th className="p-8 text-center">Status</th>
                                                <th className="p-8 text-right">VALOR TOTAL (R$)</th>
                                                <th className="p-8 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {orders.map(o => {
                                                const stockAlerts = getOrderStockAlerts(o);
                                                return (
                                                    <tr key={o.id} className={`hover:bg-dark-700/30 transition-all ${stockAlerts.length > 0 ? 'bg-red-500/5' : o.enviado_logistica ? 'bg-primary/5' : ''}`}>
                                                        <td className="p-8">
                                                            <input type="checkbox" checked={o.enviado_logistica || false} onChange={() => toggleLogistics(o.id, o.enviado_logistica)} className="w-5 h-5 accent-primary cursor-pointer" />
                                                        </td>
                                                        <td className="p-8 text-white italic uppercase text-sm">{o.nome_cliente || 'Consumidor'}</td>
                                                        <td className="p-8">
                                                            <div className="text-neutral-400 text-[10px] italic leading-relaxed">{o.status}</div>
                                                            {stockAlerts.length > 0 && (
                                                                <div className="mt-3 space-y-1">
                                                                    {stockAlerts.map((a, i) => (
                                                                        <div key={i} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-wide">
                                                                            ⚠️ {a.name}: Faltam {a.falta} un
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-8 text-center">
                                                            <select value={o.situacao || 'Pendente'} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="bg-dark-900 border border-dark-600 rounded-xl px-3 py-2 text-[9px] font-black uppercase text-primary outline-none focus:border-primary transition-all">
                                                                <option value="Pendente">Pendente</option>
                                                                <option value="Pago">Pago</option>
                                                                <option value="Enviado">Enviado</option>
                                                                <option value="Cancelado">Cancelado</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-8 text-right text-primary font-black italic text-xl">
                                                            R$ {parseFloat(o.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="p-8 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => handlePrint(o)} className="p-3 bg-dark-700 rounded-xl hover:text-primary transition-all shadow-lg text-neutral-400"><Printer size={14} /></button>
                                                                <button onClick={() => handleDelete(o.id, 'pedidos')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all shadow-lg text-neutral-400"><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logistica' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white shadow-3xl p-10 rounded-[2.5rem] mb-12 border border-neutral-200 flex justify-between items-center flex-wrap gap-10">
                                    <div className="flex items-center gap-6"><PackageOpen size={36} className="text-neutral-500" /><h2 className="text-5xl font-black italic text-neutral-800 leading-none">Total Fila: <span className="text-primary">{logisticsData.totalVolume}</span></h2></div>
                                    <div className="flex items-center gap-6"><ShieldAlert size={36} className="text-red-500" /><h2 className="text-5xl font-black italic text-neutral-800 leading-none">Déficit: {logisticsData.list.reduce((acc, curr) => acc + curr.deficit, 0)}</h2></div>
                                </div>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden">
                                    <div className="p-8 bg-dark-900 border-b border-dark-700 flex justify-between items-center flex-wrap gap-4">
                                        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="bg-dark-700 p-4 rounded-xl text-white font-black text-[10px] uppercase outline-none border border-dark-600">
                                            <option value="">Selecione o Fornecedor</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                        <button onClick={handleSendLogistics} disabled={!selectedSupplierId || selectedLogIds.length === 0} className="bg-primary hover:bg-primary-hover text-dark-900 font-black px-12 py-5 rounded-2xl uppercase text-xs disabled:opacity-20 shadow-2xl shadow-primary/20 transition-all active:scale-95">Despachar Pedido</button>
                                    </div>
                                    <table className="w-full text-left font-bold border-collapse">
                                        <thead className="bg-dark-900 text-neutral-500 uppercase text-[10px]"><tr><th className="p-8">Sel</th><th className="p-8">Produto</th><th className="p-8 text-center">Fila</th><th className="p-8 text-center">Estoque</th><th className="p-8 text-right">Sugestão Compra</th></tr></thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {logisticsData.list.map(item => (
                                                <tr key={item.id} onClick={() => setSelectedLogIds(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])} className={`hover:bg-dark-700/50 cursor-pointer transition-all ${selectedLogIds.includes(item.id) ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-8"><div className={`w-8 h-8 border-2 rounded-xl flex items-center justify-center transition-all ${selectedLogIds.includes(item.id) ? 'bg-primary border-primary rotate-12 scale-110 shadow-lg' : 'border-dark-600'}`}>{selectedLogIds.includes(item.id) && <CheckCircle2 size={18} className="text-dark-900" />}</div></td>
                                                    <td className="p-8 text-white font-black uppercase italic text-2xl tracking-tighter">{item.name}</td>
                                                    <td className="p-8 text-center text-neutral-500">{item.qty} un</td>
                                                    <td className="p-8 text-center text-neutral-500">{item.stockQty} un</td>
                                                    <td className="p-8 text-right"><span className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase italic tracking-widest ${item.deficit > 0 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-dark-900 border-dark-700 text-neutral-500'}`}>{item.deficit > 0 ? `Comprar ${item.deficit}` : 'OK'}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'estoque' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-10 border-b border-dark-700 pb-8">
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Giro de Estoque</h3>
                                    <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '', quantidade: '', preco_compra: '', preco_venda: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-10 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all active:scale-95">+ Adicionar Produto</button>
                                </div>
                                <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <table className="w-full text-left font-bold border-collapse">
                                        <thead className="bg-dark-900 text-neutral-500 uppercase text-[10px]">
                                            <tr>
                                                <th className="p-8">Produto</th>
                                                <th className="p-8 text-center">Quantidade</th>
                                                <th className="p-8 text-right">Preço Compra</th>
                                                <th className="p-8 text-right">Preço Venda</th>
                                                <th className="p-8 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {sortedProducts.map(p => (
                                                <tr key={p.id} className={`hover:bg-dark-700/30 transition-all ${p.quantidade <= 0 ? 'bg-red-500/5' : ''}`}>
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-white italic uppercase text-lg">{p.nome}</span>
                                                            {p.quantidade <= 0 && <span className="bg-red-500/20 text-red-500 text-[8px] px-2 py-1 rounded-lg font-black uppercase animate-pulse">RUPTURA</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-center">
                                                        <span className={`px-4 py-2 rounded-xl text-lg font-black ${p.quantidade <= 0 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-dark-900 text-primary'}`}>{p.quantidade} un</span>
                                                    </td>
                                                    <td className="p-8 text-right text-neutral-500">{formatarMoeda(p.preco_compra)}</td>
                                                    <td className="p-8 text-right text-white text-xl italic">{formatarMoeda(p.preco_venda)}</td>
                                                    <td className="p-8 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleEdit(p)} className="p-3 bg-dark-700 rounded-xl hover:text-primary transition-all text-neutral-400 shadow-lg"><Pencil size={14} /></button>
                                                            <button onClick={() => handleDelete(p.id, 'produtos')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all text-neutral-400 shadow-lg"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
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
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clientes</h3>
                                        <div className="bg-dark-900 px-6 py-3.5 rounded-2xl flex items-center gap-4 border border-dark-700 cursor-pointer hover:border-primary transition-all group" onClick={() => setSelectedClientIds(selectedClientIds.length === clients.length ? [] : clients.map(c => c.id))}>
                                            <input type="checkbox" checked={selectedClientIds.length === clients.length} readOnly className="w-5 h-5 accent-primary" />
                                            <span className="text-[10px] font-black uppercase text-neutral-500 italic tracking-widest">Selecionar Todos</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {selectedClientIds.length > 0 && <button onClick={handleBulkCatalog} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all">WhatsApp em Massa ({selectedClientIds.length})</button>}
                                        <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '', quantidade: '', preco_compra: '', preco_venda: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-10 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all">+ Novo Cliente</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {clients.map(item => {
                                        const isSel = selectedClientIds.includes(item.id);
                                        return (
                                            <div key={item.id} className={`bg-dark-800 border-2 p-10 rounded-[3.5rem] relative group transition-all duration-300 ${isSel ? 'border-primary shadow-2xl shadow-primary/10' : 'border-dark-700'}`}>
                                                <div className="absolute top-10 left-10"><input type="checkbox" checked={isSel} onChange={() => setSelectedClientIds(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id])} className="w-6 h-6 accent-primary cursor-pointer" /></div>
                                                <div className="absolute top-10 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleEdit(item)} className="p-3 bg-dark-700 rounded-xl hover:text-primary transition-all"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDelete(item.id, 'clientes')} className="p-3 bg-dark-700 rounded-xl hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                                </div>
                                                <div className="mt-14 h-20 w-20 bg-dark-900 rounded-[2rem] flex items-center justify-center border border-dark-700 mb-8 group-hover:bg-primary/10 transition-all"><Users className="text-primary" size={32} /></div>
                                                <h4 className="text-3xl font-black text-white italic truncate uppercase mb-2 tracking-tighter">{item.nome}</h4>
                                                <p className="text-neutral-500 font-black text-[11px] uppercase tracking-[0.2em] mb-8">{item.whatsapp}</p>
                                                <button onClick={() => enviarCatalogo(item)} className="w-full py-5 bg-dark-900 hover:bg-primary text-neutral-500 hover:text-dark-900 border border-dark-700 hover:border-primary rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4"><MessageCircle size={16} /> Enviar Catálogo</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'fornecedores' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-12 border-b border-dark-700 pb-8">
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Parceiros</h3>
                                    <button onClick={() => { setEditingItem(null); setForm({ nome: '', whatsapp: '', marcas: '', endereco: '', quantidade: '', preco_compra: '', preco_venda: '' }); setShowModal(true); }} className="bg-primary text-dark-900 font-black px-12 py-5 rounded-[1.5rem] uppercase text-[10px] shadow-2xl transition-all">+ Novo Parceiro</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {suppliers.map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[3.5rem] relative group hover:border-primary/20 transition-all duration-300">
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
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-12">Suporte</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {messages.map(item => (
                                        <div key={item.id} className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[4rem] relative group">
                                            <div className="absolute top-10 right-10"><button onClick={() => handleDelete(item.id, 'mensagens')} className="p-4 bg-dark-700 rounded-2xl hover:text-red-500 transition-all shadow-xl"><Trash2 size={16} /></button></div>
                                            <div className="h-16 w-16 bg-dark-900 rounded-3xl flex items-center justify-center mb-8 text-primary border border-dark-700"><MessageCircle size={28} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase truncate mb-2">{item.nome || 'Consumidor'}</h4>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] block mb-8">{item.whatsapp || 'WhatsApp s/v'}</span>
                                            <p className="text-white font-bold bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] italic leading-relaxed text-lg uppercase shadow-2xl relative">
                                                "{item.conteudo || item.mensagem || item.texto}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'configuracoes' && (
                            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500 space-y-12">
                                {/* ── CONFIGURAÇÕES GERAIS ── */}
                                <form onSubmit={handleUpdateSettings} className="bg-dark-800 border-2 border-dark-700 rounded-[4rem] p-16 shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-12 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                                    <div className="space-y-8 relative z-10">
                                        <h4 className="text-primary uppercase text-[11px] font-black border-b-2 border-primary/20 pb-3 italic tracking-[0.3em]">Contato & WhatsApp</h4>
                                        <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">WhatsApp Suporte</label><input type="text" value={settings.whatsapp_suporte} onChange={e => setSettings({ ...settings, whatsapp_suporte: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary transition-all shadow-inner" /></div>
                                        <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Link Catálogo</label><input type="text" value={settings.link_catalogo} onChange={e => setSettings({ ...settings, link_catalogo: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary transition-all shadow-inner" /></div>
                                    </div>
                                    <div className="space-y-8 relative z-10">
                                        <h4 className="text-primary uppercase text-[11px] font-black border-b-2 border-primary/20 pb-3 italic tracking-[0.3em]">Automação</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Dia Alerta</label><select value={settings.dia_prospeccao} onChange={e => setSettings({ ...settings, dia_prospeccao: e.target.value })} className="w-full bg-dark-900 p-6 border-2 border-dark-700 rounded-2xl text-white font-bold italic appearance-none cursor-pointer outline-none focus:border-primary">{['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                            <div><label className="text-neutral-500 uppercase text-[10px] font-black mb-3 block italic tracking-widest">Horário</label><input type="time" value={settings.horario_prospeccao} onChange={e => setSettings({ ...settings, horario_prospeccao: e.target.value })} className="w-full bg-dark-900 p-6 border-2 border-dark-700 rounded-2xl text-white font-bold outline-none focus:border-primary" /></div>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="md:col-span-2 w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-7 rounded-[2.5rem] uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-sm mt-4 border-none flex items-center justify-center gap-4">
                                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} SALVAR CONFIGURAÇÕES
                                    </button>
                                </form>

                                {/* ── ALTERAR CREDENCIAIS ── */}
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const currentEmailInput = e.target.elements.currentEmail.value.trim();
                                    const newEmail = e.target.elements.newEmail.value.trim();
                                    const newPassword = e.target.elements.newPassword.value;

                                    if (!currentEmailInput) { alert('Preencha o e-mail atual para validação.'); return; }

                                    // Verifica se o e-mail atual está correto
                                    if (currentEmailInput !== settings.email_admin) {
                                        alert('⚠️ E-mail atual incorreto. A alteração foi bloqueada por segurança.');
                                        return;
                                    }

                                    const payload = {};
                                    if (newEmail) payload.email_admin = newEmail;
                                    if (newPassword) payload.senha_admin = newPassword;

                                    if (Object.keys(payload).length === 0) {
                                        alert('Preencha ao menos um campo para alterar (novo e-mail ou nova senha).');
                                        return;
                                    }

                                    setLoading(true);
                                    try {
                                        const { error } = await supabase.from('configuracoes').update(payload).eq('id', settings.id);
                                        if (error) throw error;

                                        // Atualiza localStorage se email mudou
                                        if (newEmail) {
                                            const stored = localStorage.getItem('tabacaria_admin_auth');
                                            if (stored) {
                                                const parsed = JSON.parse(stored);
                                                parsed.email = newEmail;
                                                localStorage.setItem('tabacaria_admin_auth', JSON.stringify(parsed));
                                            }
                                        }

                                        alert('✅ Credenciais alteradas com sucesso!');
                                        fetchAllData();
                                        e.target.reset();
                                    } catch (err) {
                                        alert('Erro ao alterar credenciais: ' + err.message);
                                    }
                                    setLoading(false);
                                }} className="bg-dark-800 border-2 border-red-500/20 rounded-[4rem] p-16 shadow-3xl space-y-10 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-64 h-64 bg-red-500/3 rounded-full blur-[80px] pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <h4 className="text-red-400 uppercase text-[11px] font-black border-b-2 border-red-500/20 pb-3 italic tracking-[0.3em] mb-8 flex items-center gap-3"><AlertCircle size={16} /> Alterar Credenciais de Acesso</h4>
                                        <p className="text-neutral-500 text-[10px] font-bold italic mb-8 uppercase tracking-widest">Para sua segurança, confirme o e-mail atual antes de alterar.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div>
                                                <label className="text-red-400 uppercase text-[10px] font-black mb-3 block italic tracking-[0.2em]">E-mail Atual *</label>
                                                <input name="currentEmail" type="email" required placeholder="Confirme o e-mail atual" className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-red-400 transition-all shadow-inner" />
                                            </div>
                                            <div>
                                                <label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-[0.2em]">Novo E-mail</label>
                                                <input name="newEmail" type="email" placeholder="novo@email.com" className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary transition-all shadow-inner" />
                                            </div>
                                            <div>
                                                <label className="text-primary uppercase text-[10px] font-black mb-3 block italic tracking-[0.2em]">Nova Senha</label>
                                                <input name="newPassword" type="password" placeholder="••••••••" className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl p-6 text-white font-bold outline-none focus:border-primary transition-all shadow-inner" />
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-red-500/10 hover:bg-red-500 border-2 border-red-500/30 hover:border-red-500 text-red-400 hover:text-white font-black py-7 rounded-[2.5rem] uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-4">
                                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <AlertCircle size={20} />} ALTERAR CREDENCIAIS
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'ajuda' && (
                            <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500 space-y-12">
                                {/* Título */}
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-[2rem] mb-6">
                                        <BookOpen size={36} className="text-primary" />
                                    </div>
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Manual de <span className="text-primary">Operação</span></h3>
                                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">Guia completo do sistema HubAdmin</p>
                                </div>

                                {/* ── MÓDULOS DO SISTEMA ── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Vendas */}
                                    <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-10 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all"><ClipboardList className="text-primary" size={24} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Vendas</h4>
                                        </div>
                                        <ul className="space-y-3 text-neutral-400 text-sm font-bold italic">
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Todos os pedidos do catálogo aparecem automaticamente nesta aba.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Use o <span className="text-white">dropdown de Status</span> para marcar como Pendente, Pago, Enviado ou Cancelado.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> O <span className="text-white">valor_total</span> é exibido em Reais (R$) ao lado de cada venda.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Use a <span className="text-white">checkbox</span> para enviar pedidos para a logística.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> A <span className="text-white">lixeira</span> exclui o pedido do banco de dados.</li>
                                            <li className="flex items-start gap-3"><AlertCircle size={14} className="text-red-400 mt-1 shrink-0" /> Itens com estoque insuficiente aparecem com <span className="text-red-400">alerta vermelho</span>.</li>
                                        </ul>
                                    </div>

                                    {/* Estoque */}
                                    <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-10 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all"><Inbox className="text-primary" size={24} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Estoque</h4>
                                        </div>
                                        <ul className="space-y-3 text-neutral-400 text-sm font-bold italic">
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Cadastre produtos com Nome, Preço de Compra e Preço de Venda.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> A dedução de estoque é automática quando o pedido é marcado como <span className="text-white">Pago</span> ou <span className="text-white">Enviado</span>.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Produtos com <span className="text-red-400">saldo zero ou negativo</span> ficam no topo da lista com badge RUPTURA.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> A venda <span className="text-white">nunca é bloqueada</span> por falta de estoque — apenas alertada.</li>
                                        </ul>
                                    </div>

                                    {/* Logística */}
                                    <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-10 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all"><Truck className="text-primary" size={24} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Logística</h4>
                                        </div>
                                        <ul className="space-y-3 text-neutral-400 text-sm font-bold italic">
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Marque pedidos com a checkbox "Enviar para Logística" na aba Vendas.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> O sistema calcula automaticamente o <span className="text-white">déficit de reposição</span> (pedido − estoque).</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Selecione um fornecedor e clique <span className="text-white">Despachar Pedido</span> para enviar via WhatsApp.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Itens com déficit são ordenados primeiro e marcados com <span className="text-red-400">Comprar X</span>.</li>
                                        </ul>
                                    </div>

                                    {/* Prospecção */}
                                    <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-10 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all"><Send className="text-primary" size={24} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Prospecção</h4>
                                        </div>
                                        <ul className="space-y-3 text-neutral-400 text-sm font-bold italic">
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Na aba Clientes, selecione um ou mais clientes para envio em massa do catálogo.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> O link do catálogo é enviado automaticamente via WhatsApp (configurável em Configurações).</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Configure o <span className="text-white">Dia</span> e <span className="text-white">Horário</span> de prospecção na aba Configurações.</li>
                                        </ul>
                                    </div>

                                    {/* Impressão Térmica */}
                                    <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-10 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all"><Printer className="text-primary" size={24} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Impressão</h4>
                                        </div>
                                        <ul className="space-y-3 text-neutral-400 text-sm font-bold italic">
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Clique no ícone da <span className="text-white">impressora</span> ao lado de cada venda.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> O recibo é otimizado para bobinas de <span className="text-white">80mm</span> (térmica).</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> O layout esconde todos os menus e mostra apenas o recibo formatado.</li>
                                        </ul>
                                    </div>

                                    {/* Configurações & Segurança */}
                                    <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] p-10 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all"><SettingsIcon className="text-primary" size={24} /></div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Segurança</h4>
                                        </div>
                                        <ul className="space-y-3 text-neutral-400 text-sm font-bold italic">
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> A aba Configurações permite alterar WhatsApp, Link do Catálogo e Automação.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> Para alterar credenciais, confirme o <span className="text-white">e-mail atual</span> antes.</li>
                                            <li className="flex items-start gap-3"><CheckCircle2 size={14} className="text-primary mt-1 shrink-0" /> O login expira em <span className="text-white">24 horas</span>. Use "Sair do Hub" para encerrar a sessão.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* ── RESOLUÇÃO DE PROBLEMAS ── */}
                                <div className="bg-dark-800 border-2 border-red-500/10 rounded-[3rem] p-12 mt-4">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center"><Lightbulb className="text-red-400" size={24} /></div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Resolução de Problemas</h4>
                                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Dicas rápidas para situações comuns</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
                                            <h5 className="text-primary font-black text-sm uppercase italic mb-3">💰 Valor da venda aparece zerado?</h5>
                                            <p className="text-neutral-400 text-sm font-bold italic leading-relaxed">Verifique se o campo <span className="text-white">valor_total</span> está preenchido no banco de dados. O sistema busca especificamente esse campo.</p>
                                        </div>
                                        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
                                            <h5 className="text-primary font-black text-sm uppercase italic mb-3">🛒 Carrinho não limpa após a compra?</h5>
                                            <p className="text-neutral-400 text-sm font-bold italic leading-relaxed">O carrinho é limpo automaticamente após o envio. Se não limpar, recarregue a página do catálogo.</p>
                                        </div>
                                        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
                                            <h5 className="text-primary font-black text-sm uppercase italic mb-3">🖨️ Impressão sai em branco?</h5>
                                            <p className="text-neutral-400 text-sm font-bold italic leading-relaxed">Certifique-se de que a impressora está configurada para <span className="text-white">80mm</span>. Desative margens nas configurações de impressão do navegador.</p>
                                        </div>
                                        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
                                            <h5 className="text-primary font-black text-sm uppercase italic mb-3">📦 Estoque não deduz automaticamente?</h5>
                                            <p className="text-neutral-400 text-sm font-bold italic leading-relaxed">A dedução só ocorre quando o status muda para <span className="text-white">Pago</span> ou <span className="text-white">Enviado</span> pela primeira vez.</p>
                                        </div>
                                        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
                                            <h5 className="text-primary font-black text-sm uppercase italic mb-3">🔑 Esqueci as credenciais do Admin?</h5>
                                            <p className="text-neutral-400 text-sm font-bold italic leading-relaxed">Use o link <span className="text-white">"Esqueci minha senha"</span> na tela de login. O sistema envia um link de recuperação por e-mail.</p>
                                        </div>
                                        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
                                            <h5 className="text-primary font-black text-sm uppercase italic mb-3">📲 WhatsApp não abre?</h5>
                                            <p className="text-neutral-400 text-sm font-bold italic leading-relaxed">Verifique se o número do cliente/fornecedor está no formato <span className="text-white">55XXXXXXXXXXX</span> (DDI + DDD + Número) sem espaços.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* RECIBO TÉRMICO OCULTO */}
            {printingOrder && (
                <div id="print-receipt-section">
                    <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 5px 0' }}>TABACARIA HUB</h1>
                        <p style={{ fontSize: '12px', margin: '0', letterSpacing: '2px' }}>MODERNA • PREMIUM • ELITE</p>
                    </div>
                    <div style={{ marginBottom: '15px', fontSize: '13px', lineHeight: '1.5' }}>
                        <p><strong>DATA:</strong> {new Date(printingOrder.created_at).toLocaleString('pt-BR')}</p>
                        <p><strong>CLIENTE:</strong> {printingOrder.nome_cliente?.toUpperCase()}</p>
                    </div>
                    <div style={{ borderTop: '1px dashed black', paddingTop: '10px', marginBottom: '10px' }}>
                        <p style={{ fontWeight: '900', fontSize: '14px', marginBottom: '10px' }}>PEDIDO:</p>
                        <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{printingOrder.status?.split('-')[1]?.trim()}</div>
                    </div>
                    <div style={{ textAlign: 'right', borderTop: '2px solid black', paddingTop: '12px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '900' }}>TOTAL: {formatarMoeda(printingOrder.valor_total)}</h2>
                    </div>
                </div>
            )}

            {/* MODAL UNIFICADO (EDITE TODOS OS MODOS AQUI) */}
            {showModal && (
                <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-8 animate-in fade-in modal-backdrop">
                    <div className="bg-dark-800 border-4 border-dark-700 w-full max-w-2xl rounded-[4rem] p-14 shadow-3xl relative animate-in zoom-in-95">
                        <button onClick={() => setShowModal(false)} className="absolute top-12 right-12 p-4 bg-dark-700 rounded-2xl text-neutral-500 hover:text-white transition-all"><X size={24} /></button>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-12 border-l-8 border-primary pl-6 leading-none">{editingItem ? 'Editar' : 'Novo'} {activeTab === 'fornecedores' ? 'Fornecedor' : activeTab === 'estoque' ? 'Produto' : 'Cliente'}</h2>
                        <form onSubmit={handleSave} className="space-y-10">
                            <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Identificação</label><input required type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value.toUpperCase() })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black italic focus:border-primary outline-none shadow-inner uppercase text-lg" /></div>

                            {activeTab === 'estoque' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Quantidade</label><input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="0" /></div>
                                    <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Preço Compra</label><input type="number" step="0.01" value={form.preco_compra} onChange={e => setForm({ ...form, preco_compra: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="0.00" /></div>
                                    <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Preço Venda</label><input type="number" step="0.01" value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="0.00" /></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">WhatsApp</label><input required type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner tracking-widest" placeholder="5511..." /></div>
                                    {activeTab === 'fornecedores' ? (
                                        <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Marcas</label><input type="text" value={form.marcas} onChange={e => setForm({ ...form, marcas: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="Zomo, Nay..." /></div>
                                    ) : (
                                        <div><label className="text-primary uppercase text-[11px] font-black mb-4 block italic tracking-[0.3em]">Endereço / Obs</label><input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="w-full bg-dark-900 border-2 border-dark-700 rounded-[1.5rem] p-7 text-white font-black focus:border-primary outline-none shadow-inner" placeholder="..." /></div>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-9 rounded-[2.5rem] uppercase tracking-[0.5em] shadow-2xl transition-all hover:scale-102 active:scale-95 text-sm mt-8 border-none flex items-center justify-center gap-6">
                                {loading ? <RefreshCw className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                {editingItem ? 'ATUALIZAR DADOS' : 'FINALIZAR CADASTRO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
