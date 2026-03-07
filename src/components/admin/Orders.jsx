import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Trash2, CheckCircle2, Copy, Truck } from 'lucide-react';

export default function Orders({ ordersData, refreshFunc }) {
    // Usamos os dados vindos do pai (Shell Estática)
    const orders = ordersData || [];

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

    const handleStatusChange = async (id, newStatus, currentFullStatus) => {
        try {
            let baseDetails = currentFullStatus;

            // Limpeza de prefixos antigos
            if (baseDetails?.includes('Confirmado pelo cliente | Loja: ')) {
                const parts = baseDetails.split('Confirmado pelo cliente | ');
                baseDetails = parts[parts.length - 1];
            } else if (baseDetails?.startsWith('Confirmado pelo cliente: ')) {
                baseDetails = baseDetails.substring('Confirmado pelo cliente: '.length);
            } else {
                // Tenta remover os prefixos manuais
                const prefixes = ['Novo Pedido - ', 'Pendente - ', 'Entregue - ', 'Cancelado - ', 'Impresso - ', 'Finalizado - '];
                for (const p of prefixes) {
                    if (baseDetails?.startsWith(p)) {
                        baseDetails = baseDetails.substring(p.length);
                        break;
                    }
                }
            }

            const updatedStatusString = `${newStatus} - ${baseDetails}`;

            const { error } = await supabase
                .from('pedidos')
                .update({ status: updatedStatusString })
                .eq('id', id);

            if (error) throw error;
            if (refreshFunc) refreshFunc(); // Atualiza a fonte única
        } catch (error) {
            console.error('Erro ao atualizar status:', error.message);
            alert('Erro ao atualizar status.');
        }
    };

    const handleToggleLogistics = async (id, isEnviado) => {
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ enviado_logistica: isEnviado })
                .eq('id', id);

            if (error) throw error;
            if (refreshFunc) refreshFunc();
        } catch (error) {
            console.error('Erro ao alternar logística:', error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Excluir permanentemente?')) return;
        try {
            await supabase.from('pedidos').delete().eq('id', id);
            if (refreshFunc) refreshFunc();
        } catch (error) {
            console.error('Erro ao excluir:', error.message);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Histórico de Vendas</h1>
                    <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest mt-1">Gestão Centralizada de Pedidos</p>
                </div>
            </div>

            <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-dark-900/50 border-b border-dark-700 text-[10px] font-black uppercase text-neutral-500 tracking-[0.15em]">
                            <tr>
                                <th className="p-6">ID</th>
                                <th className="p-6">Data</th>
                                <th className="p-6">Resumo / Itens</th>
                                <th className="p-6">Valor</th>
                                <th className="p-6 text-center">Status / Logística</th>
                                <th className="p-6 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-neutral-600 font-bold italic underline decoration-dark-700">
                                        Nenhum pedido registrado no momento.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="p-6 text-sm text-neutral-500 font-mono">#{order.id}</td>
                                        <td className="p-6 text-[11px] text-neutral-300 font-bold uppercase">{formatDate(order.created_at)}</td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <p className={`text-xs whitespace-pre-wrap ${order.enviado_logistica ? 'text-primary font-black' : 'text-white'}`}>
                                                    {order.status || 'S/ Detalhes'}
                                                </p>
                                                <button onClick={() => copyToClipboard(order.status)} className="text-[9px] uppercase font-black text-neutral-600 hover:text-primary transition-all text-left">Copiar Detalhes</button>
                                            </div>
                                        </td>
                                        <td className="p-6 font-black text-emerald-400 italic">
                                            {formatPrice(order.valor_total)}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-3 items-center">
                                                {(() => {
                                                    const s = (order.status || '').toLowerCase();
                                                    let badge = 'Novo Pedido';
                                                    if (s.includes('pendente')) badge = 'Pendente';
                                                    else if (s.includes('entregue')) badge = 'Entregue';
                                                    else if (s.includes('cancelado')) badge = 'Cancelado';
                                                    else if (s.includes('impresso')) badge = 'Impresso';
                                                    else if (s.includes('finalizado')) badge = 'Finalizado';

                                                    return (
                                                        <select
                                                            value={badge}
                                                            onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                                                            className={`text-[10px] font-black rounded-lg px-3 py-1.5 border-2 outline-none uppercase tracking-tighter cursor-pointer text-center
                                                                ${badge === 'Novo Pedido' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                    badge === 'Entregue' || badge === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                        badge === 'Cancelado' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
                                                        >
                                                            <option value="Novo Pedido">Novo Pedido</option>
                                                            <option value="Pendente">Pendente</option>
                                                            <option value="Impresso">Impresso</option>
                                                            <option value="Entregue">Entregue</option>
                                                            <option value="Finalizado">Finalizado</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                        </select>
                                                    );
                                                })()}

                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary cursor-pointer accent-primary"
                                                        checked={order.enviado_logistica || false}
                                                        onChange={(e) => handleToggleLogistics(order.id, e.target.checked)}
                                                    />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${order.enviado_logistica ? 'text-primary' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                                                        Logística
                                                    </span>
                                                    {order.enviado_logistica && <Truck size={12} className="text-primary animate-pulse" />}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button onClick={() => handleDelete(order.id)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg hover:shadow-red-500/20">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
