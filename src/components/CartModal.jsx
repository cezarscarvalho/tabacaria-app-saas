import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, MessageCircle, Store, User } from 'lucide-react';
import { formatarNumeroWhats } from '../utils/whatsapp';

export default function CartModal({ isOpen, onClose, cart, updateQuantity, removeItem, onCheckoutStarted, settingsData }) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [storeNameForm, setStoreNameForm] = useState('');

    if (!isOpen) return null;

    const total = cart.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const handleCheckout = async () => {
        if (!customerName.trim() || !storeNameForm.trim()) {
            alert('Por favor, preencha seu nome e o nome da loja.');
            return;
        }

        setIsCheckingOut(true);

        try {
            let text = `Olá!%0A%0A*Loja:* ${storeNameForm.trim()}%0A*Responsável:* ${customerName.trim()}%0A%0AGostaria de fazer o pedido:%0A%0A`;

            let itemListText = [];
            cart.forEach(item => {
                const itemText = `${item.quantidade}x ${item.nome} (${formatPrice(item.preco_venda)})`;
                text += itemText + '%0A';
                itemListText.push(itemText);
            });

            text += `%0A*Total: ${formatPrice(total)}*`;

            // USO DO NÚMERO DINÂMICO DAS CONFIGURAÇÕES
            const targetNumber = settingsData?.whatsapp_suporte || import.meta.env.VITE_WHATSAPP_NUMBER || '5511988541006';
            const phoneNumber = formatarNumeroWhats(targetNumber);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;

            window.open(whatsappUrl, '_blank');

            if (onCheckoutStarted) {
                onCheckoutStarted({
                    total: total,
                    customerName: customerName.trim(),
                    storeName: storeNameForm.trim(),
                    items: itemListText.join(', ')
                });
            }
            onClose();

        } catch (error) {
            console.error('Erro no checkout:', error);
            alert('Erro ao processar pedido.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 border-2 border-dark-700 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-8 border-b border-dark-700 bg-dark-900/50">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Carrinho</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-2 bg-dark-700 rounded-xl">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {cart.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs italic italic">O carrinho está limpo.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex items-center gap-6 bg-dark-900/40 p-4 rounded-3xl border border-dark-700 hover:border-primary/20 transition-all">
                                <div className="h-20 w-20 bg-dark-800 rounded-2xl overflow-hidden flex-shrink-0 border border-dark-700">
                                    {item.foto_url ? (
                                        <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600 font-black uppercase">No Pic</div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{item.nome}</h4>
                                    <p className="text-primary font-black text-base italic">{formatPrice(item.preco_venda)}</p>

                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center bg-dark-800 rounded-xl border border-dark-600 p-1">
                                            <button onClick={() => updateQuantity(item.id, item.quantidade - 1)} className="p-1 px-2 text-neutral-400 hover:text-white transition-colors"><Minus size={14} /></button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantidade}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                className="w-10 bg-transparent text-center text-sm font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button onClick={() => updateQuantity(item.id, item.quantidade + 1)} className="p-1 px-2 text-neutral-400 hover:text-white transition-colors"><Plus size={14} /></button>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-red-500/50 hover:text-red-500 transition-colors p-2 bg-red-500/5 rounded-lg active:scale-95 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-8 border-t border-dark-700 bg-dark-900/50 mt-auto">
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
                                <input
                                    type="text"
                                    value={storeNameForm}
                                    onChange={(e) => setStoreNameForm(e.target.value)}
                                    placeholder="Nome do seu estabelecimento *"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-2xl p-4 pl-12 text-sm text-white outline-none focus:border-primary font-bold"
                                />
                            </div>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Seu nome (Responsável) *"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-2xl p-4 pl-12 text-sm text-white outline-none focus:border-primary font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8 px-2">
                            <span className="text-neutral-500 font-black uppercase text-[10px] tracking-widest">Subtotal</span>
                            <span className="text-3xl font-black text-white italic tracking-tighter">{formatPrice(total)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full bg-[#25D366] hover:scale-[1.02] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm"
                        >
                            {isCheckingOut ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <><MessageCircle size={24} /> Finalizar via WhatsApp</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
