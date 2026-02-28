import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Mail, MailOpen, Archive, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, archived

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mensagens')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleRead = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('mensagens')
                .update({ lida: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.map(m => m.id === id ? { ...m, lida: !currentStatus } : m));
        } catch (error) {
            console.error('Erro ao atualizar status da mensagem:', error.message);
        }
    };

    const toggleArchive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('mensagens')
                .update({ arquivada: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.map(m => m.id === id ? { ...m, arquivada: !currentStatus } : m));
        } catch (error) {
            console.error('Erro ao arquivar mensagem:', error.message);
        }
    };

    const deleteMessage = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;
        try {
            const { error } = await supabase
                .from('mensagens')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.filter(m => m.id !== id));
        } catch (error) {
            console.error('Erro ao excluir mensagem:', error.message);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'unread') return !m.lida && !m.arquivada;
        if (filter === 'archived') return m.arquivada;
        return !m.arquivada;
    });

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mensagens de Suporte</h1>
                    <p className="text-neutral-400 text-sm mt-1">Gerencie os contatos e sugestões dos clientes</p>
                </div>

                <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-dark-900 shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread' ? 'bg-primary text-dark-900 shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Não Lidas
                    </button>
                    <button
                        onClick={() => setFilter('archived')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'archived' ? 'bg-primary text-dark-900 shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Arquivadas
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="py-20 text-center text-neutral-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Carregando conversas...</p>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="py-20 text-center bg-dark-800 rounded-2xl border border-dark-700 border-dashed">
                        <Mail className="mx-auto text-neutral-600 mb-4" size={48} />
                        <p className="text-neutral-400 font-medium">Nenhuma mensagem encontrada nesta categoria.</p>
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`bg-dark-800 border rounded-2xl p-6 transition-all hover:bg-dark-700/50 group ${!msg.lida ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-dark-700'}`}
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-white text-lg">{msg.nome}</span>
                                        <span className="text-neutral-500 text-sm">•</span>
                                        <span className="text-primary text-sm font-bold uppercase tracking-wider">{msg.estabelecimento}</span>
                                        {!msg.lida && (
                                            <span className="bg-primary text-dark-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ml-2 animate-pulse">Novo</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                        <Clock size={12} />
                                        <span>{formatDate(msg.created_at)}</span>
                                        <span className="mx-2">|</span>
                                        <span>Assunto: {msg.assunto}</span>
                                    </div>
                                    <p className="text-neutral-300 leading-relaxed bg-dark-900/50 p-4 rounded-xl border border-dark-700/50">
                                        {msg.conteudo}
                                    </p>
                                </div>

                                <div className="flex md:flex-col gap-2 justify-end">
                                    <button
                                        onClick={() => toggleRead(msg.id, msg.lida)}
                                        className={`p-3 rounded-xl transition-all ${msg.lida ? 'bg-dark-700 text-neutral-400 hover:text-white' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                                        title={msg.lida ? "Marcar como não lida" : "Marcar como lida"}
                                    >
                                        {msg.lida ? <MailOpen size={20} /> : <Mail size={20} />}
                                    </button>
                                    <button
                                        onClick={() => toggleArchive(msg.id, msg.arquivada)}
                                        className={`p-3 rounded-xl transition-all ${msg.arquivada ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-dark-700 text-neutral-400 hover:text-white'}`}
                                        title={msg.arquivada ? "Desarquivar" : "Arquivar"}
                                    >
                                        <Archive size={20} />
                                    </button>
                                    <button
                                        onClick={() => deleteMessage(msg.id)}
                                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                                        title="ExcluirPermanentemente"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
