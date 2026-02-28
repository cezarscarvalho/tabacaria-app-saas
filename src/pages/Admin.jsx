import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ProductModal from '../components/ProductModal';
import Login from '../components/Login';
import ForcePasswordChange from '../components/ForcePasswordChange';
import Clients from '../components/admin/Clients';
import Suppliers from '../components/admin/Suppliers';
import Settings from '../components/admin/Settings';
import Orders from '../components/admin/Orders';
import Finance from '../components/admin/Finance';
import PrintOrders from '../components/admin/PrintOrders';
import { Plus, Package, RefreshCw, LayoutDashboard, LogOut, Users, Truck, Settings as SettingsIcon, ClipboardList, TrendingUp, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
    const [session, setSession] = useState(null);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [activeTab, setActiveTab] = useState('orders'); // orders | products | clients | suppliers | settings

    // Products State
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error.message);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (session && activeTab === 'products') {
            fetchProducts();
        }
    }, [session, activeTab]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const formatPrice = (price) => {
        const validPrice = typeof price === 'number' ? price : parseFloat(price);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(isNaN(validPrice) ? 0 : validPrice);
    };

    const handleLogin = (newSession, needsChange) => {
        setSession(newSession);
        if (needsChange) {
            setForcePasswordChange(true);
        }
    };

    if (!session) {
        return <Login onLogin={handleLogin} />;
    }

    if (forcePasswordChange) {
        return <ForcePasswordChange onComplete={() => setForcePasswordChange(false)} />;
    }

    const renderProducts = () => (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Produtos</h1>
                    <p className="text-neutral-400 text-sm mt-1">Gerencie o catálogo da tabacaria</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={fetchProducts}
                        className="p-2 sm:px-3 bg-dark-800 border border-dark-700 rounded-lg hover:border-neutral-500 transition-colors flex items-center justify-center gap-2"
                        title="Atualizar"
                    >
                        <RefreshCw size={20} className={loadingProducts ? "animate-spin" : ""} />
                        <span className="hidden sm:inline text-sm font-medium">Atualizar</span>
                    </button>
                    <button
                        onClick={() => setIsProductModalOpen(true)}
                        className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-dark-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Produto
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-dark-900/50 border-b border-dark-700 text-sm font-semibold text-neutral-400">
                                <th className="py-4 px-6 w-16">ID</th>
                                <th className="py-4 px-6">Produto</th>
                                <th className="py-4 px-6 w-32">Embalagem</th>
                                <th className="py-4 px-6 w-32">Estoque</th>
                                <th className="py-4 px-6 w-40">Preço</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loadingProducts && products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            <p>Carregando catálogo...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-neutral-500">
                                        Nenhum produto cadastrado até o momento.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="py-4 px-6 text-sm text-neutral-500 font-medium">#{product.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-dark-900 overflow-hidden flex-shrink-0 border border-dark-600 shadow-sm">
                                                    {product.foto_url ? (
                                                        <img src={product.foto_url} alt={product.nome} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full w-full text-[10px] text-neutral-600 font-medium uppercase text-center leading-tight">Sem<br />Foto</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-white block truncate max-w-[200px] xl:max-w-md">{product.nome}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-dark-700 text-neutral-300 border border-dark-600 shadow-sm">
                                                {product.embalagem}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm">
                                            <span className={`font-bold inline-flex items-center gap-1.5 ${product.estoque <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                <span className={`h-2 w-2 rounded-full ${product.estoque <= 5 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                                                {product.estoque} un
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-white text-base">
                                            {formatPrice(product.preco_venda)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSuccess={fetchProducts}
            />
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'finance':
                return <Finance />;
            case 'print':
                return <PrintOrders />;
            case 'orders':
                return <Orders />;
            case 'products':
                return renderProducts();
            case 'clients':
                return <Clients />;
            case 'suppliers':
                return <Suppliers />;
            case 'settings':
                return <Settings session={session} />;
            default:
                return <Orders />;
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-dark-800 border-b md:border-b-0 md:border-r border-dark-700 flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-40">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-700 flex-shrink-0">
                    <Package className="text-primary" />
                    <span className="font-bold text-xl text-white">Painel Base</span>
                </div>

                {/* Mobile Menu (Horizontal scroll) / Desktop Menu (Vertical) */}
                <div className="flex-1 overflow-x-auto md:overflow-y-auto no-scrollbar py-2 md:py-6 px-4">
                    <nav className="flex md:flex-col gap-2 min-w-max md:min-w-0">
                        <button
                            onClick={() => setActiveTab('finance')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'finance' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <TrendingUp size={18} className={activeTab === 'finance' ? 'text-dark-900' : ''} />
                            Financeiro
                        </button>
                        <button
                            onClick={() => setActiveTab('print')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'print' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <Printer size={18} className={activeTab === 'print' ? 'text-dark-900' : ''} />
                            Impressão
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'orders' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <ClipboardList size={18} className={activeTab === 'orders' ? 'text-dark-900' : ''} />
                            Vendas
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'products' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <Package size={18} className={activeTab === 'products' ? 'text-dark-900' : ''} />
                            Produtos
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'clients' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <Users size={18} className={activeTab === 'clients' ? 'text-dark-900' : ''} />
                            Clientes
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'suppliers' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <Truck size={18} className={activeTab === 'suppliers' ? 'text-dark-900' : ''} />
                            Fornecedores
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${activeTab === 'settings' ? 'bg-primary border border-primary/20 text-dark-900 shadow-sm' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}
                        >
                            <SettingsIcon size={18} className={activeTab === 'settings' ? 'text-dark-900' : ''} />
                            Configurações
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-dark-700 hidden md:block">
                    <div className="flex flex-col gap-2">
                        <Link to="/" className="w-full px-4 py-2.5 bg-dark-700 hover:bg-dark-600 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <LayoutDashboard size={16} /> Ver Loja
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} /> Sair do Painel
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Footer Actions (Visible only on small screens) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 p-4 z-50 flex gap-3">
                <Link to="/" className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 leading-none">
                    <LayoutDashboard size={16} /> Loja
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2 leading-none"
                >
                    <LogOut size={16} /> Sair
                </button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
