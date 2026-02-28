import React, { useState, useMemo } from 'react';
import { Truck, Calculator, Search, Zap, PackageOpen, AlertCircle } from 'lucide-react';

export default function Logistics({ ordersData, refreshFunc }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState([]);

    // 1. Consolidação com Proteção Total de Falha (Try/Catch Global)
    const consolidation = useMemo(() => {
        try {
            const itemMap = {};
            let totalUnits = 0;
            const confirmedOrders = (ordersData || []).filter(o => o.enviado_logistica === true);

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
                            const validQty = isNaN(qty) ? 1 : qty;

                            itemMap[name] = (itemMap[name] || 0) + validQty;
                            totalUnits += validQty;
                        } else if (rawItem.trim()) {
                            const name = rawItem.trim();
                            itemMap[name] = (itemMap[name] || 0) + 1;
                            totalUnits += 1;
                        }
                    });
                }
            });

            const list = Object.entries(itemMap)
                .map(([name, qty], index) => ({ id: `log-${index}`, name, qty }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return { list, totalUnits, error: false };
        } catch (err) {
            console.error('[LOGISTICS-FATAL-ERROR]', err);
            return { list: [], totalUnits: 0, error: true };
        }
    }, [ordersData]);

    const { list: consolidatedList, totalUnits, error: calculationError } = consolidation;

    // 2. Filtro em Tempo Real
    const filteredList = useMemo(() => {
        return consolidatedList.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [consolidatedList, searchTerm]);

    // 3. Sistema de Seleção
    const toggleSelect = (id) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => setSelectedItemIds(filteredList.map(i => i.id));
    const handleDeselectAll = () => setSelectedItemIds([]);

    // 4. Ação de WhatsApp Segmentada
    const handleSendToSupplier = () => {
        const selectedItems = filteredList.filter(item => selectedItemIds.includes(item.id));

        if (selectedItems.length === 0) {
            alert('Aviso: Marque os itens que deseja enviar para o fornecedor.');
            return;
        }

        let text = `*PEDIDO DE COMPRA - LOGÍSTICA* 🚚%0A`;
        text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}%0A%0A`;

        selectedItems.forEach(item => {
            text += `• ${item.name}: *${item.qty} un*%0A`;
        });

        text += `%0A*Volume Total Selecionado: ${selectedItems.reduce((a, b) => a + b.qty, 0)} unidades*`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            {/* Header / Centro de Triagem */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl border-2 border-primary/30">
                            <Truck className="text-primary" size={32} />
                        </div>
                        Centro de Triagem e Fornecedores
                    </h1>
                    <p className="text-neutral-500 font-bold text-xs uppercase tracking-[0.3em] mt-2 ml-1">Consolidação e Gestão Segmentada</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <input
                            type="text"
                            placeholder="Filtrar por Marca/Fornecedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-neutral-600 shadow-2xl"
                        />
                        <Search size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    </div>
                </div>
            </div>

            {/* Contador de Volume (Card de Destaque) */}
            <div className={`mb-10 p-10 rounded-[3.5rem] shadow-2xl transition-all relative overflow-hidden group border-2 ${calculationError ? 'bg-red-500/10 border-red-500/50' : 'bg-gradient-to-br from-primary to-emerald-400 border-primary/20 shadow-primary/20'}`}>
                {calculationError ? (
                    <div className="flex items-center gap-4 text-red-500 relative z-10">
                        <AlertCircle size={48} />
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Erro ao calcular volume</h2>
                    </div>
                ) : (
                    <>
                        <PackageOpen size={200} className="absolute -right-12 -bottom-12 text-dark-900/10 group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10">
                            <span className="text-dark-900/60 font-black uppercase text-[11px] tracking-widest block mb-1">Monitor de Carga Consolidada</span>
                            <h2 className="text-4xl md:text-6xl font-black text-dark-900 uppercase italic tracking-tighter">
                                Volume Total: <span className="text-white underline decoration-dark-900/10">{totalUnits}</span> pacotes
                            </h2>
                            <p className="mt-4 text-dark-900/70 font-bold uppercase text-[10px] tracking-[0.4em]">Soma ativa de todos os pedidos marcados</p>
                        </div>
                    </>
                )}
            </div>

            {consolidatedList.length === 0 ? (
                <div className="bg-dark-800 border-2 border-dashed border-dark-700 rounded-[3.5rem] p-24 text-center">
                    <Calculator className="text-neutral-700 mx-auto mb-8" size={80} />
                    <p className="text-neutral-500 font-black text-xl uppercase tracking-widest max-w-sm mx-auto italic">Nenhum item para triagem.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {/* Ações de Seleção */}
                    <div className="flex flex-wrap items-center justify-between gap-6 bg-dark-900/50 p-6 rounded-3xl border border-dark-700">
                        <div className="flex gap-4">
                            <button onClick={handleSelectAll} className="px-6 py-4 bg-dark-800 hover:bg-white hover:text-dark-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-dark-700">Selecionar Todos</button>
                            <button onClick={handleDeselectAll} className="px-6 py-4 bg-dark-800 hover:bg-neutral-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-dark-700">Desmarcar</button>
                        </div>
                        <button
                            onClick={handleSendToSupplier}
                            disabled={selectedItemIds.length === 0}
                            className="bg-primary text-dark-900 font-black py-5 px-12 rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            Gerar Pedido para WhatsApp
                        </button>
                    </div>

                    {/* Tabela Principal */}
                    <div className="bg-dark-800 rounded-[3rem] border-2 border-dark-700 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-dark-900 border-b-2 border-dark-700 text-neutral-500 font-black uppercase text-[10px] tracking-[0.25em]">
                                <tr>
                                    <th className="p-8 w-24 text-center">Sel</th>
                                    <th className="p-8">Produto</th>
                                    <th className="p-8 text-right">Quantidade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {filteredList.map((item) => {
                                    const isSelected = selectedItemIds.includes(item.id);
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-dark-700/50 transition-all cursor-pointer group ${isSelected ? 'bg-primary/5' : ''}`}
                                            onClick={() => toggleSelect(item.id)}
                                        >
                                            <td className="p-8 text-center">
                                                <div className={`mx-auto w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary rotate-12 scale-110' : 'border-dark-600 group-hover:border-primary/40'}`}>
                                                    {isSelected && <Zap size={16} className="text-dark-900 fill-current" />}
                                                </div>
                                            </td>
                                            <td className="p-8 text-2xl font-black text-white italic tracking-tighter uppercase group-hover:text-primary transition-colors">
                                                {item.name}
                                            </td>
                                            <td className="p-8 text-right">
                                                <span className={`inline-block font-black px-6 py-3 rounded-2xl border-2 text-lg transition-all ${isSelected ? 'bg-primary text-dark-900 border-primary' : 'bg-dark-900 text-neutral-400 border-dark-700'}`}>
                                                    {item.qty} un
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
