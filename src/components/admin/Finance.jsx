import React from 'react';
import { TrendingUp, DollarSign, Calendar, Landmark, BarChart3 } from 'lucide-react';

export default function Finance({ ordersData }) {
    const orders = ordersData || [];

    // Cálculo Estático baseado nos dados do Pai
    const confirmedOrders = orders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return !s.includes('cancelado') && (s.includes('novo') || s.includes('entregue') || s.includes('finalizado') || s.includes('confirmado'));
    });

    const totalRevenue = confirmedOrders.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
    const avgTicket = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8 flex items-center gap-3">
                <Landmark className="text-primary" /> Financeiro
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-primary opacity-10 group-hover:scale-125 transition-transform"><DollarSign size={80} /></div>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-2 font-mono">Faturamento Total</p>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{formatPrice(totalRevenue)}</h3>
                    <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                        <TrendingUp size={14} /> Somatório de Confirmados
                    </div>
                </div>

                <div className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-blue-500 opacity-10 group-hover:scale-125 transition-transform"><BarChart3 size={80} /></div>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-2 font-mono">Ticket Médio</p>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{formatPrice(avgTicket)}</h3>
                    <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-400">
                        <Calendar size={14} /> Média por Operação
                    </div>
                </div>

                <div className="bg-dark-800 border-2 border-dark-700 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-primary opacity-10 group-hover:scale-125 transition-transform"><ClipboardCheck size={80} /></div>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-2 font-mono">Volume de Vendas</p>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{confirmedOrders.length} <span className="text-sm">PEDIDOS</span></h3>
                    <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/50">
                        <Package size={14} /> Fluxo Validado
                    </div>
                </div>
            </div>

            <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] p-12 text-center">
                <p className="text-primary font-black uppercase tracking-widest text-sm mb-4">Inteligência Financeira Estática</p>
                <p className="text-neutral-500 max-w-sm mx-auto text-xs font-bold leading-relaxed uppercase">Os números acima são calculados diretamente da base centralizada no Admin para garantir 0% de latência e 100% de estabilidade.</p>
            </div>
        </div>
    );
}

// Helper para o ícone que falta no import
import { Package, ClipboardCheck } from 'lucide-react';
