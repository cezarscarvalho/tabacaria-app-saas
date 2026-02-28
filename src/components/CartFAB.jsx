import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function CartFAB({ cart, onClick }) {
    if (cart.length === 0) return null;

    const totalItems = cart.reduce((acc, item) => acc + item.quantidade, 0);
    const totalValue = cart.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);

    const formatPrice = (price) => {
        const validPrice = typeof price === 'number' ? price : parseFloat(price);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(isNaN(validPrice) ? 0 : validPrice);
    };

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 z-40">
            <button
                onClick={onClick}
                className="w-full bg-primary hover:bg-primary-hover text-dark-900 rounded-2xl shadow-[0_8px_30px_rgb(234,179,8,0.3)] p-4 flex items-center justify-between transition-transform transform hover:scale-[1.02] active:scale-95 border border-primary/20"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <ShoppingBag size={24} className="text-dark-900 drop-shadow-sm" />
                        <span className="absolute -top-2 -right-2 bg-dark-900 text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary">
                            {totalItems}
                        </span>
                    </div>
                    <span className="font-bold text-dark-900">Ver Sacola</span>
                </div>

                <span className="font-black text-lg">
                    {formatPrice(totalValue)}
                </span>
            </button>
        </div>
    );
}
