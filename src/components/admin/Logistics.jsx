import React, { useState, useMemo } from 'react';
import { Truck, Calculator, ClipboardCheck, Search, Zap, PackageOpen } from 'lucide-react';

export default function Logistics({ ordersData, refreshFunc }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemNames, setSelectedItemNames] = useState([]);

    // 1. Consolidação com Try/Catch de Segurança (Regra de Ouro: Estabilidade)
    const { consolidatedList, absoluteTotalUnits } = useMemo(() => {
        const itemMap = {};
        let total = 0;

        try {
            const orders = ordersData || [];
            const confirmedOrders = orders.filter(o => o.enviado_logistica === true);

            confirmedOrders.forEach(order => {
                const status = order.status || '';
                // O status contém: "Data - item1 (Qty), item2 (Qty)..."
                const parts = status.split(' - ');
                if (parts.length >= 2) {
                    const itemsArray = parts[1].split(', ');
                    itemsArray.forEach(rawItem => {
                        // Regex flexível para capturar nome e quantidade
                        const match = rawItem.match(/(.+) \((\d+)[x| un]*\)/i) || rawItem.match(/^(\d+)[x| un]*\s+(.+)$/i);
                        if (match) {
                            const name = (match[1].match(/^\d+/) ? match[2] : match[1]).trim();
                            const qty = parseInt(match[1].match(/^\d+/) ? match[1] : match[2]);
                            const validQty = isNaN(qty) ? 1 : qty;

                            itemMap[name] = (itemMap[name] || 0) + validQty;
                            total += validQty;
                        } else if (rawItem.trim()) {
                            const fallbackName = rawItem.trim();
                            itemMap[fallbackName] = (itemMap[fallbackName] || 0) + 1;
                            total += 1;
                        }
                    });
                }
            });
        } catch (err) {
            console.error('[LOGISTICS-ERROR] Erro crítico na soma:', err.message);
            // Retorna vazio em caso de erro para não quebrar o Admin
            return { consolidatedList: [], absoluteTotalUnits: 0 };
        }

        const list = Object.entries(itemMap)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return { consolidatedList: list, absoluteTotalUnits: total };
    }, [ordersData]);

    // 2. Filtro em Tempo Real (Triagem por Marca/Produto)
    const filteredList = useMemo(() => {
        return consolidatedList.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [consolidatedList, searchTerm]);

    // 3. Sistema de Seleção Segmentada
    const toggleSelect = (name) => {
        setSelectedItemNames(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const handleSelectAll = () => setSelectedItemNames(filteredList.map(i => i.name));
    const handleDeselectAll = () => setSelectedItemNames([]);

    const handleSendToSupplier = () => {
        const selectedItems = filteredList.filter(item => selectedItemNames.includes(item.name));

        if (selectedItems.length === 0) {
            alert('Aviso: Selecione ao menos um item para enviar.');
            return;
        }

        let text = `*PEDIDO DE COMPRA - LOGÍSTICA* 🚚%0A`;
        text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}%0A%0A`;

        selectedItems.forEach(item => {
            text += `• ${item.name}: *${item.qty} un*%0A`;
        });

        text += `%0A_Total de Itens Marcados: ${selectedItems.length}_`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header e Triagem */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3 italic">
                        <Truck className="text-primary" /> Logística / Fornecedores
                    </h1>
                    <p className="text-neutral-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">Triagem de Carga e Pedidos</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <input
                            type="text"
                            placeholder="Filtrar produtos ou marcas (Ex: Zomo)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-800 border-2 border-dark-700 rounded-[1.25rem] pl-12 pr-6 py-4 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-neutral-600 shadow-xl"
                        />
                        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    </div>
                </div>
            </div>

            {consolidatedList.length === 0 ? (
                <div className="bg-dark-800 border-2 border-dashed border-dark-700 rounded-[3.5rem] p-24 text-center">
                    <Calculator className="text-neutral-700 mx-auto mb-8" size={80} />
                    <p className="text-neutral-500 font-black text-xl uppercase tracking-widest max-w-sm mx-auto italic">
                        Nenhum pedido marcado como 'Enviado para Logística'.
                    </p>
                    <button onClick={refreshFunc} className="mt-8 text-primary font-bold underline uppercase text-xs tracking-widest hover:text-white transition-colors">Sincronizar Agora</button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Card de Volume Total (DESTAQUE) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-gradient-to-br from-primary to-emerald-400 p-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <PackageOpen size={180} className="absolute -right-10 -bottom-10 text-dark-900/10 group-hover:rotate-12 transition-transform duration-500" />
                            <div className="relative z-10">
                                <span className="text-dark-900/60 font-black uppercase text-[10px] tracking-widest block mb-2">Monitor de Carga Total</span>
                                <h2 className="text-4xl md:text-5xl font-black text-dark-900 uppercase italic tracking-tighter">
                                    Volume Total: <span className="text-white underline decoration-dark-900/20">{absoluteTotalUnits}</span> pacotes
                                </h2>
                                <p className="mt-4 text-dark-900/70 font-bold uppercase text-[10px] tracking-[0.3em]">Cálculo instantâneo de pacotes ativos</p>
                            </div>
                        </div>

                        <div className="bg-dark-800 border-2 border-dark-700 p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center shadow-xl">
                            <div className="flex gap-3 mb-6">
                                <button onClick={handleSelectAll} className="px-5 py-3 bg-dark-700 hover:bg-white hover:text-dark-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Selecionar Todos</button>
                                <button onClick={handleDeselectAll} className="px-5 py-3 bg-dark-700 hover:bg-red-500 hover:text-white text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Limpar</button>
                            </div>
                            <button
                                onClick={handleSendToSupplier}
                                disabled={selectedItemNames.length === 0}
                                className="w-full bg-primary text-dark-900 font-black py-5 rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                Enviar Selecionados para WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Tabela de Triagem */}
                    <div className="bg-dark-800 rounded-[3rem] border-2 border-dark-700 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-dark-900/60 border-b-2 border-dark-700">
                                <tr>
                                    <th className="p-8 w-20"></th>
                                    <th className="p-8 text-[11px] font-black uppercase text-neutral-500 tracking-[0.2em]">Produto / Marca</th>
                                    <th className="p-8 text-right text-[11px] font-black uppercase text-neutral-500 tracking-[0.2em]">Quantidade Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {filteredList.map((item, idx) => {
                                    const isSelected = selectedItemNames.includes(item.name);
                                    return (
                                        <tr
                                            key={idx}
                                            className={`hover:bg-dark-700/40 transition-all cursor-pointer group ${isSelected ? 'bg-primary/5' : ''}`}
                                            onClick={() => toggleSelect(item.name)}
                                        >
                                            <td className="p-8">
                                                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary rotate-12' : 'border-dark-600 group-hover:border-primary/40'}`}>
                                                    {isSelected && <Zap size={16} className="text-dark-900 fill-current" />}
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <span className="font-black text-white italic text-xl tracking-tight uppercase group-hover:text-primary transition-colors">{item.name}</span>
                                            </td>
                                            <td className="p-8 text-right">
                                                <span className={`inline-block font-black px-6 py-3 rounded-2xl border-2 text-base transition-all ${isSelected ? 'bg-primary text-dark-900 border-primary shadow-lg shadow-primary/20 scale-110' : 'bg-dark-900 text-neutral-400 border-dark-700'}`}>
                                                    {item.qty} pacotes
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredList.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-24 text-center text-neutral-600 font-bold italic uppercase tracking-widest text-sm">Nenhum resultado para "{searchTerm}"</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
