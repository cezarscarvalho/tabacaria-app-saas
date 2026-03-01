import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

export default function ProductDetailsModal({ isOpen, onClose, product, addToCart }) {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen) setQuantity(1);
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const handleAdd = () => {
        if (addToCart) {
            addToCart({ ...product, quantidade: quantity });
            onClose();
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-dark-800 border-2 border-dark-700 rounded-[3rem] w-full max-w-2xl shadow-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-dark-700/80 backdrop-blur-md rounded-2xl text-neutral-400 hover:text-white transition-all z-10 hover:bg-dark-600"
                >
                    <X size={24} />
                </button>

                {/* Imagem do Produto */}
                <div className="w-full md:w-1/2 h-64 md:h-auto bg-dark-900 relative">
                    {product.foto_url ? (
                        <img src={product.foto_url} alt={product.nome} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 font-black uppercase tracking-widest italic">Sem Foto</div>
                    )}
                </div>

                {/* Informações e Compra */}
                <div className="flex-1 p-8 md:p-12 flex flex-col">
                    <div className="mb-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase leading-none mb-2 tracking-tighter">{product.nome}</h2>
                        {product.embalagem && <span className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] italic block mb-4">{product.embalagem}</span>}
                        <p className="text-primary text-3xl font-black italic mb-8">{formatPrice(product.preco_venda)}</p>

                        <div className="space-y-4 mb-10">
                            <label className="text-neutral-500 font-black uppercase text-[10px] tracking-widest italic block">Selecione a Quantidade</label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-dark-900 border-2 border-dark-700 rounded-2xl p-2 shrink-0">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 text-neutral-400 hover:text-primary transition-colors"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 bg-transparent text-center text-2xl font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-3 text-neutral-400 hover:text-primary transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="text-neutral-500 font-bold italic text-sm">
                                    Total: <span className="text-white">{formatPrice(product.preco_venda * quantity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 text-lg uppercase tracking-widest"
                    >
                        <ShoppingCart size={24} /> Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        </div>
    );
}
