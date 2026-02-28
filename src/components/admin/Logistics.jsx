import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Truck, Send, CheckCircle2, Package, AlertCircle, Trash2 } from 'lucide-react';
import { formatarNumeroWhats } from '../../utils/whatsapp';

export default function Logistics() {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [consolidatedItems, setConsolidatedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Buscar Pedidos Confirmados E ENVIADOS PARA LOGÍSTICA
            const { data: pedidos, error: pError } = await supabase
                .from('pedidos')
                .select('*')
                .eq('enviado_logistica', true)
                .ilike('status', '%Confirmado%')
                .not('status', 'ilike', '%Pedido ao Fornecedor Realizado%');

            if (pError) throw pError;
            setOrders(pedidos || []);
            consolidateOrders(pedidos || []);

            // 2. Buscar Fornecedores
            const { data: forn, error: fError } = await supabase
                .from('fornecedores')
                .select('*')
                .order('nome', { ascending: true });

            if (fError) throw fError;
            setSuppliers(forn || []);

        } catch (error) {
            console.error('Erro na carga inicial Logistics:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const parseItem = (itemStr) => {
        try {
            const cleanStr = itemStr.trim();
            if (!cleanStr) return null;

            // Pattern 1: "Product Name (2x)" or "Product Name (2)"
            const pattern1 = cleanStr.match(/(.+) \((\d+)[x| un]*\)/i);
            if (pattern1) {
                return { name: pattern1[1].trim(), qty: parseInt(pattern1[2]) };
            }

            // Pattern 2: "2x Product Name" or "2 Product Name"
            const pattern2 = cleanStr.match(/^(\d+)[x| un]*\s+(.+)$/i);
            if (pattern2) {
                return { name: pattern2[2].trim(), qty: parseInt(pattern2[1]) };
            }

            return { name: cleanStr, qty: 1 };
        } catch (e) {
            return null;
        }
    };

    const consolidateOrders = (orderList) => {
        const itemMap = {};

        orderList.forEach(order => {
            try {
                const status = order.status || '';
                const parts = status.split(' - ');
                if (parts.length < 2) return;

                const itemsPart = parts[1];
                const itemsArray = itemsPart.split(', ');

                itemsArray.forEach(rawItem => {
                    try {
                        const parsed = parseItem(rawItem);
                        if (parsed && parsed.name) {
                            itemMap[parsed.name] = (itemMap[parsed.name] || 0) + parsed.qty;
                        }
                    } catch (innerErr) {
                        console.warn('Erro ao processar item específico:', rawItem, innerErr);
                    }
                });
            } catch (err) {
                console.warn('Erro ao processar pedido no loop de consolidação:', order.id, err);
            }
        });

        const sortedList = Object.entries(itemMap)
            .map(([product, total]) => ({ product, total }))
            .sort((a, b) => (a.product || '').localeCompare(b.product || ''));

        setConsolidatedItems(sortedList);
    };

    const handleClearLogistics = async () => {
        if (!orders.length) return;
        if (!window.confirm(`Deseja marcar os ${orders.length} pedidos atuais como 'Processados' e limpar a lista de logística?`)) return;

        setIsUpdating(true);
        try {
            for (const order of orders) {
                const newStatus = `${order.status} | Processado Logística`;
                await supabase
                    .from('pedidos')
                    .update({
                        status: newStatus,
                        enviado_logistica: false
                    })
                    .eq('id', order.id);
            }
            setSuccessMessage('Logística limpa e pedidos arquivados!');
            setTimeout(() => {
                setSuccessMessage('');
                fetchInitialData();
            }, 3000);
        } catch (error) {
            console.error('Erro ao limpar logística:', error);
            alert('Erro ao processar limpeza.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendToSupplier = async () => {
        if (!selectedSupplier) return alert('Por favor, selecione um fornecedor.');

        const supplier = suppliers.find(s => s.id === parseInt(selectedSupplier));
        let phone = formatarNumeroWhats(supplier?.whatsapp);

        if (!phone) {
            const manual = prompt('WhatsApp do fornecedor não encontrado. Digite o número (DDD + número):');
            if (!manual) return;
            phone = formatarNumeroWhats(manual);
        }

        setIsUpdating(true);
        try {
            let text = `*PEDIDO DE COMPRA - CONSOLIDAÇÃO*%0A%0A`;
            consolidatedItems.forEach((item, i) => {
                text += `${i + 1}. ${item.product} - ${item.total} un%0A`;
            });

            const whatsappUrl = `https://wa.me/${phone}?text=${text}`;

            // Marcar pedidos como processados
            for (const order of orders) {
                try {
                    const newStatus = `${order.status} | Pedido ao Fornecedor Realizado`;
                    await supabase
                        .from('pedidos')
                        .update({ status: newStatus })
                        .eq('id', order.id);
                } catch (updErr) {
                    console.error('Erro ao atualizar status do pedido:', order.id, updErr);
                }
            }

            window.open(whatsappUrl, '_blank');
            setSuccessMessage('Pedido gerado e status atualizados!');

            setTimeout(() => {
                setSuccessMessage('');
                fetchInitialData();
            }, 3000);

        } catch (error) {
            console.error('Erro ao processar envio:', error);
            alert('Erro ao processar envio ou atualizar banco.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Truck className="text-primary" size={28} /> Logística
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1 font-medium">Consolidação blindada de pedidos confirmados</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {consolidatedItems.length > 0 && (
                        <>
                            <button
                                onClick={handleClearLogistics}
                                disabled={isUpdating}
                                className="bg-dark-700 hover:bg-red-500/10 hover:text-red-500 text-neutral-400 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all border border-dark-600 hover:border-red-500/30"
                                title="Limpar lista e arquivar pedidos"
                            >
                                <Trash2 size={18} />
                                <span className="hidden sm:inline">Limpar</span>
                            </button>

                            <div className="w-px h-10 bg-dark-700 hidden sm:block mx-1"></div>

                            <select
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-all cursor-pointer shadow-lg"
                            >
                                <option value="">Escolha o Fornecedor...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.nome} ({s.whatsapp || 's/ número'})</option>
                                ))}
                            </select>

                            <button
                                onClick={handleSendToSupplier}
                                disabled={isUpdating}
                                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-dark-900 font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-primary/20"
                            >
                                <Send size={18} />
                                {isUpdating ? 'Processando...' : 'Gerar Pedido de Compra'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm flex items-center gap-3 animate-pulse">
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{successMessage}</span>
                </div>
            )}

            <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-dark-900/50 border-b border-dark-700 text-neutral-400 font-bold uppercase text-[11px] tracking-widest">
                            <th className="py-4 px-6">Produto / Item</th>
                            <th className="py-4 px-6 w-40 text-center">Quantidade Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {loading ? (
                            <tr>
                                <td colSpan="2" className="py-20 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-neutral-500 font-medium tracking-wide">Processando estoque...</p>
                                </td>
                            </tr>
                        ) : consolidatedItems.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="py-32 text-center">
                                    <div className="bg-dark-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-dark-700">
                                        <AlertCircle className="text-neutral-600" size={40} />
                                    </div>
                                    <p className="text-neutral-400 font-bold text-xl mb-2">Nada por aqui!</p>
                                    <p className="text-neutral-500 text-sm max-w-xs mx-auto">Nenhum pedido confirmado para consolidar hoje.</p>
                                </td>
                            </tr>
                        ) : (
                            consolidatedItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-dark-700/30 transition-colors group">
                                    <td className="py-4 px-6 font-bold text-neutral-200 group-hover:text-white transition-colors">
                                        {item.product}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="bg-primary/10 text-primary font-black px-3 py-1.5 rounded-lg border border-primary/20 text-base">
                                            {item.total} un
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {consolidatedItems.length > 0 && (
                <div className="mt-6 p-5 bg-dark-900/40 rounded-2xl border border-dark-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-dark-800 rounded-xl border border-dark-700">
                            <span className="block text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Diferenciados</span>
                            <span className="text-2xl font-black text-white">{consolidatedItems.length}</span>
                        </div>
                        <div className="p-3 bg-dark-800 rounded-xl border border-dark-700">
                            <span className="block text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Total Geral</span>
                            <span className="text-2xl font-black text-primary">
                                {consolidatedItems.reduce((acc, curr) => acc + curr.total, 0)}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-neutral-500 max-w-xs text-center sm:text-right font-medium leading-relaxed bg-dark-800/50 p-3 rounded-xl border border-dark-700">
                        Os dados foram processados com <b>Renderização Defensiva</b>. Formatos inconsistentes foram tratados automaticamente.
                    </p>
                </div>
            )}
        </div>
    );
}
