import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';

export default function ProductCard({ product, addToCart }) {
    const [added, setAdded] = useState(false);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price || 0);
    };

    const handleAddToCart = () => {
        if (addToCart) {
            addToCart(product);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    return (
        <div className="bg-dark-800 rounded-2xl overflow-hidden shadow-lg border border-dark-700 hover:border-primary transition-all duration-300 group flex flex-col h-full">
            <div className="relative aspect-square overflow-hidden bg-dark-900">
                {product.foto_url ? (
                    <img
                        src={product.foto_url}
                        alt={product.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs text-center uppercase">
                        Sem Foto
                    </div>
                )}
                <div className="absolute top-3 left-3 bg-dark-900/80 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full text-neutral-200 border border-dark-700 font-medium">
                    {product.embalagem || 'Unidade'}
                </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2 min-h-[56px] leading-tight">{product.nome}</h3>

                <div className="mt-auto pt-3 flex items-center justify-between mb-4">
                    <span className="text-xl sm:text-2xl font-black text-primary">{formatPrice(product.preco)}</span>
                </div>

                <button
                    onClick={handleAddToCart}
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${added
                            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                            : 'bg-primary hover:bg-primary-hover text-dark-900 shadow-[0_4px_14px_rgb(234,179,8,0.2)]'
                        }`}
                >
                    {added ? (
                        <>
                            <Check size={20} className="stroke-[3]" />
                            <span className="hidden sm:inline">Adicionado</span>
                        </>
                    ) : (
                        <>
                            <ShoppingCart size={20} className="stroke-[2.5]" />
                            <span>Adicionar</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
