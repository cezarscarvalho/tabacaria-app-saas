import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function CheckoutConfirmationModal({ isOpen, onClose, orderData, onConfirm }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const statusString = `Confirmado pelo cliente | Loja: ${orderData.storeName} | Resp: ${orderData.customerName} - ${orderData.items}`;

            const { error } = await supabase
                .from('pedidos')
                .insert([{
                    valor_total: orderData.total,
                    status: statusString
                }]);

            if (error) {
                console.error('Erro ao registrar pedido no Supabase:', error);
                alert('Aviso: Não conseguimos salvar o histórico do seu pedido no sistema, mas relaxe! Seu WhatsApp já foi enviado e nós vamos te atender normalmente.');
            }

            setIsSuccess(true);
            setTimeout(() => {
                onConfirm(); // Clear cart and close
            }, 2000);
        } catch (error) {
            console.error('Erro geral na confirmação:', error);
            alert('Aviso: Ocorreu um erro técnico ao registrar o pedido. Como você já enviou o WhatsApp, vamos limpar seu carrinho agora.');
            onConfirm();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
                {isSuccess ? (
                    <div className="p-10 text-center flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Pedido Registrado!</h2>
                        <p className="text-neutral-400">Obrigado pela preferência. Já estamos processando seu pedido.</p>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <CheckCircle2 size={24} className="text-emerald-500" />
                            </div>
                            <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Confirmação de Envio</h2>
                        <p className="text-neutral-400 mb-8">
                            Você enviou a mensagem do seu pedido no nosso WhatsApp?
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Sim, já enviei!'
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full bg-dark-700 hover:bg-dark-600 text-neutral-300 font-semibold py-4 rounded-2xl transition-all"
                            >
                                Ainda não
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
