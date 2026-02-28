import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Calculator, ClipboardCheck, Search, CheckSquare, Square, CheckCircle2, Zap } from 'lucide-react';

export default function Logistics({ ordersData, refreshFunc }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemNames, setSelectedItemNames] = useState([]);

    // 1. Consolidação Inteligente (useMemo para performance e estabilidade)
    const consolidatedList = useMemo(() => {
        const orders = ordersData || [];
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

        return Object.entries(itemMap)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [ordersData]);

    // 2. Filtro de Busca
    const filteredList = useMemo(() => {
        return consolidatedList.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [consolidatedList, searchTerm]);

    // 3. Sistema de Seleção
    const toggleSelect = (name) => {
        setSelectedItemNames(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const handleSelectAll = () => {
        setSelectedItemNames(filteredList.map(i => i.name));
    };

    const handleDeselectAll = () => {
        setSelectedItemNames([]);
    };

    // 4. Contadores de Volume
    const totalSelectedUnits = useMemo(() => {
        return filteredList
            .filter(item => selectedItemNames.includes(item.name))
            .reduce((acc, item) => acc + item.qty, 0);
    }, [filteredList, selectedItemNames]);

    const handleSendToSupplier = () => {
        const itemsToDispatch = filteredList.filter(item => selectedItemNames.includes(item.name));

        if (itemsToDispatch.length === 0) {
            alert('Por favor, selecione ao menos um item para gerar o pedido.');
            return;
        }

        let text = `*PEDIDO DE COMPRA - ITENS SELECIONADOS* 📦%0A`;
        text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}%0A`;
        text += `*Volume Total:* ${totalSelectedUnits} unidades%0A%0A`;

        itemsToDispatch.forEach(item => {
            text += `• ${item.name}: *${item.qty} un*%0A`;
        });

        text += `%0A_Gerado via Painel Admin Premium_`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header / Triagem */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3 italic">
                        <Truck className="text-primary" /> Gestão de Logística
                    </h1>
                    <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest mt-1">Consolidação e Pedidos Automáticos</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Filtrar por Marca/Produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-800 border border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold"
                        />
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    </div>
                </div>
            </div>

            {consolidatedList.length === 0 ? (
                <div className="bg-dark-800 border-2 border-dashed border-dark-700 rounded-[3rem] p-24 text-center">
                    <Calculator className="text-neutral-700 mx-auto mb-8" size={80} />
                    <p className="text-neutral-500 font-bold text-xl uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                        Nenhum item marcado para logística em 'Vendas'.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Lista Principal */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        {/* Ferramentas de Seleção e Contador */}
                        <div className="bg-dark-800 rounded-3xl p-6 border border-dark-700 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Selecionar Todos
                                </button>
                                <button
                                    onClick={handleDeselectAll}
                                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Limpar
                                </button>
                            </div>

                            <div className="bg-primary/20 px-6 py-2 rounded-2xl border border-primary/30 flex items-center gap-4">
                                <div className="text-primary font-black text-center border-r border-primary/20 pr-4">
                                    <span className="text-[10px] uppercase block">Itens na Lista</span>
                                    <span className="text-xl leading-none italic">{filteredList.length}</span>
                                </div>
                                <div className="text-primary font-black text-center">
                                    <span className="text-[10px] uppercase block">Total de Pacotes</span>
                                    <span className="text-xl leading-none italic">{totalSelectedUnits}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-800 rounded-[2.5rem] border border-dark-700 overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-dark-900/50 border-b border-dark-700">
                                    <tr>
                                        <th className="p-6 w-16"></th>
                                        <th className="p-6 text-[10px] font-black uppercase text-neutral-500 tracking-widest">Produto / Marca</th>
                                        <th className="p-6 text-right text-[10px] font-black uppercase text-neutral-500 tracking-widest text-right">Qtd</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {filteredList.map((item, idx) => {
                                        const isSelected = selectedItemNames.includes(item.name);
                                        return (
                                            <tr
                                                key={idx}
                                                className={`hover:bg-dark-700/30 transition-colors cursor-pointer group ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => toggleSelect(item.name)}
                                            >
                                                <td className="p-6">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-dark-600 group-hover:border-primary/50'}`}>
                                                        {isSelected && <Zap size={14} className="text-dark-900 fill-current" />}
                                                    </div>
                                                </td>
                                                <td className="p-6 font-bold text-white italic text-lg tracking-tight uppercase group-hover:translate-x-1 transition-transform">{item.name}</td>
                                                <td className="p-6 text-right">
                                                    <span className={`font-black px-4 py-2 rounded-xl border text-sm transition-all ${isSelected ? 'bg-primary text-dark-900 border-primary shadow-lg shadow-primary/20' : 'bg-dark-700 text-neutral-400 border-dark-600'}`}>
                                                        {item.qty} un
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredList.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-20 text-center text-neutral-600 font-bold italic">Nenhum item filtrado encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar de Ações */}
                    <div className="flex flex-col gap-8">
                        <div className="bg-primary rounded-[2.5rem] p-10 text-dark-900 shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <Truck size={120} className="absolute -bottom-10 -right-10 text-dark-900/10 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black uppercase mb-4 leading-tight italic">Gerar Pedido Segmentado</h3>
                            <p className="text-sm font-bold mb-8 text-dark-900/70 uppercase">
                                Você selecionou {selectedItemNames.length} itens únicos, totalizando {totalSelectedUnits} unidades de carga.
                            </p>
                            <button
                                onClick={handleSendToSupplier}
                                disabled={selectedItemNames.length === 0}
                                className="w-full bg-dark-900 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                WhatsApp Fornecedor
                            </button>
                        </div>

                        <div className="bg-dark-800 border border-dark-700 rounded-[2.5rem] p-10 text-center">
                            <div className="flex justify-center mb-6">
                                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                                    <ClipboardCheck size={32} className="text-primary" />
                                </div>
                            </div>
                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-4">Sincronização de Dados</p>
                            <button onClick={refreshFunc} className="w-full text-white bg-dark-700 hover:bg-dark-600 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest">
                                Atualizar Base de Pedidos
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-[2.5rem] p-10">
                            <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-6 block border-b border-dark-700 pb-4">Dicas de Triagem</h4>
                            <ul className="text-left space-y-4">
                                <li className="flex gap-3 text-xs text-neutral-400 font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                                    Use a busca para isolar marcas específicas (Ex: Pety)
                                </li>
                                <li className="flex gap-3 text-xs text-neutral-400 font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                                    O contador de volumes ajuda a planejar fretes por peso
                                </li>
                                <li className="flex gap-3 text-xs text-neutral-400 font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                                    Selecione apenas itens do mesmo fornecedor antes de enviar
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
