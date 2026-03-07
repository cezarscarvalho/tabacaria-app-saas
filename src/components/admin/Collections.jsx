import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Send, UserCheck, UserMinus, MessageSquare, ShoppingCart } from 'lucide-react';
import { formatarNumeroWhats } from '../../utils/whatsapp';

export default function Collections() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleClient = (id) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(clientId => clientId !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const toggleAll = () => {
        if (selectedClients.length === filteredClients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(filteredClients.map(c => c.id));
        }
    };

    const handleSendReminder = (client) => {
        const phone = formatarNumeroWhats(client.whatsapp);
        if (!phone) {
            alert('Aviso: Número não cadastrado ou inválido para este cliente.');
            return;
        }

        const message = `Olá ${client.nome}, tudo bem? Aqui é da Tabacaria. Vimos aqui que você tem uma pendência com a gente. Podemos acertar?`;
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleSendOrderReminder = (client) => {
        const phone = formatarNumeroWhats(client.whatsapp);
        if (!phone) {
            alert('Aviso: Número não cadastrado ou inválido para este cliente.');
            return;
        }

        const message = `Olá *${client.nome}*, tudo bem? Aqui é da Tabacaria. Estamos fechando os pedidos da semana. Gostaria de repor algo?`;
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleSendBulkReminders = () => {
        if (selectedClients.length === 0) {
            alert('Selecione pelo menos um cliente.');
            return;
        }

        // In a real scenario, we might want to automate this more, 
        // but for wa.me we have to open tabs. We'll open the first one and suggest the rest.
        const firstClient = clients.find(c => c.id === selectedClients[0]);
        handleSendReminder(firstClient);

        if (selectedClients.length > 1) {
            alert(`Abri o WhatsApp para o primeiro cliente (${firstClient.nome}). Prossiga com os outros ${selectedClients.length - 1} selecionados um a um na lista.`);
        }
    };

    const filteredClients = clients.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.whatsapp && c.whatsapp.includes(searchTerm))
    );

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Cobrança Ativa</h1>
                    <p className="text-neutral-400 text-sm mt-1">Envie lembretes de pagamento para seus clientes</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleSendBulkReminders}
                        disabled={selectedClients.length === 0}
                        className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Send size={18} />
                        Cobrar Selecionados ({selectedClients.length})
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-dark-700 bg-dark-900/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Filtrar por nome ou zap..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                    </div>

                    <button
                        onClick={toggleAll}
                        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                        {selectedClients.length === filteredClients.length ? (
                            <><UserMinus size={18} /> Desmarcar Todos</>
                        ) : (
                            <><UserCheck size={18} /> Selecionar Todos</>
                        )}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-900/50 border-b border-dark-700 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                <th className="py-4 px-6 w-16 text-center">Sel.</th>
                                <th className="py-4 px-6">Cliente</th>
                                <th className="py-4 px-6">WhatsApp</th>
                                <th className="py-4 px-6 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-neutral-500 font-medium">
                                        Nenhum cliente ativo encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        onClick={() => toggleClient(client.id)}
                                        className={`hover:bg-dark-700/30 transition-colors cursor-pointer ${selectedClients.includes(client.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="py-4 px-6 text-center">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedClients.includes(client.id) ? 'bg-primary border-primary' : 'border-dark-600 bg-dark-900'}`}>
                                                {selectedClients.includes(client.id) && <UserCheck size={12} className="text-dark-900 stroke-[3]" />}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-white text-base">{client.nome}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-neutral-400 font-medium">{client.whatsapp || 'N/A'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendOrderReminder(client);
                                                    }}
                                                    className="bg-primary/10 hover:bg-primary text-primary hover:text-dark-900 p-2.5 rounded-xl transition-all flex items-center gap-2"
                                                    title="Lembrete de Pedido"
                                                >
                                                    <ShoppingCart size={18} />
                                                    <span className="text-xs font-bold uppercase hidden sm:inline">Lembrete</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendReminder(client);
                                                    }}
                                                    className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white p-2.5 rounded-xl transition-all flex items-center gap-2"
                                                    title="Enviar cobrança via WhatsApp"
                                                >
                                                    <MessageSquare size={18} />
                                                    <span className="text-xs font-bold uppercase hidden sm:inline">Cobrar</span>
                                                </button>
                                            </div>
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
