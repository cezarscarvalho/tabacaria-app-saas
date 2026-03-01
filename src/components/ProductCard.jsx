import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';

export default function ProductCard({ product, onDetails }) {
    const formatPrice = (price) => {
        const validPrice = typeof price === 'number' ? price : parseFloat(price);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(isNaN(validPrice) ? 0 : validPrice);
    };

    return (
        <div
            onClick={() => onDetails && onDetails(product)}
            className="bg-dark-800 rounded-3xl overflow-hidden shadow-lg border border-dark-700 hover:border-primary transition-all duration-300 group flex flex-col h-full cursor-pointer hover:shadow-primary/5 active:scale-95"
        >
            <div className="relative aspect-square overflow-hidden bg-dark-900">
                {product.foto_url ? (
                    <img
                        src={product.foto_url}
                        alt={product.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 font-black uppercase text-[10px] tracking-widest italic">
                        Sem Foto
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-dark-900/80 backdrop-blur-md text-[9px] px-3 py-1.5 rounded-xl text-neutral-400 border border-dark-700 font-black uppercase tracking-widest italic">
                    {product.embalagem || 'Unidade'}
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-base text-white mb-2 line-clamp-2 min-h-[48px] leading-tight uppercase italic">{product.nome}</h3>

                <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-2xl font-black text-primary italic tracking-tighter">{formatPrice(product.preco_venda)}</span>
                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-dark-900 transition-all shadow-inner">
                        <ShoppingCart size={18} className="stroke-[3]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
