import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, MailOpen, Trash2, Clock, MessageCircle } from 'lucide-react';
import { formatarNumeroWhats } from '../../utils/whatsapp';

export default function Messages({ messagesData, refreshFunc }) {
    const messages = messagesData || [];

    const toggleRead = async (id, currentStatus) => {
        try {
            await supabase.from('mensagens').update({ lida: !currentStatus }).eq('id', id);
            if (refreshFunc) refreshFunc();
        } catch (error) {
            console.error('Erro:', error.message);
        }
    };

    const handleReply = (msg) => {
        // Tenta extrair o Zap diretamente da gravação direta (prefixo)
        let phone = '';
        const matchWhats = msg.mensagem.match(/Whats:\s*(\d+)/);
        if (matchWhats) {
            phone = formatarNumeroWhats(matchWhats[1]);
        }

        if (!phone) {
            const manualPhone = prompt('Digite o WhatsApp do cliente (com DDD):');
            if (!manualPhone) return;
            phone = formatarNumeroWhats(manualPhone);
        }

        const cleanMessage = msg.mensagem.replace(/Whats:\s*\d+\s*\|\s*Mensagem:\s*/, '');
        const citation = `> ${cleanMessage}`;
        const text = `Olá *${msg.estabelecimento}*, respondendo sua dúvida sobre *${msg.assunto}*:%0A%0A${citation}%0A%0A*Sua Resposta:* `;
        const whatsappUrl = `https://wa.me/${phone}?text=${text}`;
        window.open(whatsappUrl, '_blank');

        if (!msg.lida) toggleRead(msg.id, false);
    };

    const deleteMessage = async (id) => {
        if (!confirm('Excluir mensagem?')) return;
        await supabase.from('mensagens').delete().eq('id', id);
        if (refreshFunc) refreshFunc();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Mensagens de Suporte</h1>

            <div className="grid gap-6">
                {messages.length === 0 ? (
                    <div className="p-20 text-center bg-dark-800 border-2 border-dashed border-dark-700 rounded-3xl">
                        <Mail className="mx-auto text-dark-600 mb-4" size={48} />
                        <p className="text-neutral-500 font-bold uppercase tracking-widest">Caixa de entrada vazia</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`bg-dark-800 border-2 rounded-3xl p-8 transition-all hover:border-primary/20 group ${!msg.lida ? 'border-primary shadow-2xl shadow-primary/5' : 'border-dark-700'}`}>
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="font-black text-white text-xl tracking-tighter uppercase italic">{msg.nome}</span>
                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{msg.estabelecimento}</span>
                                        {!msg.lida && <span className="bg-primary text-dark-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">Novo</span>}
                                    </div>
                                    <div className="flex items-center gap-4 mb-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                                        <Clock size={12} /> {formatDate(msg.created_at)}
                                        <span className="text-dark-600">|</span>
                                        <span className="text-neutral-400">Assunto: {msg.assunto}</span>
                                    </div>
                                    <div className="bg-dark-900/80 p-6 rounded-2xl border border-dark-700 text-neutral-300 leading-relaxed italic border-l-4 border-l-primary">
                                        "{msg.mensagem}"
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-3 justify-end items-center">
                                    <button onClick={() => handleReply(msg)} className="w-14 h-14 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg hover:shadow-emerald-500/20">
                                        <MessageCircle size={24} />
                                    </button>
                                    <button onClick={() => toggleRead(msg.id, msg.lida)} className={`w-14 h-14 rounded-2xl transition-all flex items-center justify-center border-2 ${msg.lida ? 'bg-dark-700 text-neutral-500 border-dark-600 hover:text-white' : 'bg-primary/10 text-primary border-primary hover:bg-primary hover:text-dark-900'}`}>
                                        {msg.lida ? <MailOpen size={24} /> : <Mail size={24} />}
                                    </button>
                                    <button onClick={() => deleteMessage(msg.id)} className="w-14 h-14 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg hover:shadow-red-500/20">
                                        <Trash2 size={24} />
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
