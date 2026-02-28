import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Mail, MailOpen, Trash2, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { formatarNumeroWhats } from '../../utils/whatsapp';

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

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

    const handleReply = async (msg) => {
        try {
            // 1. Mark as read immediately to give feedback and clear alerts
            if (!msg.lida) {
                await toggleRead(msg.id, false);
            }

            // 2. Tentar extrair o Zap diretamente da gravação direta (prefixo)
            let phone = '';
            const matchWhats = msg.mensagem.match(/Whats:\s*(\d+)/);

            if (matchWhats) {
                phone = formatarNumeroWhats(matchWhats[1]);
                console.log('Número extraído via Prefixo Direct:', phone);
            } else {
                // Fallback: Busca na tabela de clientes (para mensagens antigas)
                const { data: clients } = await supabase
                    .from('clientes')
                    .select('whatsapp')
                    .or(`nome.ilike.%${msg.nome}%,estabelecimento.ilike.%${msg.estabelecimento}%`)
                    .eq('ativo', true)
                    .limit(1);

                if (clients && clients.length > 0) {
                    phone = formatarNumeroWhats(clients[0].whatsapp);
                }
            }

            if (!phone) {
                const manualPhone = prompt('AVISO: Número não encontrado na mensagem nem no cadastro. Por favor, digite o WhatsApp (com DDD) para responder:');
                if (!manualPhone) return;
                phone = formatarNumeroWhats(manualPhone);
            }

            // 3. Limpar o prefixo da mensagem para a citação (opcional, mas fica mais bonito)
            const cleanMessage = msg.mensagem.replace(/Whats:\s*\d+\s*\|\s*Mensagem:\s*/, '');

            // 4. Format message with citation
            const citation = `> ${cleanMessage}`;
            const text = `Olá *${msg.estabelecimento}*, respondendo sua dúvida sobre *${msg.assunto}*:%0A%0A${citation}%0A%0A*Sua Resposta:* `;

            const whatsappUrl = `https://wa.me/${phone}?text=${text}`;
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error('Erro ao processar resposta:', error);
            alert('Erro ao processar resposta via WhatsApp.');
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
        if (filter === 'unread') return !m.lida;
        return true;
    });

    const testSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => alert('Erro ao tocar som. O navegador pode estar bloqueando: ' + e.message));
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mensagens de Suporte</h1>
                    <p className="text-neutral-400 text-sm mt-1">Gerencie os contatos e sugestões dos clientes</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={testSound}
                        className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm font-bold border border-dark-600 transition-all flex items-center gap-2"
                    >
                        <CheckCircle size={16} />
                        Testar Som
                    </button>

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
                    </div>
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
                                        {msg.mensagem}
                                    </p>
                                </div>

                                <div className="flex md:flex-col gap-2 justify-end">
                                    <button
                                        onClick={() => handleReply(msg)}
                                        className="p-3 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 rounded-xl transition-all"
                                        title="Responder via WhatsApp"
                                    >
                                        <MessageCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => toggleRead(msg.id, msg.lida)}
                                        className={`p-3 rounded-xl transition-all ${msg.lida ? 'bg-dark-700 text-neutral-400 hover:text-white' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                                        title={msg.lida ? "Marcar como não lida" : "Marcar como lida"}
                                    >
                                        {msg.lida ? <MailOpen size={20} /> : <Mail size={20} />}
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
