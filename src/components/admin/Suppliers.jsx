import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit, Trash2, Truck, X, Save } from 'lucide-react';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplierId, setCurrentSupplierId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fornecedores')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setSuppliers(data || []);
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.whatsapp && supplier.whatsapp.includes(searchTerm))
    );

    const formatWhatsApp = (value) => {
        const numbers = value.replace(/\D/g, '');
        let formatted = numbers;
        if (numbers.length > 2 && numbers.length <= 7) {
            formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        } else if (numbers.length > 7) {
            formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        }
        return formatted;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'whatsapp' ? formatWhatsApp(value) : value
        });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ nome: '', whatsapp: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (supplier) => {
        setIsEditing(true);
        setCurrentSupplierId(supplier.id);
        setFormData({
            nome: supplier.nome,
            whatsapp: supplier.whatsapp || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este fornecedor? Essa ação não pode ser desfeita.')) {
            try {
                const { error } = await supabase
                    .from('fornecedores')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                fetchSuppliers();
            } catch (error) {
                console.error('Erro ao excluir:', error.message);
                alert('Erro ao excluir fornecedor.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('fornecedores')
                    .update({
                        nome: formData.nome,
                        whatsapp: formData.whatsapp
                    })
                    .eq('id', currentSupplierId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('fornecedores')
                    .insert([{
                        nome: formData.nome,
                        whatsapp: formData.whatsapp
                    }]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Erro detalhado ao salvar fornecedor (Supabase):', error);
            alert(`Erro ao salvar: ${error.message || 'Falha na comunicação com o banco.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
                    <p className="text-neutral-400 text-sm mt-1">Gerencie a sua base de fornecedores parceiros</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar fornecedor..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex-shrink-0 bg-primary hover:bg-primary-hover text-dark-900 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                        <Truck size={18} />
                        Novo Fornecedor
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-dark-900/50 border-b border-dark-700 text-sm font-semibold text-neutral-400">
                                <th className="py-4 px-6 w-16">ID</th>
                                <th className="py-4 px-6">Empresa / Nome</th>
                                <th className="py-4 px-6 w-48">WhatsApp</th>
                                <th className="py-4 px-6 w-24 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loading && suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            <p>Carregando fornecedores...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-neutral-500">
                                        {searchTerm ? 'Nenhum fornecedor encontrado com esse termo.' : 'Nenhum fornecedor cadastrado até o momento.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="py-4 px-6 text-sm text-neutral-500 font-medium">#{supplier.id}</td>
                                        <td className="py-4 px-6">
                                            <span className="font-semibold text-white">{supplier.nome}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-neutral-300">
                                            {supplier.whatsapp || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(supplier)}
                                                    className="p-1.5 text-neutral-400 hover:text-primary bg-dark-900/50 hover:bg-dark-700 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-1.5 text-neutral-400 hover:text-red-400 bg-dark-900/50 hover:bg-red-400/10 rounded-md transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => !saving && setIsModalOpen(false)}
                    ></div>

                    <div className="relative bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {isEditing ? <Edit size={20} className="text-primary" /> : <Truck size={20} className="text-primary" />}
                                {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={saving}
                                className="text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Empresa / Nome</label>
                                <input
                                    required
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Nome do fornecedor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">WhatsApp</label>
                                <input
                                    required
                                    type="text"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    maxLength={15}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 border border-dark-600 text-neutral-300 rounded-xl hover:bg-dark-700 hover:text-white transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-dark-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(234,179,8,0.2)]"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={18} className="stroke-[2.5]" />
                                            Salvar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
