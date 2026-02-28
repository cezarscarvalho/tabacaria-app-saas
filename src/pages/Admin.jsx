import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ProductModal from '../components/ProductModal';
import { Plus, Package, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price || 0);
    };

    return (
        <div className="min-h-screen bg-dark-900 text-neutral-200">
            {/* Navbar */}
            <nav className="bg-dark-800 border-b border-dark-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="text-primary" />
                        <span className="font-bold text-xl text-white hidden sm:block">Painel de Gestão</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1">
                            <LayoutDashboard size={16} /> Ver Loja
                        </Link>
                        <div className="h-4 w-px bg-dark-600"></div>
                        <div className="text-sm text-neutral-400">Admin</div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline text-sm font-medium">Atualizar</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-dark-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            Novo Produto
                        </button>
                    </div>
                </div>

                {/* Table */}
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
                                {loading && products.length === 0 ? (
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
                                                {formatPrice(product.preco)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchProducts}
            />
        </div>
    );
}
