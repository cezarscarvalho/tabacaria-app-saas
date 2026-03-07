import React, { useState } from 'react';
import { X, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarNumeroWhats } from '../utils/whatsapp';

export default function SupportModal({ isOpen, onClose, settingsData }) {
    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
        estabelecimento: '',
        assunto: 'Dúvidas',
        mensagem: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const subjects = [
        'Dúvidas',
        'Produto veio errado',
        'Não achei no catálogo',
        'Sugestões',
        'Outros'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome || !formData.whatsapp || !formData.estabelecimento || !formData.mensagem) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsSubmitting(true);

        const cleanZap = formatarNumeroWhats(formData.whatsapp);
        const prefixoMsg = `Whats: ${cleanZap} | Mensagem: `;

        const payload = {
            nome: formData.nome,
            estabelecimento: formData.estabelecimento,
            assunto: formData.assunto,
            mensagem: `${prefixoMsg}${formData.mensagem}`,
            lida: false
        };

        try {
            const { error } = await supabase.from('mensagens').insert([payload]);
            if (error) throw error;

            const text = `*NOVA MENSAGEM DE SUPORTE*%0A%0A*De:* ${formData.nome}%0A*Zap:* ${cleanZap}%0A*Loja:* ${formData.estabelecimento}%0A*Assunto:* ${formData.assunto}%0A%0A*Mensagem:*%0A${formData.mensagem}`;

            // USO DO NÚMERO DINÂMICO DAS CONFIGURAÇÕES
            const targetNumber = settingsData?.whatsapp_suporte || import.meta.env.VITE_WHATSAPP_NUMBER || '5511988541006';
            const phoneNumber = formatarNumeroWhats(targetNumber);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;

            setIsSuccess(true);
            window.open(whatsappUrl, '_blank');

            setTimeout(() => {
                setIsSuccess(false);
                setFormData({ nome: '', whatsapp: '', estabelecimento: '', assunto: 'Dúvidas', mensagem: '' });
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error.message);
            alert('Erro ao enviar mensagem.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-dark-800 border-2 border-primary/20 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                <div className="p-8 border-b border-dark-700 bg-dark-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl">
                            <MessageCircle className="text-primary" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Suporte VIP</h2>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">{settingsData?.nome_estabelecimento || 'Premium Service'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-2 bg-dark-700 rounded-xl">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {isSuccess ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 border-2 border-emerald-500/30">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 uppercase italic">Sucesso!</h3>
                            <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">Abrindo conversa no WhatsApp...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Seu Nome *</label>
                                    <input
                                        type="text" required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary transition-all font-bold"
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Seu WhatsApp *</label>
                                    <input
                                        type="text" required
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary transition-all font-mono"
                                        placeholder="11 99999-9999"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Estabelecimento *</label>
                                    <input
                                        type="text" required
                                        value={formData.estabelecimento}
                                        onChange={(e) => setFormData({ ...formData, estabelecimento: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary transition-all font-bold"
                                        placeholder="Nome da loja"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Assunto *</label>
                                    <select
                                        value={formData.assunto}
                                        onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary transition-all font-black uppercase text-xs tracking-widest cursor-pointer"
                                    >
                                        {subjects.map(s => <option key={s} value={s} className="bg-dark-800">{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Mensagem *</label>
                                <textarea
                                    required rows="3"
                                    value={formData.mensagem}
                                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary transition-all resize-none italic"
                                    placeholder="Como podemos ajudar?"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
                            >
                                {isSubmitting ? <div className="w-6 h-6 border-3 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div> : <><Send size={20} /> Enviar Mensagem</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
