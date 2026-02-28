import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Plus, Edit, Trash2, UserPlus, X, Save, MessageSquare } from 'lucide-react';

export default function Clients({ clientsData, refreshFunc }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentClientId, setCurrentClientId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
        ativo: true
    });

    const filteredClients = (clientsData || []).filter(client =>
        client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.whatsapp.includes(searchTerm)
    );

    const handleSendCatalog = (whatsapp) => {
        const cleanPhone = (whatsapp || '').replace(/\D/g, '');
        if (!cleanPhone) {
            alert('Número de WhatsApp inválido.');
            return;
        }
        const message = encodeURIComponent('Olá! Confira nosso catálogo atualizado aqui: ' + window.location.origin);
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await supabase.from('clientes').update(formData).eq('id', currentClientId);
            } else {
                await supabase.from('clientes').insert([formData]);
            }
            setIsModalOpen(false);
            if (refreshFunc) refreshFunc();
        } catch (err) {
            console.error('Erro:', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir cliente?')) return;
        await supabase.from('clientes').delete().eq('id', id);
        if (refreshFunc) refreshFunc();
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Base de Clientes</h1>
                    <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest mt-1">Gerenciamento e Prospecção</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    </div>
                    <button
                        onClick={() => { setIsEditing(false); setFormData({ nome: '', whatsapp: '', ativo: true }); setIsModalOpen(true); }}
                        className="bg-primary hover:scale-105 text-dark-900 font-black py-3 px-6 rounded-xl flex items-center gap-2 transition-all text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} /> Novo
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-dark-900/50 border-b border-dark-700 text-[10px] font-black uppercase text-neutral-500 tracking-[0.15em]">
                        <tr>
                            <th className="p-6">Nome / Cliente</th>
                            <th className="p-6">WhatsApp</th>
                            <th className="p-6 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-dark-700/30 transition-colors">
                                <td className="p-6 font-bold text-white italic">{client.nome}</td>
                                <td className="p-6 text-neutral-400 font-mono text-sm">{client.whatsapp}</td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <button
                                        onClick={() => handleSendCatalog(client.whatsapp)}
                                        className="p-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 rounded-lg hover:text-white transition-all"
                                        title="Enviar Catálogo"
                                    >
                                        <MessageSquare size={18} />
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(true); setCurrentClientId(client.id); setFormData({ nome: client.nome, whatsapp: client.whatsapp, ativo: client.ativo }); setIsModalOpen(true); }}
                                        className="p-2.5 bg-dark-700 text-neutral-400 hover:text-white rounded-lg transition-all"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Simples */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-dark-800 border border-dark-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6">
                            {isEditing ? 'Editar Cliente' : 'Novo Cadastro'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                required
                                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 outline-none focus:border-primary text-white"
                                placeholder="Nome Completo"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            />
                            <input
                                required
                                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 outline-none focus:border-primary text-white"
                                placeholder="WhatsApp (Apenas números)"
                                value={formData.whatsapp}
                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary text-dark-900 font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar Cliente'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-neutral-500 font-bold uppercase text-xs tracking-widest mt-2 hover:text-white transition-all">Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
