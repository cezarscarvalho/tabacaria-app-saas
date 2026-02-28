import React, { useState } from 'react';
import { X, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SupportModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        nome: '',
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
        if (!formData.nome || !formData.estabelecimento || !formData.mensagem) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        const payload = {
            nome: formData.nome,
            estabelecimento: formData.estabelecimento,
            assunto: formData.assunto,
            mensagem: formData.mensagem,
            lida: false
        };

        console.log('Tentando salvar mensagem no Supabase:', payload);

        try {
            // 1. Save to Supabase
            const { error } = await supabase
                .from('mensagens')
                .insert([payload]);

            if (error) {
                console.error('Erro retornado pelo Supabase:', error);
                alert(`Erro ao gravar no banco: ${error.message}`);
                throw error;
            }

            // 2. Format WhatsApp message
            const text = `*NOVA MENSAGEM DE SUPORTE*%0A%0A*De:* ${formData.nome}%0A*Loja:* ${formData.estabelecimento}%0A*Assunto:* ${formData.assunto}%0A%0A*Mensagem:*%0A${formData.mensagem}`;

            const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5511988541006';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;

            // 3. Open WhatsApp
            window.open(whatsappUrl, '_blank');

            alert('Mensagem enviada com sucesso ao banco!');
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setFormData({ nome: '', estabelecimento: '', assunto: 'Dúvidas', mensagem: '' });
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error.message);
            alert('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                <div className="p-6 border-b border-dark-700 bg-dark-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-xl">
                            <MessageCircle className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Suporte Premium</h2>
                            <p className="text-neutral-400 text-xs">Fale diretamente com nossa equipe</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={40} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Mensagem Enviada!</h3>
                            <p className="text-neutral-400">Estamos abrindo o WhatsApp para você concluir o contato.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                        Seu Nome *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all placeholder:text-neutral-600"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                        Estabelecimento *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.estabelecimento}
                                        onChange={(e) => setFormData({ ...formData, estabelecimento: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all placeholder:text-neutral-600"
                                        placeholder="Nome da sua loja"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                    Assunto *
                                </label>
                                <select
                                    value={formData.assunto}
                                    onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                                >
                                    {subjects.map(s => (
                                        <option key={s} value={s} className="bg-dark-800">{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                    Como podemos ajudar? *
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.mensagem}
                                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all placeholder:text-neutral-600 resize-none"
                                    placeholder="Descreva sua dúvida, sugestão ou problema..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-3 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Enviar Mensagem</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
