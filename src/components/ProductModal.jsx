import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ProductModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        preco_venda: '',
        estoque: '',
        embalagem: '',
        foto_url: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('produtos')
                .insert([
                    {
                        nome: formData.nome,
                        preco_venda: parseFloat(formData.preco_venda) || 0,
                        estoque: parseInt(formData.estoque, 10) || 0,
                        embalagem: formData.embalagem,
                        foto_url: formData.foto_url
                    }
                ]);

            if (error) throw error;

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                nome: '',
                preco_venda: '',
                estoque: '',
                embalagem: '',
                foto_url: ''
            });
        } catch (error) {
            console.error('Erro ao salvar produto:', error.message);
            alert('Erro ao salvar o produto!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-dark-700">
                    <h2 className="text-xl font-bold text-white">Novo Produto</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Nome</label>
                            <input
                                required
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Ex: Essência Zomo Mint"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Preço (R$)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="preco_venda"
                                    value={formData.preco_venda}
                                    onChange={handleChange}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Estoque</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    name="estoque"
                                    value={formData.estoque}
                                    onChange={handleChange}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Embalagem</label>
                            <input
                                required
                                type="text"
                                name="embalagem"
                                value={formData.embalagem}
                                onChange={handleChange}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Ex: 50g, Unidade, Caixa"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">URL da Foto</label>
                            <input
                                type="url"
                                name="foto_url"
                                value={formData.foto_url}
                                onChange={handleChange}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="https://exemplo.com/foto.jpg"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-dark-700 bg-dark-800 mt-auto">
                    <button
                        type="submit"
                        form="productForm"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-dark-900 font-bold py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                </div>
            </div>
        </div>
    );
}
