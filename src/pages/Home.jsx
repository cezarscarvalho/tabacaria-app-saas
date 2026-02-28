import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import CartFAB from '../components/CartFAB';
import CartModal from '../components/CartModal';
import CheckoutConfirmationModal from '../components/CheckoutConfirmationModal';
import { Flame, MessageCircle } from 'lucide-react';
import SupportModal from '../components/SupportModal';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    // Configurações Dinâmicas
    const [settings, setSettings] = useState(null);

    // Confirmation Modal States
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);

    const fetchInitialData = async () => {
        try {
            // Busca Produtos
            const { data: prodData } = await supabase
                .from('produtos')
                .select('*')
                .order('nome', { ascending: true });
            setProducts(prodData || []);

            // Busca Configurações Globais
            const { data: cfgData } = await supabase
                .from('configuracoes')
                .select('*')
                .limit(1)
                .single();
            setSettings(cfgData || null);

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantidade: 1 }];
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantidade: newQuantity } : item));
    };

    const removeItem = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    const handleCheckoutStarted = (orderData) => {
        setPendingOrder(orderData);
        setIsCartOpen(false);
        setTimeout(() => setIsConfirmationOpen(true), 500);
    };

    const handleFinalConfirm = () => {
        setIsConfirmationOpen(false);
        setPendingOrder(null);
        clearCart();
    };

    // Use name from settings or fallback
    const storeName = settings?.nome_estabelecimento || 'Tabacaria Premium';

    return (
        <div className="min-h-screen bg-dark-900 pb-20 relative">
            {/* Header */}
            <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-primary">
                        <Flame size={28} className="fill-current" />
                        <h1 className="text-2xl font-black tracking-wider uppercase">
                            {storeName.split(' ')[0]}
                            <span className="text-white">{storeName.split(' ').slice(1).join(' ') || 'Premium'}</span>
                        </h1>
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
                    Qualidade e sofisticação em cada detalhe para o seu momento {storeName}.
                </p>
            </div>

            {/* Products Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-10">
                {/* Support Banner */}
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-gradient-to-r from-dark-800 to-dark-700 border border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 shadow-inner"><MessageCircle className="text-primary" size={40} /></div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight italic uppercase">Dúvidas? Fale conosco!</h2>
                                <p className="text-neutral-400 max-w-lg">Nosso suporte premium está disponível para te ajudar com seu pedido ou sugestões.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSupportOpen(true)}
                            className="relative z-10 bg-primary hover:bg-primary-hover text-dark-900 font-black py-4 px-8 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                        >
                            <MessageCircle size={22} /> Fale Conosco
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8 flex-col sm:flex-row gap-4">
                    <h3 className="text-2xl font-bold text-white border-l-4 border-primary pl-3 w-full uppercase tracking-tighter italic">Catálogo de Produtos</h3>
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
                    <div className="text-center py-20 bg-dark-800 rounded-2xl border border-dark-700"><p className="text-neutral-400 text-lg italic">Nenhum produto em destaque.</p></div>
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
                settingsData={settings}
            />

            <CheckoutConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                orderData={pendingOrder}
                onConfirm={handleFinalConfirm}
            />

            <SupportModal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                settingsData={settings}
            />
        </div>
    );
}
