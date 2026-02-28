import React from 'react';
import { supabase } from '../../supabaseClient';
import { Truck, Calculator, ClipboardCheck } from 'lucide-react';

export default function Logistics({ ordersData, refreshFunc }) {
    const orders = ordersData || [];

    // Consolidação Estática baseada nos dados do Pai
    const confirmedOrders = orders.filter(o => o.enviado_logistica === true);
    const itemMap = {};

    confirmedOrders.forEach(order => {
        const status = order.status || '';
        const parts = status.split(' - ');
        if (parts.length >= 2) {
            const itemsArray = parts[1].split(', ');
            itemsArray.forEach(rawItem => {
                const match = rawItem.match(/(.+) \((\d+)[x| un]*\)/i) || rawItem.match(/^(\d+)[x| un]*\s+(.+)$/i);
                if (match) {
                    const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                    const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]);
                    itemMap[name] = (itemMap[name] || 0) + (isNaN(qty) ? 1 : qty);
                } else {
                    itemMap[rawItem.trim()] = (itemMap[rawItem.trim()] || 0) + 1;
                }
            });
        }
    });

    const consolidated = Object.entries(itemMap).map(([name, qty]) => ({ name, qty }));

    const handleSendToSupplier = () => {
        if (consolidated.length === 0) return;
        let text = `*LISTA DE CONSOLIDAÇÃO - ${new Date().toLocaleDateString('pt-BR')}*%0A%0A`;
        consolidated.forEach(item => {
            text += `• ${item.name}: *${item.qty} un*%0A`;
        });
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Gestão de Logística</h1>

            {consolidated.length === 0 ? (
                <div className="bg-dark-800 border-2 border-dashed border-dark-700 rounded-[3rem] p-24 text-center">
                    <Calculator className="text-neutral-700 mx-auto mb-8" size={80} />
                    <p className="text-neutral-500 font-bold text-xl uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                        Nenhum item marcado para logística em 'Vendas'.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-dark-800 rounded-[2.5rem] border border-dark-700 overflow-hidden shadow-2xl">
                        <div className="bg-dark-900/80 p-6 border-b border-dark-700 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Resumo Consolidado</span>
                            <ClipboardCheck className="text-primary" size={20} />
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-dark-700">
                                {consolidated.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="p-6 font-bold text-white italic">{item.name}</td>
                                        <td className="p-6 text-right">
                                            <span className="bg-primary/10 text-primary font-black px-4 py-2 rounded-xl border border-primary/20 text-sm">
                                                {item.qty} un
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="bg-primary rounded-[2.5rem] p-10 text-dark-900 shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <Truck size={120} className="absolute -bottom-10 -right-10 text-dark-900/10 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black uppercase mb-4 leading-tight">Enviar para Fornecedor</h3>
                            <p className="text-sm font-bold mb-8 text-dark-900/70 uppercase">Caminhão de prospecção pronto com {consolidated.length} itens únicos.</p>
                            <button
                                onClick={handleSendToSupplier}
                                className="w-full bg-dark-900 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
                            >
                                WhatsApp Fornecedor
                            </button>
                        </div>

                        <div className="bg-dark-800 border border-dark-700 rounded-[2.5rem] p-10 text-center">
                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-4">Atualização Manual</p>
                            <button onClick={refreshFunc} className="text-white hover:text-primary transition-all font-bold italic underline">
                                Sincronizar Novos Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
