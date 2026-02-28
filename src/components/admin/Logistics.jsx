import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Truck, Send, CheckCircle2 } from 'lucide-react';
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
            // 1. Buscar Pedidos Confirmados (que não foram processados ainda)
            const { data: pedidos, error: pError } = await supabase
                .from('pedidos')
                .select('*')
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

    const consolidateOrders = (orderList) => {
        const itemMap = {};

        orderList.forEach(order => {
            try {
                // Formato esperado: "... | Resp: Y - Item A (2x), Item B (1x)"
                const parts = order.status.split(' - ');
                if (parts.length < 2) return;

                const itemsStr = parts[1].split(', ');
                itemsStr.forEach(itemStr => {
                    const match = itemStr.match(/(.+) \((\d+)[x| un]*\)/i);
                    if (match) {
                        const name = match[1].trim();
                        const qty = parseInt(match[2]);
                        if (!isNaN(qty)) {
                            itemMap[name] = (itemMap[name] || 0) + qty;
                        }
                    } else {
                        const name = itemStr.trim();
                        if (name) itemMap[name] = (itemMap[name] || 0) + 1;
                    }
                });
            } catch (err) {
                console.warn('Pulo em pedido mal formatado:', order.id);
            }
        });

        const sortedList = Object.entries(itemMap)
            .map(([product, total]) => ({ product, total }))
            .sort((a, b) => a.product.localeCompare(b.product));

        setConsolidatedItems(sortedList);
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

            // Marcar pedidos como processados no Supabase
            for (const order of orders) {
                const newStatus = `${order.status} | Pedido ao Fornecedor Realizado`;
                await supabase
                    .from('pedidos')
                    .update({ status: newStatus })
                    .eq('id', order.id);
            }

            window.open(whatsappUrl, '_blank');
            setSuccessMessage('Pedido gerado e status atualizados!');

            setTimeout(() => {
                setSuccessMessage('');
                fetchInitialData();
            }, 3000);

        } catch (error) {
            console.error('Erro ao processar envio:', error);
            alert('Erro ao atualizar pedidos no banco.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Truck className="text-primary" size={28} /> Logística
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">Consolidação simples de pedidos confirmados</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-all cursor-pointer shadow-lg"
                    >
                        <option value="">Selecione o Fornecedor...</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.nome} ({s.whatsapp || 'Sem Zap'})</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSendToSupplier}
                        disabled={consolidatedItems.length === 0 || isUpdating}
                        className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-dark-900 font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-primary/20"
                    >
                        <Send size={18} />
                        {isUpdating ? 'Processando...' : 'Gerar Pedido de Compra'}
                    </button>
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
                                    <p className="text-neutral-500 font-medium">Consolidando dados...</p>
                                </td>
                            </tr>
                        ) : consolidatedItems.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="py-20 text-center">
                                    <Package className="mx-auto text-dark-600 mb-4" size={48} />
                                    <p className="text-neutral-500 font-medium text-lg">Nenhum pedido confirmado no momento.</p>
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

            <div className="mt-6 p-5 bg-dark-900/40 rounded-2xl border border-dark-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-dark-800 rounded-xl border border-dark-700">
                        <span className="block text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Total Diferenciados</span>
                        <span className="text-2xl font-black text-white">{consolidatedItems.length}</span>
                    </div>
                    <div className="p-3 bg-dark-800 rounded-xl border border-dark-700">
                        <span className="block text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Total de Unidades</span>
                        <span className="text-2xl font-black text-primary">
                            {consolidatedItems.reduce((acc, curr) => acc + curr.total, 0)}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-neutral-500 max-w-sm text-center sm:text-right font-medium leading-relaxed">
                    Esta lista agrupa automaticamente todos os itens de pedidos com status "Confirmado" para facilitar a sua reposição semanal com fornecedores.
                </p>
            </div>
        </div>
    );
}
