import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Package, ShoppingCart, Send, ArrowUpDown, Filter, CheckCircle2 } from 'lucide-react';
import { formatarNumeroWhats } from '../../utils/whatsapp';

export default function Logistics() {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [consolidatedItems, setConsolidatedItems] = useState([]);
    const [sortOrder, setSortOrder] = useState('name'); // name, qty
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Suppliers
            const { data: sups, error: errSups } = await supabase
                .from('fornecedores')
                .select('*')
                .order('nome', { ascending: true });

            if (errSups) throw errSups;
            setSuppliers(sups || []);

            // 2. Fetch Confirmed Orders
            const { data: ords, error: errOrds } = await supabase
                .from('pedidos')
                .select('*')
                .ilike('status', '%Confirmado%')
                .not('status', 'ilike', '%Pedido ao Fornecedor Realizado%');

            if (errOrds) throw errOrds;
            setOrders(ords || []);

            consolidateOrders(ords || []);
        } catch (error) {
            console.error('Erro ao buscar dados de logística:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const consolidateOrders = (orderList) => {
        const itemMap = {};

        orderList.forEach(order => {
            // Status format: "Confirmado pelo cliente | Loja: [Store] | Resp: [Name] - [Item1 (2x), Item2 (1x)...]"
            const itemPart = order.status.split(' - ')[1];
            if (!itemPart) return;

            const items = itemPart.split(', ');
            items.forEach(itemStr => {
                // Item format: "Produto Name (2x)"
                const match = itemStr.match(/(.+) \((\d+)x\)/);
                if (match) {
                    const name = match[1].trim();
                    const qty = parseInt(match[2]);

                    if (itemMap[name]) {
                        itemMap[name] += qty;
                    } else {
                        itemMap[name] = qty;
                    }
                }
            });
        });

        const list = Object.entries(itemMap).map(([name, qty]) => ({ name, qty }));
        setConsolidatedItems(list);
    };

    const sortedItems = [...consolidatedItems].sort((a, b) => {
        if (sortOrder === 'name') return a.name.localeCompare(b.name);
        return b.qty - a.qty;
    });

    const handleSendToSupplier = async () => {
        if (!selectedSupplier) {
            alert('Por favor, selecione um fornecedor.');
            return;
        }

        const supplier = suppliers.find(s => s.id === parseInt(selectedSupplier));
        if (!supplier?.whatsapp) {
            alert('Este fornecedor não possui WhatsApp cadastrado.');
            return;
        }

        setIsUpdating(true);
        try {
            // 1. Format Message
            let text = `*PEDIDO DE REPOSIÇÃO - TABACARIA*%0A%0A`;
            sortedItems.forEach((item, index) => {
                text += `${index + 1}. ${item.name} - ${item.qty} unidades%0A`;
            });

            let phone = formatarNumeroWhats(supplier.whatsapp);

            if (!phone) {
                const manualPhone = prompt('Este fornecedor não possui WhatsApp válido cadastrado. Por favor, digite o número (com DDD):');
                if (!manualPhone) {
                    setIsUpdating(false);
                    return;
                }
                phone = formatarNumeroWhats(manualPhone);
            }

            const whatsappUrl = `https://wa.me/${phone}?text=${text}`;

            // 2. Update status of the orders included in this batch
            const orderIds = orders.map(o => o.id);
            if (orderIds.length > 0) {
                // We append " | Pedido ao Fornecedor Realizado" to the status
                for (const order of orders) {
                    const newStatus = `${order.status} | Pedido ao Fornecedor Realizado`;
                    await supabase
                        .from('pedidos')
                        .update({ status: newStatus })
                        .eq('id', order.id);
                }
            }

            // 3. Open WhatsApp
            window.open(whatsappUrl, '_blank');

            setSuccessMessage('Pedido enviado e status atualizados com sucesso!');
            setTimeout(() => {
                setSuccessMessage('');
                fetchInitialData(); // Refresh
            }, 3000);

        } catch (error) {
            console.error('Erro ao processar envio ao fornecedor:', error.message);
            alert('Ocorreu um erro ao atualizar os pedidos.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Logística & Reposição</h1>
                    <p className="text-neutral-400 text-sm mt-1">Consolidação de pedidos confirmados para fornecedores</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="flex-1 sm:w-64 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-all text-sm appearance-none cursor-pointer shadow-lg"
                    >
                        <option value="">Selecionar Fornecedor...</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSendToSupplier}
                        disabled={consolidatedItems.length === 0 || isUpdating}
                        className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-dark-900 font-black py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20 whitespace-nowrap"
                    >
                        {isUpdating ? (
                            <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>Enviar Reposição</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{successMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Consolidated List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-dark-700 bg-dark-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <Package className="text-primary" size={20} />
                                </div>
                                <h2 className="font-bold text-white">Itens Consolidados</h2>
                            </div>

                            <button
                                onClick={() => setSortOrder(sortOrder === 'name' ? 'qty' : 'name')}
                                className="text-neutral-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                <ArrowUpDown size={14} />
                                Order: {sortOrder === 'name' ? 'A-Z' : 'Qtd'}
                            </button>
                        </div>

                        <div className="divide-y divide-dark-700 max-h-[600px] overflow-y-auto no-scrollbar">
                            {loading ? (
                                <div className="py-20 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-neutral-500 text-sm">Calculando quantidades...</p>
                                </div>
                            ) : sortedItems.length === 0 ? (
                                <div className="py-20 text-center">
                                    <ShoppingCart className="mx-auto text-neutral-600 mb-4" size={48} />
                                    <p className="text-neutral-400 font-medium">Nenhum pedido confirmado para consolidar.</p>
                                </div>
                            ) : (
                                sortedItems.map((item, idx) => (
                                    <div key={idx} className="p-4 hover:bg-dark-700/30 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-neutral-600 w-5">{idx + 1}</span>
                                            <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">{item.name}</span>
                                        </div>
                                        <div className="bg-dark-900 px-4 py-1.5 rounded-lg border border-dark-700">
                                            <span className="text-primary font-black">{item.qty}</span>
                                            <span className="text-[10px] text-neutral-500 font-bold ml-1 uppercase">un</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary / Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl border border-dark-700 p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={20} />
                            Resumo da Operação
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-dark-900/50 rounded-xl border border-dark-700">
                                <span className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Pedidos Pendentes</span>
                                <span className="text-2xl font-black text-white">{orders.length}</span>
                            </div>

                            <div className="p-4 bg-dark-900/50 rounded-xl border border-dark-700">
                                <span className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total de Itens</span>
                                <span className="text-2xl font-black text-primary">
                                    {consolidatedItems.reduce((acc, curr) => acc + curr.qty, 0)}
                                </span>
                            </div>

                            <div className="pt-4 mt-4 border-t border-dark-700">
                                <p className="text-[10px] text-neutral-500 leading-relaxed uppercase font-bold text-center">
                                    Ao clicar em "Enviar Reposição", o WhatsApp do fornecedor abrirá e todos estes pedidos serão marcados como "Processados" no sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">💡 Dica Logística</p>
                        <p className="text-sm text-neutral-400">
                            A consolidação soma todos os itens de pedidos com status "Confirmado" que ainda não foram enviados para reposição.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
