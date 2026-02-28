import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Finance() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                // Filter out canceled orders if needed. Let's assume we want all but Cancelado for revenue?
                // For now, let's fetch all and filter in memory just to be safe.
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Only count non-canceled orders for revenue
            // Since status is now a long combined string, we check if it starts with 'Cancelado'
            const validOrders = (data || []).filter(o => {
                const s = o.status || '';
                return !s.startsWith('Cancelado -') && s !== 'Cancelado';
            });
            setOrders(validOrders);
        } catch (error) {
            console.error('Erro ao buscar pedidos para o financeiro:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price || 0);
    };

    // Calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = orders
        .filter(order => {
            const d = new Date(order.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);

    const annualRevenue = orders
        .filter(order => {
            const d = new Date(order.created_at);
            return d.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);

    // Chart Data (Last 6 months)
    const getChartData = () => {
        const data = [];
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const rMonth = d.getMonth();
            const rYear = d.getFullYear();

            const sum = orders
                .filter(o => {
                    const od = new Date(o.created_at);
                    return od.getMonth() === rMonth && od.getFullYear() === rYear;
                })
                .reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);

            data.push({
                name: `${monthNames[rMonth]}/${String(rYear).slice(2)}`,
                Total: sum
            });
        }
        return data;
    };

    const chartData = getChartData();

    // Custom Tooltip for the Chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-800 border border-dark-600 p-3 flex flex-col gap-1 rounded-lg shadow-xl">
                    <p className="text-neutral-400 text-sm font-medium">{label}</p>
                    <p className="text-emerald-400 font-bold text-lg">
                        {formatPrice(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" />
                    Controle Financeiro
                </h1>
                <p className="text-neutral-400 text-sm mt-1">Resumo do faturamento (pedidos não cancelados)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Monthly Card */}
                <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-neutral-400 text-sm font-medium mb-1">Faturamento Mensal</p>
                            <h3 className="text-3xl font-black text-white">{formatPrice(monthlyRevenue)}</h3>
                        </div>
                        <div className="p-3 bg-dark-900 border border-dark-700 rounded-xl">
                            <Calendar size={20} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                        <span className="text-emerald-500 font-medium">Mês Atual</span> (soma dos pedidos do mês)
                    </div>
                </div>

                {/* Annual Card */}
                <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-neutral-400 text-sm font-medium mb-1">Faturamento Anual</p>
                            <h3 className="text-3xl font-black text-white">{formatPrice(annualRevenue)}</h3>
                        </div>
                        <div className="p-3 bg-dark-900 border border-dark-700 rounded-xl">
                            <DollarSign size={20} className="text-primary" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                        <span className="text-primary font-medium">Ano Atual</span> (soma dos pedidos do ano)
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6">Faturamento dos Últimos 6 Meses</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#737373"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#737373"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$ ${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2A2A2A' }} />
                            <Bar
                                dataKey="Total"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
