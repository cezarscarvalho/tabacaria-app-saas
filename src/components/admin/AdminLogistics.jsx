import React, { useState, useMemo } from 'react';
import { Truck, Calculator, Search, Zap, PackageOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

/* 
  AdminLogistics.jsx 
  Componente robusto para gestão de fornecedores e triagem de carga.
  Arquitetura anti-corrupção com tratamento global de erros.
*/

export default function AdminLogistics({ ordersData, refreshFunc }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // 1. Consolidação Inteligente com Try/Catch (Segurança Total)
    const data = useMemo(() => {
        try {
            const itemMap = {};
            let globalTotal = 0;
            const orders = ordersData || [];

            // Filtra apenas os pedidos marcados para logística
            const targetOrders = orders.filter(o => o.enviado_logistica === true);

            targetOrders.forEach(order => {
                const status = order.status || '';
                const parts = status.split(' - ');
                if (parts.length >= 2) {
                    const itemsText = parts[1];
                    const itemsArray = itemsText.split(', ');

                    itemsArray.forEach(rawItem => {
                        // Regex para capturar: "Nome do Produto (10x)" ou "5 un Nome do Produto"
                        const match = rawItem.match(/(.+) \((\d+)[x| un]*\)/i) || rawItem.match(/^(\d+)[x| un]*\s+(.+)$/i);

                        if (match) {
                            const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                            const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]);
                            const validQty = isNaN(qty) ? 1 : qty;

                            itemMap[name] = (itemMap[name] || 0) + validQty;
                            globalTotal += validQty;
                        } else if (rawItem.trim()) {
                            const fallback = rawItem.trim();
                            itemMap[fallback] = (itemMap[fallback] || 0) + 1;
                            globalTotal += 1;
                        }
                    });
                }
            });

            const consolidated = Object.entries(itemMap)
                .map(([name, qty], idx) => ({ id: `id-${idx}-${name}`, name, qty }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return { consolidated, globalTotal, error: false };
        } catch (err) {
            console.error('[CRITICAL-LOGISTICS-ERROR]', err);
            return { consolidated: [], globalTotal: 0, error: true };
        }
    }, [ordersData]);

    const { consolidated, globalTotal, error: hasError } = data;

    // 2. Filtro de Triagem por Marca/Produto
    const filtered = useMemo(() => {
        return consolidated.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [consolidated, searchTerm]);

    // 3. Sistema de Seleção Seletiva
    const toggleItem = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => setSelectedIds(filtered.map(i => i.id));
    const clearSelection = () => setSelectedIds([]);

    // 4. Envio Segmentado via WhatsApp
    const sendToSupplier = () => {
        const itemsToExport = filtered.filter(item => selectedIds.includes(item.id));

        if (itemsToExport.length === 0) {
            alert('Atenção: Selecione os itens que deseja enviar para o fornecedor.');
            return;
        }

        let msg = `*TABACARIA PREMIUM - PEDIDO DE COMPRA* 🚚%0A`;
        msg += `*Data:* ${new Date().toLocaleDateString('pt-BR')}%0A%0A`;

        itemsToExport.forEach(item => {
            msg += `• ${item.name}: *${item.qty} pacotes*%0A`;
        });

        const selectedTotal = itemsToExport.reduce((acc, curr) => acc + curr.qty, 0);
        msg += `%0A*Volume Total Selecionado: ${selectedTotal} pacotes*`;

        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Título e Triagem */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-[1.5rem] border border-primary/30 shadow-lg shadow-primary/10">
                            <Truck className="text-primary" size={32} />
                        </div>
                        Centro de Logística e Fornecedores
                    </h1>
                    <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3 ml-1">Gerenciamento de Carga e Pedidos Ativos</p>
                </div>

                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        placeholder="Filtrar por Marca (Ex: Zomo, Pety)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-800 border-2 border-dark-700 rounded-[1.5rem] pl-14 pr-8 py-5 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold placeholder:text-neutral-600 shadow-2xl"
                    />
                    <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                </div>
            </div>

            {/* Contador de Volume Expressivo */}
            <div className={`mb-12 p-12 rounded-[3.5rem] border-2 shadow-2xl transition-all relative overflow-hidden group ${hasError ? 'bg-red-500/10 border-red-500/30' : 'bg-gradient-to-br from-primary to-emerald-400 border-white/10 shadow-primary/20'}`}>
                {hasError ? (
                    <div className="flex items-center gap-6 text-red-500 relative z-10">
                        <AlertCircle size={60} />
                        <div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Erro ao calcular volume</h2>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-70">Verifique a integridade dos dados de vendas.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <PackageOpen size={220} className="absolute -right-12 -bottom-16 text-dark-900/10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <span className="text-dark-900/50 font-black uppercase text-xs tracking-[0.3em] block mb-3">Estoque Consolidado para Compra</span>
                            <h2 className="text-5xl md:text-7xl font-black text-dark-900 uppercase italic tracking-tighter leading-none">
                                Volume Total: <span className="text-white drop-shadow-lg">{globalTotal}</span> pacotes
                            </h2>
                            <div className="flex items-center gap-3 mt-6">
                                <div className="h-1.5 w-12 bg-dark-900/20 rounded-full"></div>
                                <p className="text-dark-900/60 font-bold uppercase text-[9px] tracking-[0.5em]">Processamento Instantâneo de Unidades</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {consolidated.length === 0 ? (
                <div className="bg-dark-800 border-2 border-dashed border-dark-700 rounded-[3.5rem] p-28 text-center">
                    <Calculator className="text-neutral-700 mx-auto mb-8 animate-pulse" size={90} />
                    <p className="text-neutral-500 font-black text-xl uppercase tracking-widest max-w-sm mx-auto italic">Nenhum item marcado para logística no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-10">
                    {/* Barra de Ações Rápidas */}
                    <div className="flex flex-wrap items-center justify-between gap-8 bg-dark-900/60 p-8 rounded-[2rem] border border-dark-700 shadow-xl">
                        <div className="flex items-center gap-4">
                            <button onClick={selectAll} className="px-8 py-4 bg-dark-800 hover:bg-white hover:text-dark-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-dark-600">Selecionar Todos</button>
                            <button onClick={clearSelection} className="px-8 py-4 bg-dark-800 hover:bg-neutral-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-dark-600">Desmarcar</button>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="text-primary font-black text-[9px] uppercase tracking-widest opacity-80">{selectedIds.length} Itens Selecionados</span>
                            <button
                                onClick={sendToSupplier}
                                disabled={selectedIds.length === 0}
                                className="bg-primary text-dark-900 font-black py-5 px-14 rounded-2xl uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale text-sm italic"
                            >
                                WhatsApp Fornecedor
                            </button>
                        </div>
                    </div>

                    {/* Malha de Produtos (Tabela) */}
                    <div className="bg-dark-800 rounded-[3rem] border-2 border-dark-700 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-dark-900 border-b-2 border-dark-700">
                                <tr>
                                    <th className="p-10 w-28 text-center text-neutral-600 font-black uppercase text-[10px] tracking-widest">OK</th>
                                    <th className="p-10 text-neutral-600 font-black uppercase text-[10px] tracking-widest text-left">Especificação do Produto</th>
                                    <th className="p-10 text-neutral-600 font-black uppercase text-[10px] tracking-widest text-right">Qtd Consolidada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {filtered.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-dark-700/50 transition-all cursor-pointer group ${isSelected ? 'bg-primary/5' : ''}`}
                                            onClick={() => toggleItem(item.id)}
                                        >
                                            <td className="p-10 text-center">
                                                <div className={`mx-auto w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary border-primary rotate-12 scale-110 shadow-lg shadow-primary/20' : 'border-dark-600 group-hover:border-primary/30'}`}>
                                                    {isSelected && <Zap size={18} className="text-dark-900 fill-current" />}
                                                </div>
                                            </td>
                                            <td className="p-10">
                                                <span className="font-black text-white italic text-2xl tracking-tighter uppercase group-hover:text-primary transition-colors block">{item.name}</span>
                                                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1 block">SKU: Log-{item.id.split('-')[1]}</span>
                                            </td>
                                            <td className="p-10 text-right">
                                                <div className={`inline-flex items-center gap-4 font-black px-8 py-4 rounded-3xl border-2 transition-all duration-300 ${isSelected ? 'bg-primary text-dark-900 border-primary scale-110' : 'bg-dark-900 text-neutral-400 border-dark-700'}`}>
                                                    <span className="text-2xl">{item.qty}</span>
                                                    <span className="text-[10px] uppercase tracking-widest opacity-60">unidades</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-32 text-center text-neutral-600 font-black italic uppercase tracking-[0.3em] text-sm">Nenhum resultado filtrado encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer de Sincronização */}
            <div className="mt-12 text-center">
                <button
                    onClick={refreshFunc}
                    className="group flex flex-col items-center gap-4 mx-auto text-neutral-600 hover:text-white transition-all"
                >
                    <div className="bg-dark-800 p-4 rounded-full border border-dark-700 group-hover:border-primary transition-all">
                        <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizar Pedidos Recentes</span>
                </button>
            </div>
        </div>
    );
}

// Icone adicional para o Refresh
function RefreshCw(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
