import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../core/supabaseClient';
import { Link } from 'react-router-dom';
import { useCompany } from "../../context/CompanyContext";

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

export default function Admin() {

    const { companyId, loadingCompany } = useCompany();

    const [session, setSession] = useState(null);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [activeTab, setActiveTab] = useState('orders');

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const [unreadMessages, setUnreadMessages] = useState(0);
    const prevUnreadCount = useRef(0);

    // =============================
    // AUTH
    // =============================
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
            });

        return () => subscription.unsubscribe();
    }, []);

    // =============================
    // BLOQUEIA ENQUANTO EMPRESA CARREGA
    // =============================
    if (loadingCompany) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
                Carregando empresa...
            </div>
        );
    }

    // =============================
    // BUSCAR PRODUTOS (MULTI EMPRESA)
    // =============================
    const fetchProducts = async () => {
        if (!companyId) return;

        setLoadingProducts(true);

        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .eq('company_id', companyId)
                .order('id', { ascending: false });

            if (error) throw error;

            setProducts(data || []);

        } catch (error) {
            console.error('Erro ao buscar produtos:', error.message);
        } finally {
            setLoadingProducts(false);
        }
    };

    // =============================
    // CONTADOR DE MENSAGENS
    // =============================
    const fetchUnreadCount = async () => {
        if (!companyId) return;

        try {
            const { count, error } = await supabase
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('lida', false)
                .eq('arquivada', false);

            if (error) throw error;

            setUnreadMessages(count || 0);

        } catch (error) {
            console.error('Erro ao buscar contador de mensagens:', error.message);
        }
    };

    useEffect(() => {
        if (session && companyId && activeTab === 'products') {
            fetchProducts();
        }

        if (session && companyId && activeTab === 'messages') {
            fetchUnreadCount();
        }

    }, [session, activeTab, companyId]);

    // =============================
    // LOGOUT
    // =============================
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // =============================
    // LOGIN HANDLER
    // =============================
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

    // =============================
    // RENDER PRODUTOS
    // =============================
    const renderProducts = () => (
        <div>
            <h1 className="text-2xl font-bold text-white mb-6">Produtos</h1>

            <button
                onClick={fetchProducts}
                className="mb-4 px-4 py-2 bg-dark-700 rounded"
            >
                Atualizar
            </button>

            <button
                onClick={() => setIsProductModalOpen(true)}
                className="ml-3 px-4 py-2 bg-primary text-black rounded"
            >
                Novo Produto
            </button>

            {loadingProducts && <p>Carregando...</p>}

            {!loadingProducts && products.length === 0 && (
                <p>Nenhum produto cadastrado.</p>
            )}

            {products.map((product) => (
                <div key={product.id} className="border-b border-dark-700 py-3">
                    {product.nome} - R$ {product.preco_venda}
                </div>
            ))}

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSuccess={fetchProducts}
            />
        </div>
    );

    // =============================
    // RENDER CONTEÚDO
    // =============================
    const renderContent = () => {
        switch (activeTab) {
            case 'finance':
                return <Finance />;
            case 'billing':
                return <Collections />;
            case 'messages':
                return <Messages companyId={companyId} />;
            case 'logistics':
                return <Logistics />;
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
        <div className="min-h-screen bg-dark-900 text-neutral-200 flex">

            <aside className="w-64 bg-dark-800 p-4">
                <button onClick={() => setActiveTab('orders')}>Vendas</button>
                <button onClick={() => setActiveTab('products')}>Produtos</button>
                <button onClick={() => setActiveTab('clients')}>Clientes</button>
                <button onClick={() => setActiveTab('suppliers')}>Fornecedores</button>
                <button onClick={() => setActiveTab('messages')}>
                    Mensagens ({unreadMessages})
                </button>
                <button onClick={() => setActiveTab('finance')}>Financeiro</button>
                <button onClick={() => setActiveTab('settings')}>Configurações</button>
                <button onClick={handleLogout}>Sair</button>
            </aside>

            <main className="flex-1 p-8">
                {renderContent()}
            </main>

        </div>
    );
}