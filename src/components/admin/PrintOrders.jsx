import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Printer, Calendar, Search, Filter } from 'lucide-react';

export default function PrintOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);

    // Print State
    const [ordersToPrint, setOrdersToPrint] = useState([]);

    useEffect(() => {
        fetchOrders();
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
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        const validPrice = typeof price === 'number' ? price : parseFloat(price);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(isNaN(validPrice) ? 0 : validPrice);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Helper to extract Name and Status from the new combined string
    const extractOrderInfo = (statusString) => {
        if (!statusString) return { badgeStatus: 'Novo Pedido', customerName: 'Desconhecido', itemsText: '' };

        let badgeStatus = 'Novo Pedido';
        let remaining = statusString;

        const knownStatuses = ['Novo Pedido', 'Pendente', 'Entregue', 'Cancelado', 'Impresso', 'Finalizado'];
        for (const ks of knownStatuses) {
            if (remaining.startsWith(`${ks} - `)) {
                badgeStatus = ks;
                remaining = remaining.substring(ks.length + 3); // len + ' - '
                break;
            }
        }

        // New format: "Confirmado pelo cliente: [Nome] - [Items]"
        if (remaining.startsWith('Confirmado pelo cliente: ')) {
            const content = remaining.substring('Confirmado pelo cliente: '.length);
            const [name, ...rest] = content.split(' - ');
            return {
                badgeStatus: 'Confirmado',
                customerName: name || 'Desconhecido',
                itemsText: rest.join(' - ') || ''
            };
        }

        // Old formats
        let customerName = 'Desconhecido';
        let itemsText = remaining;

        const clienteMatch = remaining.match(/Cliente: (.*?)( - Itens: (.*))?$/);
        if (clienteMatch) {
            customerName = clienteMatch[1];
            itemsText = clienteMatch[3] || '';
        }

        return { badgeStatus, customerName, itemsText };
    };

    const handlePrintOne = (order) => {
        setOrdersToPrint([order]);
        // Wait for React to render the printable area before calling print window
        setTimeout(() => {
            window.print();
            // Optional: Auto update status to Impresso
            // handleStatusChange(order.id, 'Impresso', order.status);
            setOrdersToPrint([]); // Clear after print dialog closes
        }, 300);
    };

    const handlePrintBatch = () => {
        const selectedOrders = orders.filter(o => selectedIds.includes(o.id));
        if (selectedOrders.length === 0) return;

        setOrdersToPrint(selectedOrders);
        setTimeout(() => {
            window.print();
            setOrdersToPrint([]);
            setSelectedIds([]); // Clear selection after printing
        }, 300);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredOrders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredOrders.map(o => o.id));
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const info = extractOrderInfo(order.status);

        // Search Filter (by Customer Name or part of string)
        const matchesSearch = info.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.status && order.status.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status Filter
        const matchesStatus = filterStatus === '' || info.badgeStatus === filterStatus;

        // Month Filter
        let matchesMonth = true;
        if (filterMonth) {
            const orderDate = new Date(order.created_at);
            const orderMonthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            matchesMonth = orderMonthStr === filterMonth;
        }

        return matchesSearch && matchesStatus && matchesMonth;
    });

    // Unique options for Month Filter
    const availableMonths = [...new Set(orders.map(o => {
        const d = new Date(o.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))].sort((a, b) => b.localeCompare(a)); // Descending

    const formatMonthSelect = (val) => {
        if (!val) return '';
        const [year, month] = val.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
    };

    return (
        <div className="animate-in fade-in duration-300">
            {/* UI Visible on Screen (hidden in print via index.css) */}
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
                        <div className="flex items-center gap-4 animate-in slide-in-from-right duration-300">
                            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                {selectedIds.length} {selectedIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}
                            </span>
                            <button
                                onClick={handlePrintBatch}
                                className="bg-primary hover:bg-primary-hover text-dark-900 font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all transform active:scale-95"
                            >
                                <Printer size={20} />
                                Imprimir Selecionados
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters Row */}
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-primary transition-colors text-sm"
                        />
                    </div>

                    <div className="sm:w-48 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-primary transition-colors text-sm appearance-none cursor-pointer"
                        >
                            <option value="">Todos os Status</option>
                            <option value="Novo Pedido">Novo Pedido</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Impresso">Impresso</option>
                            <option value="Entregue">Entregue</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>

                    <div className="sm:w-48 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-primary transition-colors text-sm appearance-none cursor-pointer capitalize"
                        >
                            <option value="">Filtro de Mês</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonthSelect(m)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Orders List for Printing */}
                <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-dark-900/50 border-b border-dark-700 text-sm font-semibold text-neutral-400">
                                    <th className="py-4 px-6 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-primary focus:ring-primary focus:ring-offset-dark-800"
                                        />
                                    </th>
                                    <th className="py-4 px-6 w-20">ID</th>
                                    <th className="py-4 px-6 w-40">Data</th>
                                    <th className="py-4 px-6">Cliente</th>
                                    <th className="py-4 px-6 w-32">Valor</th>
                                    <th className="py-4 px-6 w-36">Status</th>
                                    <th className="py-4 px-6 w-32 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {loading && orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-neutral-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                                <p>Carregando pedidos...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-neutral-500">
                                            Nenhum pedido encontrado com estes filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => {
                                        const { badgeStatus, customerName } = extractOrderInfo(order.status);
                                        const isSelected = selectedIds.includes(order.id);
                                        return (
                                            <tr key={order.id} className={`hover:bg-dark-700/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                                                <td className="py-3 px-6 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectOne(order.id)}
                                                        className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-primary focus:ring-primary focus:ring-offset-dark-800"
                                                    />
                                                </td>
                                                <td className="py-3 px-6 text-sm text-neutral-500 font-medium">#{order.id}</td>
                                                <td className="py-3 px-6 text-sm text-neutral-300">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="py-3 px-6 font-medium text-white">
                                                    {customerName}
                                                </td>
                                                <td className="py-3 px-6 font-bold text-emerald-400">
                                                    {formatPrice(order.valor_total)}
                                                </td>
                                                <td className="py-3 px-6">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg ${badgeStatus === 'Novo Pedido' ? 'bg-amber-500/10 text-amber-400' :
                                                        badgeStatus === 'Impresso' ? 'bg-purple-500/10 text-purple-400' :
                                                            badgeStatus === 'Entregue' || badgeStatus === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                badgeStatus === 'Cancelado' ? 'bg-red-500/10 text-red-400' :
                                                                    'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                        {badgeStatus}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <button
                                                        onClick={() => handlePrintOne(order)}
                                                        className="px-4 py-2 bg-dark-700 hover:bg-dark-600 hover:text-white border border-dark-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                                                    >
                                                        <Printer size={16} className="text-primary" />
                                                        Imprimir
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
                    {ordersToPrint.map((order, index) => (
                        <div key={order.id} className="receipt-item">
                            <div style={{ padding: '10px 0', borderBottom: '1px dashed #000', marginBottom: '10px', textAlign: 'center' }}>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>TABACARIA SAAS</h2>
                                <p style={{ margin: 0, fontSize: '12px' }}>Pedido #{order.id}</p>
                                <p style={{ margin: 0, fontSize: '12px' }}>{formatDate(order.created_at)}</p>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ margin: '2px 0', fontSize: '14px', fontWeight: 'bold' }}>Cliente:</p>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    {extractOrderInfo(order.status).customerName.toUpperCase()}
                                </p>
                            </div>

                            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', marginBottom: '10px' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>ITENS DO PEDIDO</p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', lineHeight: '1.4' }}>
                                    {extractOrderInfo(order.status).itemsText.split(', ').map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '4px' }}>- {item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>TOTAL:</span>
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatPrice(order.valor_total)}</span>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
                                <p>Obrigado pela preferência!</p>
                                <p>*** VOLTE SEMPRE ***</p>
                            </div>

                            {/* Visual guide for cutting if multiple in same print stream */}
                            {index < ordersToPrint.length - 1 && (
                                <div style={{ borderTop: '1px dashed #ccc', margin: '30px 0', height: '1px' }}></div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
