import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import Login from '../components/Login';
import ForcePasswordChange from '../components/ForcePasswordChange';
import Clients from '../components/admin/Clients';
import Suppliers from '../components/admin/Suppliers';
import Settings from '../components/admin/Settings';
import Orders from '../components/admin/Orders';
import Finance from '../components/admin/Finance';
import PrintOrders from '../components/admin/PrintOrders';
import Messages from '../components/admin/Messages';
import Collections from '../components/admin/Collections';
import Logistics from '../components/admin/Logistics';
import { Plus, Package, RefreshCw, LayoutDashboard, LogOut, Users, Truck, Settings as SettingsIcon, ClipboardList, TrendingUp, Printer, Mail, HandCoins, Boxes } from 'lucide-react';

export default function AdminPanel() {
    console.log('[DEBUG] AdminPanel: Montando componente...');

    const [session, setSession] = useState(null);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [activeTab, setActiveTab] = useState('orders');
    const [unreadMessages, setUnreadMessages] = useState(0);
    const hasMounted = useRef(false);

    // 1. Limpeza de estados e efeito de montagem única
    useEffect(() => {
        if (!hasMounted.current) {
            console.log('[DEBUG] AdminPanel: Primeiro carregamento detectado.');
            hasMounted.current = true;
        }
    }, []);

    // 2. Lógica de Autenticação Estabilizada
    useEffect(() => {
        let mounted = true;

        const getInitialSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (mounted) {
                console.log('[DEBUG] AdminPanel: Sessão inicial obtida:', !!currentSession);
                setSession(currentSession);
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (mounted) {
                console.log('[DEBUG] AdminPanel: Mudança de estado de auth:', _event);
                setSession(newSession);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 3. Busca de Mensagens (Sem Loop/Intervalo)
    const fetchUnreadCount = async () => {
        if (!session) return;
        try {
            console.log('[DEBUG] AdminPanel: Buscando contador de mensagens...');
            const { count, error } = await supabase
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('lida', false);

            if (error) throw error;
            setUnreadMessages(count || 0);
        } catch (error) {
            console.error('[DEBUG] AdminPanel: Erro no contador:', error.message);
        }
    };

    useEffect(() => {
        if (session) {
            fetchUnreadCount();
        }
    }, [session]); // Executa apenas quando a sessão muda (login)

    // 4. Busca de Produtos (Otimizada)
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const fetchProducts = async () => {
        if (!session) return;
        setLoadingProducts(true);
        try {
            console.log('[DEBUG] AdminPanel: Buscando produtos...');
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('[DEBUG] AdminPanel: Erro nos produtos:', error.message);
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
        console.log('[DEBUG] AdminPanel: Iniciando logout...');
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
        if (needsChange) setForcePasswordChange(true);
    };

    if (!session) return <Login onLogin={handleLogin} />;
    if (forcePasswordChange) return <ForcePasswordChange onComplete={() => setForcePasswordChange(false)} />;

    const renderProducts = () => (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Produtos</h1>
                    <p className="text-neutral-400 text-sm mt-1">Gerencie o catálogo da tabacaria</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={fetchProducts} className="p-2 sm:px-3 bg-dark-800 border border-dark-700 rounded-lg hover:border-neutral-500 transition-colors flex items-center gap-2">
                        <RefreshCw size={20} className={loadingProducts ? "animate-spin" : ""} />
                        <span className="hidden sm:inline text-sm font-medium">Atualizar</span>
                    </button>
                    <button onClick={() => setIsProductModalOpen(true)} className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-dark-900 font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <Plus size={20} /> Novo Produto
                    </button>
                </div>
            </div>
            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-dark-900/50 border-b border-dark-700 text-sm font-semibold text-neutral-400">
                            <th className="py-4 px-6">ID</th>
                            <th className="py-4 px-6">Produto</th>
                            <th className="py-4 px-6">Estoque</th>
                            <th className="py-4 px-6">Preço</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-dark-700/30">
                                <td className="py-4 px-6 text-sm text-neutral-500">#{p.id}</td>
                                <td className="py-4 px-6 font-semibold text-white">{p.nome}</td>
                                <td className="py-4 px-6 text-sm text-emerald-400">{p.estoque} un</td>
                                <td className="py-4 px-6 font-bold text-white">{formatPrice(p.preco_venda)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSuccess={fetchProducts} />
        </div>
    );

    const renderContent = () => {
        console.log('[DEBUG] AdminPanel: Renderizando aba:', activeTab);
        try {
            switch (activeTab) {
                case 'finance': return <Finance />;
                case 'billing': return <Collections />;
                case 'messages': return <Messages />;
                case 'logistics': return <Logistics />;
                case 'print': return <PrintOrders />;
                case 'orders': return <Orders />;
                case 'products': return renderProducts();
                case 'clients': return <Clients />;
                case 'suppliers': return <Suppliers />;
                case 'settings': return <Settings session={session} />;
                default: return <Orders />;
            }
        } catch (error) {
            console.error('[ERRO FATAL] Aba falhou:', activeTab, error);
            return (
                <div className="p-10 bg-red-900/20 border border-red-500/50 rounded-3xl text-center">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Módulo em Manutenção</h2>
                    <button onClick={() => setActiveTab('orders')} className="mt-4 bg-dark-700 px-6 py-2 rounded-xl text-white font-bold">Voltar para Vendas</button>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-100/10 flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-40">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-100/10">
                    <Package className="text-primary" />
                    <span className="font-bold text-xl text-white">ESTÁVEL</span>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 flex md:flex-col gap-1 no-scrollbar">
                    <NavItem icon={<TrendingUp size={18} />} label="Financeiro" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
                    <NavItem icon={<HandCoins size={18} />} label="Cobrança" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
                    <NavItem icon={<Mail size={18} />} label="Mensagens" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} badge={unreadMessages} />
                    <NavItem icon={<Boxes size={18} />} label="Logística" active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} />
                    <NavItem icon={<Printer size={18} />} label="Impressão" active={activeTab === 'print'} onClick={() => setActiveTab('print')} />
                    <NavItem icon={<ClipboardList size={18} />} label="Vendas" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <NavItem icon={<Package size={18} />} label="Estoque" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                    <NavItem icon={<Users size={18} />} label="Clientes" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
                    <NavItem icon={<Truck size={18} />} label="Fornecedores" active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} />
                    <NavItem icon={<SettingsIcon size={18} />} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>
                <div className="p-4 border-t border-dark-100/10 hidden md:block">
                    <button onClick={handleLogout} className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center gap-2 font-bold">
                        <LogOut size={18} /> Sair
                    </button>
                    <Link to="/" className="w-full mt-2 p-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm text-center">Ver Loja</Link>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">{renderContent()}</div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active, onClick, badge }) {
    return (
        <button onClick={onClick} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-left whitespace-nowrap ${active ? 'bg-primary text-dark-900' : 'text-neutral-400 hover:bg-dark-700/50 hover:text-white'}`}>
            <div className="flex items-center gap-3">{icon} <span>{label}</span></div>
            {badge > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">{badge}</span>}
        </button>
    );
}
