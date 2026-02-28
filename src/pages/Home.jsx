import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import CartFAB from '../components/CartFAB';
import CartModal from '../components/CartModal';
import CheckoutConfirmationModal from '../components/CheckoutConfirmationModal';
import { Flame } from 'lucide-react';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Confirmation Modal States
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantidade: 1 }];
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, quantidade: newQuantity }
                    : item
            )
        );
    };

    const removeItem = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    // Called by CartModal when user clicks "Finalizar" and WhatsApp is opened
    const handleCheckoutStarted = (orderData) => {
        setPendingOrder(orderData);
        setIsCartOpen(false);
        // Small delay to ensure WhatsApp opens first
        setTimeout(() => {
            setIsConfirmationOpen(true);
        }, 500);
    };

    const handleFinalConfirm = () => {
        setIsConfirmationOpen(false);
        setPendingOrder(null);
        clearCart();
    };

    return (
        <div className="min-h-screen bg-dark-900 pb-20 relative">
            {/* Header */}
            <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-primary">
                        <Flame size={28} className="fill-current" />
                        <h1 className="text-2xl font-black tracking-wider uppercase">Tabacaria<span className="text-white">Premium</span></h1>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 z-10 relative">
                    Experiência <span className="text-primary">Elevada</span>
                </h2>
                <p className="text-neutral-400 max-w-2xl text-lg z-10 relative">
                    Os melhores produtos, essências e acessórios com qualidade premium para o seu momento.
                </p>
            </div>

            {/* Products Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-10">
                <div className="flex items-center justify-between mb-8 flex-col sm:flex-row gap-4">
                    <h3 className="text-2xl font-bold text-white border-l-4 border-primary pl-3 w-full">Nossos Produtos</h3>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} addToCart={addToCart} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-dark-800 rounded-2xl border border-dark-700">
                        <p className="text-neutral-400 text-lg">Nenhum produto encontrado no momento.</p>
                    </div>
                )}
            </main>

            <CartFAB cart={cart} onClick={() => setIsCartOpen(true)} />

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                onCheckoutStarted={handleCheckoutStarted}
            />

            <CheckoutConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                orderData={pendingOrder}
                onConfirm={handleFinalConfirm}
            />
        </div>
    );
}

