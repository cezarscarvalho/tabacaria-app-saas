import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { TrendingUp, DollarSign, Calendar, Users, Award, BarChart3, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Finance() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(''); // YYYY-MM format

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

            // Only count non-canceled orders for revenue
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

    // Helper to extract Name from the combined string
    const extractCustomerName = (statusString) => {
        if (!statusString) return 'Desconhecido';

        // Handle "Confirmado pelo cliente: [Nome] - [Items]" (with or without badge prefix)
        if (statusString.includes('Confirmado pelo cliente: ')) {
            const parts = statusString.split('Confirmado pelo cliente: ');
            const content = parts[parts.length - 1]; // Take the part after the last occurrence
            return content.split(' - ')[0] || 'Desconhecido';
        }

        // Old format: "Novo Pedido - Cliente: [Nome] - Itens: [Items]"
        const match = statusString.match(/Cliente: (.*?)( - Itens:|$)/);
        return match ? match[1] : 'Desconhecido';
    };

    // Date calculations
    const now = new Date();
    const currentYear = now.getFullYear();
    const [selectedYear, selectedMonth] = filterDate ? filterDate.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];

    // Filtered orders for specific analysis
    const filteredOrders = orders.filter(order => {
        const d = new Date(order.created_at);
        if (filterDate) {
            return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        }
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const monthlyRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);
    const annualRevenue = orders
        .filter(order => new Date(order.created_at).getFullYear() === currentYear)
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);

    const avgTicket = filteredOrders.length > 0 ? monthlyRevenue / filteredOrders.length : 0;

    // Top 5 Clients
    const getTopClients = () => {
        const clientsMap = {};
        orders.forEach(order => {
            const name = extractCustomerName(order.status);
            clientsMap[name] = (clientsMap[name] || 0) + (Number(order.valor_total) || 0);
        });

        return Object.entries(clientsMap)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    };

    const topClients = getTopClients();

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
                name: `${monthNames[rMonth]}`,
                Total: sum,
                isCurrent: rMonth === (selectedMonth - 1) && rYear === selectedYear
            });
        }
        return data;
    };

    const chartData = getChartData();

    // Unique month options for filter
    const availableMonths = [...new Set(orders.map(o => {
        const d = new Date(o.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))].sort((a, b) => b.localeCompare(a));

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-emerald-500" />
                        Dashboard Financeiro
                    </h1>
                    <p className="text-neutral-400 text-sm mt-1">Inteligência de vendas e métricas de desempenho</p>
                </div>

                <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 p-1.5 rounded-xl">
                    <Filter size={16} className="ml-2 text-neutral-500" />
                    <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent text-white text-sm font-medium outline-none pr-4 py-1.5 appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-dark-800">Mês Atual</option>
                        {availableMonths.map(m => {
                            const [y, mm] = m.split('-');
                            const d = new Date(y, mm - 1, 1);
                            return (
                                <option key={m} value={m} className="bg-dark-800">
                                    {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Monthly Card */}
                <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg relative group transition-all hover:border-emerald-500/30">
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
                    <p className="text-neutral-400 text-sm font-medium mb-1">Faturamento {filterDate ? 'do Período' : 'Mensal'}</p>
                    <h3 className="text-3xl font-black text-white">{formatPrice(monthlyRevenue)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500/70">
                        <Calendar size={14} />
                        {filterDate ? 'Filtro Ativo' : 'Mês Vigente'}
                    </div>
                </div>

                {/* Ticket Médio Card */}
                <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg relative group transition-all hover:border-emerald-500/30">
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>
                    <p className="text-neutral-400 text-sm font-medium mb-1">Ticket Médio</p>
                    <h3 className="text-3xl font-black text-white">{formatPrice(avgTicket)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400/70">
                        <TrendingUp size={14} />
                        Média por Venda
                    </div>
                </div>

                {/* Annual Card */}
                <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg relative group transition-all hover:border-emerald-500/30">
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all"></div>
                    <p className="text-neutral-400 text-sm font-medium mb-1">Faturamento Anual</p>
                    <h3 className="text-3xl font-black text-white">{formatPrice(annualRevenue)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary/70">
                        <DollarSign size={14} />
                        Ano {currentYear}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        Desempenho de Vendas (6 meses)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                                <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                    cursor={{ fill: '#2A2A2A', radius: 4 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-dark-900 border border-dark-600 p-3 rounded-xl shadow-2xl">
                                                    <p className="text-emerald-400 font-bold">{formatPrice(payload[0].value)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="Total" radius={[6, 6, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#10B981' : '#1F2937'} stroke={entry.isCurrent ? '#10B981' : '#374151'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Clients Section */}
                <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Award className="text-yellow-500" size={20} />
                        Top 5 Clientes
                    </h3>
                    <div className="space-y-4">
                        {topClients.map((client, index) => (
                            <div key={client.name} className="flex items-center justify-between p-3 bg-dark-900/50 border border-dark-700 rounded-xl group hover:border-emerald-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                        index === 1 ? 'bg-neutral-400/20 text-neutral-400' :
                                            index === 2 ? 'bg-amber-700/20 text-amber-700' :
                                                'bg-dark-700 text-neutral-500'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-white font-semibold truncate max-w-[120px]">{client.name}</p>
                                        <p className="text-neutral-500 text-xs">Fiel ao caixa</p>
                                    </div>
                                </div>
                                <p className="text-emerald-400 font-bold">{formatPrice(client.total)}</p>
                            </div>
                        ))}
                        {topClients.length === 0 && (
                            <p className="text-center text-neutral-500 py-10">Nenhum dado de cliente encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
