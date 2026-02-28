import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, MessageCircle } from 'lucide-react';

export default function CartModal({ isOpen, onClose, cart, updateQuantity, removeItem, onCheckoutStarted }) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [storeName, setStoreName] = useState('');

    if (!isOpen) return null;

    const total = cart.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);

    const formatPrice = (price) => {
        const validPrice = typeof price === 'number' ? price : parseFloat(price);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(isNaN(validPrice) ? 0 : validPrice);
    };

    const handleCheckout = async () => {
        if (!customerName.trim() || !storeName.trim()) {
            alert('Por favor, preencha seu nome e o nome da loja para continuarmos com o pedido.');
            return;
        }

        setIsCheckingOut(true);

        try {
            // 1. Generate the WhatsApp message
            let text = `Olá!%0A%0A*Loja:* ${storeName.trim()}%0A*Responsável:* ${customerName.trim()}%0A%0AGostaria de fazer o pedido:%0A%0A`;

            let itemListText = [];
            cart.forEach(item => {
                const itemText = `${item.quantidade}x ${item.nome} (${formatPrice(item.preco_venda)})`;
                text += itemText + '%0A';
                itemListText.push(itemText);
            });

            text += `%0A*Total: ${formatPrice(total)}*`;

            const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5511988541006';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;

            // 2. Open WhatsApp (Only step for this modal)
            window.open(whatsappUrl, '_blank');

            // 3. Notify parent to show confirmation modal with order details
            if (onCheckoutStarted) {
                onCheckoutStarted({
                    total: total,
                    customerName: customerName.trim(),
                    storeName: storeName.trim(),
                    items: itemListText.join(', ')
                });
            }

            // 4. Close self
            onClose();

        } catch (error) {
            console.error('Erro no checkout:', error);
            alert(error.message || 'Ocorreu um erro ao processar seu pedido. Tente novamente.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-dark-700 bg-dark-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Seu Carrinho
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                    {cart.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500">
                            <p>Seu carrinho está vazio.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center gap-4 bg-dark-900 p-3 rounded-xl border border-dark-700">
                                    <div className="h-16 w-16 bg-dark-800 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.foto_url ? (
                                            <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 uppercase">Sem Foto</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-white truncate">{item.nome}</h4>
                                        <p className="text-primary font-bold text-sm">{formatPrice(item.preco_venda)}</p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center bg-dark-800 rounded-lg border border-dark-600">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                                                    className="p-1 text-neutral-400 hover:text-white transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-6 text-center text-sm font-medium text-white">
                                                    {item.quantidade}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                                                    className="p-1 text-neutral-400 hover:text-white transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-400 hover:text-red-300 p-1 transition-colors ml-auto"
                                                title="Remover item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-5 border-t border-dark-700 bg-dark-900/50 mt-auto">
                        <div className="space-y-3 mb-4">
                            <div>
                                <label htmlFor="storeName" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                                    Nome do Estabelecimento *
                                </label>
                                <input
                                    type="text"
                                    id="storeName"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="Nome da sua loja/comércio"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors placeholder:text-neutral-600"
                                />
                            </div>
                            <div>
                                <label htmlFor="customerName" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                                    Seu Nome (Responsável) *
                                </label>
                                <input
                                    type="text"
                                    id="customerName"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Como prefere ser chamado?"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors placeholder:text-neutral-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4 px-1">
                            <span className="text-neutral-400">Total do Pedido</span>
                            <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full bg-[#25D366] hover:bg-[#20bd5b] text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20 active:scale-[0.98] disabled:opacity-70"
                        >
                            {isCheckingOut ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Iniciando WhatsApp...</span>
                                </div>
                            ) : (
                                <>
                                    <MessageCircle size={20} />
                                    Finalizar Pedido via WhatsApp
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
