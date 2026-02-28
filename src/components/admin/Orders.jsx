import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Calendar, Trash2, CheckCircle2, Copy } from 'lucide-react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        // Optional: Subscribe to real-time order updates
        const subscription = supabase
            .channel('pedidos_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
                fetchOrders(); // Re-fetch on any change
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
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
            console.error('Erro ao buscar pedidos:', error.message);
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

    const handleStatusChange = async (id, newStatus, currentFullStatus) => {
        try {
            // Extract the base order details string by removing any known status prefixes if they exist
            // Format is typically: "Novo Pedido - Cliente..." or "Entregue - Cliente..." 
            // BUT our new insert just puts "Cliente..." so let's just prefix the new status to it
            // or replace the existing prefix.
            let baseDetails = currentFullStatus;

            const statusesToRemove = [
                'Novo Pedido - ',
                'Pendente - ',
                'Entregue - ',
                'Cancelado - ',
                'Impresso - ',
                'Finalizado - ',
                'Confirmado - ' // Badge version in PrintOrders
            ];

            // Handle the specific formats
            if (baseDetails?.includes('Confirmado pelo cliente | Loja: ')) {
                // Keep everything after the confirmed prefix as the base details
                const parts = baseDetails.split('Confirmado pelo cliente | ');
                baseDetails = parts[parts.length - 1];
            } else if (baseDetails?.startsWith('Confirmado pelo cliente: ')) {
                baseDetails = baseDetails.substring('Confirmado pelo cliente: '.length);
            }

            // If it doesn't start with any known prefix, it's just the raw details
            const updatedStatusString = `${newStatus} - ${baseDetails}`;

            // Optimistic UI update
            setOrders(orders.map(order =>
                order.id === id ? { ...order, status: updatedStatusString } : order
            ));

            const { error } = await supabase
                .from('pedidos')
                .update({ status: updatedStatusString })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao atualizar status:', error.message);
            alert('Erro ao atualizar status do pedido.');
            fetchOrders(); // Revert back to original on error
        }
    };

    const handleToggleLogistics = async (id, isEnviado) => {
        try {
            // Optimistic UI update
            setOrders(prev => prev.map(order =>
                order.id === id ? { ...order, enviado_logistica: isEnviado } : order
            ));

            const { error } = await supabase
                .from('pedidos')
                .update({ enviado_logistica: isEnviado })
                .eq('id', id);

            if (error) {
                // Se o erro for de coluna inexistente, não alertar o usuário, apenas logar
                if (error.code === '42703') {
                    console.warn('Coluna enviado_logistica não existe no Supabase. O fluxo funciona apenas localmente neste estado.');
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Erro ao alternar logística:', error.message);
            alert('Não foi possível salvar sua escolha. Verifique se a coluna existe no banco.');
            fetchOrders();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir permanentemente este pedido do histórico?')) {
            try {
                // Optimistic UI update
                setOrders(orders.filter(order => order.id !== id));

                const { error } = await supabase
                    .from('pedidos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir pedido:', error.message);
                alert('Erro ao excluir pedido.');
                fetchOrders(); // Revert back
            }
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Detalhes do pedido copiados!');
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Histórico de Vendas</h1>
                    <p className="text-neutral-400 text-sm mt-1">Acompanhe os pedidos gerados na vitrine B2C</p>
                </div>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-dark-900/50 border-b border-dark-700 text-sm font-semibold text-neutral-400">
                                <th className="py-4 px-6 w-20">ID</th>
                                <th className="py-4 px-6 w-40">Data e Hora</th>
                                <th className="py-4 px-6">Itens do Pedido</th>
                                <th className="py-4 px-6 w-36">Valor Total</th>
                                <th className="py-4 px-6 w-48 text-center">Status</th>
                                <th className="py-4 px-6 w-20 text-right">Excluir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loading && orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            <p>Carregando histórico de vendas...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Calendar size={32} className="text-dark-600 mb-2" />
                                            <p>Nenhum pedido recebido até o momento.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="py-4 px-6 text-sm text-neutral-500 font-medium">#{order.id}</td>

                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-sm text-neutral-300">
                                                <Calendar size={14} className="text-neutral-500" />
                                                <span>{formatDate(order.created_at)}</span>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="group relative">
                                                <div className="flex items-center gap-2">
                                                    {order.enviado_logistica && (
                                                        <Truck size={14} className="text-primary animate-pulse shrink-0" title="Enviado para Logística" />
                                                    )}
                                                    <p className={`text-sm line-clamp-2 whitespace-pre-wrap ${order.enviado_logistica ? 'text-primary/90 font-medium' : 'text-white'}`}>
                                                        {order.status || 'S/ Detalhes'}
                                                    </p>
                                                </div>
                                                {order.status && (
                                                    <button
                                                        onClick={() => copyToClipboard(order.status)}
                                                        className="absolute -right-2 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 rounded"
                                                        title="Copiar texto"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="font-bold text-emerald-400">
                                                {formatPrice(order.valor_total)}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2">
                                                {(() => {
                                                    let currentBadgeStatus = 'Novo Pedido';
                                                    const s = order.status || '';
                                                    if (s.startsWith('Pendente -')) currentBadgeStatus = 'Pendente';
                                                    else if (s.startsWith('Entregue -')) currentBadgeStatus = 'Entregue';
                                                    else if (s.startsWith('Cancelado -')) currentBadgeStatus = 'Cancelado';
                                                    else if (s.startsWith('Impresso -')) currentBadgeStatus = 'Impresso';
                                                    else if (s.startsWith('Finalizado -')) currentBadgeStatus = 'Finalizado';
                                                    else if (s.includes('Confirmado pelo cliente')) currentBadgeStatus = 'Novo Pedido';
                                                    else if (s.startsWith('Novo Pedido -')) currentBadgeStatus = 'Novo Pedido';

                                                    return (
                                                        <select
                                                            value={currentBadgeStatus}
                                                            onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                                                            className={`w-full text-[11px] font-black rounded-lg px-2 py-1.5 border outline-none transition-all appearance-none cursor-pointer text-center uppercase tracking-tighter
                                                                ${currentBadgeStatus === 'Novo Pedido' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                    currentBadgeStatus === 'Entregue' || currentBadgeStatus === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                        currentBadgeStatus === 'Impresso' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                            currentBadgeStatus === 'Cancelado' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                }`}
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

                                                <label className="flex items-center gap-2 cursor-pointer group/check">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={order.enviado_logistica || false}
                                                            onChange={(e) => handleToggleLogistics(order.id, e.target.checked)}
                                                            className="peer h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary/20 appearance-none transition-all cursor-pointer border hover:border-primary/50"
                                                        />
                                                        <CheckCircle2 size={10} className="absolute left-0.5 top-0.5 text-dark-900 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-black tracking-widest transition-colors ${order.enviado_logistica ? 'text-primary' : 'text-neutral-500 group-hover/check:text-neutral-300'}`}>
                                                        Logística
                                                    </span>
                                                </label>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors inline-flex justify-center"
                                                title="Excluir pedido permanentemente"
                                            >
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
