import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Printer, Calendar, Search, Filter, AlertTriangle } from 'lucide-react';

export default function PrintOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renderError, setRenderError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);

    // Print State
    const [ordersToPrint, setOrdersToPrint] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                await fetchOrders();
            } catch (err) {
                console.error("Critical error loading orders:", err);
                setRenderError(err.message);
            }
        };
        load();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Erro ao buscar pedidos para impressão:', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        try {
            const validPrice = typeof price === 'number' ? price : parseFloat(price);
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(isNaN(validPrice) ? 0 : validPrice);
        } catch (e) {
            return 'R$ 0,00';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return '-';
        }
    };

    const extractOrderInfo = (statusString) => {
        const fallback = { badgeStatus: 'Novo Pedido', customerName: 'Desconhecido', storeName: '', itemsText: '' };
        if (!statusString || typeof statusString !== 'string') return fallback;

        try {
            let badgeStatus = 'Novo Pedido';
            let remaining = statusString;

            const knownStatuses = ['Novo Pedido', 'Pendente', 'Entregue', 'Cancelado', 'Impresso', 'Finalizado'];
            for (const ks of knownStatuses) {
                if (remaining.startsWith(`${ks} - `)) {
                    badgeStatus = ks;
                    remaining = remaining.substring(ks.length + 3);
                    break;
                }
            }

            // New robust tokenization instead of strict regex
            if (remaining.includes('Confirmado pelo cliente')) {
                let store = '';
                let resp = '';
                let items = '';

                if (remaining.includes('| Loja:')) {
                    const parts = remaining.split('|');
                    parts.forEach(p => {
                        const trimP = p.trim();
                        if (trimP.startsWith('Loja:')) store = trimP.replace('Loja:', '').trim();
                        if (trimP.startsWith('Resp:')) {
                            // Resp often has the items appended after a dash: "Resp: Name - Item1, Item2"
                            const respContent = trimP.replace('Resp:', '').trim();
                            const dashIndex = respContent.indexOf(' - ');
                            if (dashIndex !== -1) {
                                resp = respContent.substring(0, dashIndex).trim();
                                items = respContent.substring(dashIndex + 3).trim();
                            } else {
                                resp = respContent;
                            }
                        }
                    });
                } else if (remaining.includes('Confirmado pelo cliente:')) {
                    // Legacy 2nd gen format: "Confirmado pelo cliente: Name - Items"
                    const content = remaining.split('Confirmado pelo cliente:')[1].trim();
                    const dashIdx = content.indexOf(' - ');
                    if (dashIdx !== -1) {
                        resp = content.substring(0, dashIdx).trim();
                        items = content.substring(dashIdx + 3).trim();
                    } else {
                        resp = content;
                    }
                }

                return {
                    badgeStatus: badgeStatus === 'Novo Pedido' ? 'Confirmado' : badgeStatus,
                    storeName: store || '',
                    customerName: resp || 'Desconhecido',
                    itemsText: items || ''
                };
            }

            // Old legacy formats
            let customerName = 'Desconhecido';
            let itemsText = remaining;

            if (remaining.includes('Cliente:')) {
                const parts = remaining.split('Cliente:')[1].split(' - Itens:');
                customerName = (parts[0] || '').trim();
                itemsText = (parts[1] || '').trim();
            }

            return { badgeStatus, customerName: customerName || 'Desconhecido', storeName: '', itemsText: itemsText || '' };
        } catch (e) {
            console.error("Error parsing status string:", statusString, e);
            return fallback;
        }
    };

    // Memoize options to prevent unnecessary re-calculatios that could trigger rendering loops
    const availableMonths = useMemo(() => {
        try {
            const months = orders
                .filter(o => o?.created_at)
                .map(o => {
                    const d = new Date(o.created_at);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                });
            return [...new Set(months)].sort((a, b) => b.localeCompare(a));
        } catch (e) {
            return [];
        }
    }, [orders]);

    const filteredOrders = useMemo(() => {
        try {
            return orders.filter(order => {
                if (!order) return false;
                const info = extractOrderInfo(order.status);
                const sTerm = (searchTerm || '').toLowerCase();

                const matchesSearch =
                    (info.customerName || '').toLowerCase().includes(sTerm) ||
                    (info.storeName || '').toLowerCase().includes(sTerm) ||
                    (order.status || '').toLowerCase().includes(sTerm);

                const matchesStatus = filterStatus === '' || info.badgeStatus === filterStatus;

                let matchesMonth = true;
                if (filterMonth && order.created_at) {
                    const orderDate = new Date(order.created_at);
                    const orderMonthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                    matchesMonth = orderMonthStr === filterMonth;
                }

                return matchesSearch && matchesStatus && matchesMonth;
            });
        } catch (e) {
            console.error("Filter logic error:", e);
            return [];
        }
    }, [orders, searchTerm, filterStatus, filterMonth]);

    const handlePrintOne = (order) => {
        setOrdersToPrint([order]);
        setTimeout(() => {
            window.print();
            setOrdersToPrint([]);
        }, 300);
    };

    const handlePrintBatch = () => {
        const selectedOrders = orders.filter(o => selectedIds.includes(o.id));
        if (selectedOrders.length === 0) return;
        setOrdersToPrint(selectedOrders);
        setTimeout(() => {
            window.print();
            setOrdersToPrint([]);
            setSelectedIds([]);
        }, 300);
    };

    if (renderError) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar aba de impressão</h2>
                <p className="text-neutral-400 mb-6">{renderError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                    Recarregar Página
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="no-print">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Printer className="text-primary" />
                            Impressão de Pedidos
                        </h1>
                        <p className="text-neutral-400 text-sm mt-1">Gere cupons não fiscais para impressora térmica</p>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-4 scale-in-center">
                            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                {selectedIds.length} selecionado(s)
                            </span>
                            <button
                                onClick={handlePrintBatch}
                                className="bg-primary hover:bg-primary-hover text-dark-900 font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg"
                            >
                                <Printer size={20} />
                                Imprimir Lote
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white text-sm outline-none"
                    >
                        <option value="">Status</option>
                        {['Novo Pedido', 'Pendente', 'Impresso', 'Entregue', 'Finalizado', 'Cancelado'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white text-sm outline-none"
                    >
                        <option value="">Mês</option>
                        {availableMonths.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-dark-900/50 border-b border-dark-700 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    <th className="py-4 px-6 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                                            onChange={() => {
                                                if (selectedIds.length === filteredOrders.length) setSelectedIds([]);
                                                else setSelectedIds(filteredOrders.map(o => o.id));
                                            }}
                                            className="accent-primary"
                                        />
                                    </th>
                                    <th className="py-4 px-6 w-20">ID</th>
                                    <th className="py-4 px-6">Cliente / Loja</th>
                                    <th className="py-4 px-6 w-32">Valor</th>
                                    <th className="py-4 px-6 w-32 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-neutral-500">Carregando...</td></tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-neutral-500">Nenhum pedido encontrado.</td></tr>
                                ) : (
                                    filteredOrders.map(order => {
                                        const info = extractOrderInfo(order.status);
                                        return (
                                            <tr key={order.id} className="hover:bg-dark-700/30 transition-colors">
                                                <td className="py-3 px-6 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(order.id)}
                                                        onChange={() => {
                                                            if (selectedIds.includes(order.id)) setSelectedIds(selectedIds.filter(id => id !== order.id));
                                                            else setSelectedIds([...selectedIds, order.id]);
                                                        }}
                                                        className="accent-primary"
                                                    />
                                                </td>
                                                <td className="py-3 px-6 text-sm text-neutral-500 font-medium">#{order.id}</td>
                                                <td className="py-3 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white leading-tight">
                                                            {info.storeName || 'Venda Direta'}
                                                        </span>
                                                        <span className="text-xs text-neutral-400">
                                                            Resp: {info.customerName || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 font-bold text-emerald-400">
                                                    {formatPrice(order.valor_total)}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <button
                                                        onClick={() => handlePrintOne(order)}
                                                        className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-primary transition-colors inline-flex"
                                                        title="Imprimir"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Hidden Printable Area */}
            {ordersToPrint.length > 0 && (
                <div id="print-area">
                    {ordersToPrint.map((order, index) => {
                        const info = extractOrderInfo(order.status);
                        return (
                            <div key={order.id} className="receipt-item" style={{ color: '#000', backgroundColor: '#fff', padding: '10px' }}>
                                <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px', textAlign: 'center' }}>
                                    <h2 style={{ margin: '0', fontSize: '18px' }}>TABACARIA SAAS</h2>
                                    <p style={{ margin: '0', fontSize: '12px' }}>Pedido #{order.id} - {formatDate(order.created_at)}</p>
                                </div>

                                <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                                    <p style={{ margin: '0' }}><strong>LOJA:</strong> {(info.storeName || 'VENDA DIRETA').toUpperCase()}</p>
                                    <p style={{ margin: '0' }}><strong>RESP:</strong> {(info.customerName || 'N/A').toUpperCase()}</p>
                                </div>

                                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', marginBottom: '10px', fontSize: '12px' }}>
                                    <strong>ITENS:</strong>
                                    <p style={{ margin: '5px 0 0 0', lineHeight: '1.4' }}>{info.itemsText || 'Sem detalhes'}</p>
                                </div>

                                <div style={{ textAlign: 'right', fontSize: '16px' }}>
                                    <strong>TOTAL: {formatPrice(order.valor_total)}</strong>
                                </div>

                                {index < ordersToPrint.length - 1 && <div style={{ pageBreakAfter: 'always' }} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
