import React, { useEffect, useState } from 'react';
import { supabase } from '../core/supabaseClient';
import ProductCard from '../components/ProductCard';
import CartFAB from '../components/CartFAB';
import CartModal from '../components/CartModal';
import CheckoutConfirmationModal from '../components/CheckoutConfirmationModal';
import { Flame, MessageCircle, X } from 'lucide-react';
import SupportModal from '../components/SupportModal';
import ProductDetailsModal from '../components/ProductDetailsModal';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    // Detalhes do Produto
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

    const addToCart = (productWithQty) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === productWithQty.id);
            const quantityToAdd = productWithQty.quantidade || 1;

            if (existingItem) {
                return prevCart.map(item =>
                    item.id === productWithQty.id
                        ? { ...item, quantidade: item.quantidade + quantityToAdd }
                        : item
                );
            }
            return [...prevCart, { ...productWithQty, quantidade: quantityToAdd }];
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
        // FEEDBACK DE SUCESSO
        setTimeout(() => {
            alert('Pedido enviado com sucesso! Carrinho limpo.');
        }, 500);
    };

    const openDetails = (product) => {
        setSelectedProduct(product);
        setIsDetailsOpen(true);
    };

    // Use name from settings or fallback
    const storeName = settings?.nome_estabelecimento || 'Tabacaria Premium';

    return (
        <div className="min-h-screen bg-dark-900 pb-20 relative font-sans">
            {/* Header */}
            <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-primary">
                        <Flame size={32} className="fill-current animate-pulse" />
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                            {storeName.split(' ')[0]}
                            <span className="text-white ml-1">{storeName.split(' ').slice(1).join(' ') || 'HUB'}</span>
                        </h1>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-6 z-10 relative italic uppercase tracking-tighter">
                    Experiência <span className="text-primary">Definitiva</span>
                </h2>
                <p className="text-neutral-500 max-w-2xl text-xl z-10 relative font-bold italic uppercase tracking-widest">
                    Qualidade e exclusividade em cada sessão.
                </p>
            </div>

            {/* Products Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-24">
                {/* Support Banner */}
                <div className="mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div className="bg-dark-800 border-2 border-primary/20 rounded-[3rem] p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-3xl relative overflow-hidden group">
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-1000"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20 shadow-inner"><MessageCircle className="text-primary" size={48} /></div>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter italic uppercase">Precisa de Ajuda?</h2>
                                <p className="text-neutral-500 text-lg font-bold italic uppercase leading-tight">Nosso atendimento premium está pronto para te guiar.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSupportOpen(true)}
                            className="relative z-10 bg-primary hover:bg-primary-hover text-dark-900 font-black py-6 px-12 rounded-[2rem] flex items-center gap-4 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 text-lg uppercase tracking-widest italic"
                        >
                            <MessageCircle size={24} /> Suporte Hub
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-3xl font-black text-white border-l-8 border-primary pl-6 uppercase tracking-tighter italic">Nossa Coleção</h3>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} onDetails={openDetails} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-dark-800 rounded-[3rem] border-2 border-dark-700 italic"><p className="text-neutral-500 text-2xl font-black uppercase tracking-widest">Catálogo em manutenção.</p></div>
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

            <ProductDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                product={selectedProduct}
                addToCart={addToCart}
            />
        </div>
    );
}
