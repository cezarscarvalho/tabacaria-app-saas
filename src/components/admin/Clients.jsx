import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Edit, Trash2, UserPlus, X, Save, MessageSquare, Store } from 'lucide-react';

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

    // REGRA DE OURO: Função puramente estática, sem updates de estado para evitar re-renders no Admin
    const handleSendCatalog = (clientName, whatsapp) => {
        const cleanPhone = (whatsapp || '').replace(/\D/g, '');
        if (!cleanPhone) {
            alert('Aviso: Número de WhatsApp não encontrado para este cliente.');
            return;
        }

        const siteUrl = window.location.origin;
        const message = `Olá *${clientName}*, estamos com novidades! Confira nosso catálogo: ${siteUrl}`;
        const encodedMessage = encodeURIComponent(message);

        // Disparo direto via window.open (Static Action)
        window.open(`https://wa.me/55${cleanPhone}?text=${encodedMessage}`, '_blank');
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
            console.error('Erro ao salvar cliente:', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja excluir este registro permanentemente?')) return;
        try {
            await supabase.from('clientes').delete().eq('id', id);
            if (refreshFunc) refreshFunc();
        } catch (err) {
            console.error('Erro ao excluir:', err.message);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <Store className="text-primary" /> Clientes / Lojas
                    </h1>
                    <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest mt-1">Prospecção e Gestão de Base</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar estabelecimento..."
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
                        <Plus size={18} /> Novo Cadastro
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-dark-900/50 border-b border-dark-700 text-[10px] font-black uppercase text-neutral-500 tracking-[0.15em]">
                        <tr>
                            <th className="p-6">Estabelecimento / Loja</th>
                            <th className="p-6">WhatsApp</th>
                            <th className="p-6 text-right">Ações de Prospecção</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {filteredClients.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-20 text-center text-neutral-600 font-bold italic">
                                    Nenhum cliente cadastrado na base.
                                </td>
                            </tr>
                        ) : (
                            filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-dark-700/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                                            <span className="font-bold text-white italic text-lg tracking-tight uppercase">{client.nome}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-neutral-400 font-mono text-sm tracking-widest">{client.whatsapp}</td>
                                    <td className="p-6 text-right flex justify-end gap-3">
                                        <button
                                            onClick={() => handleSendCatalog(client.nome, client.whatsapp)}
                                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 font-black text-[10px] uppercase tracking-widest rounded-lg hover:text-white transition-all flex items-center gap-2"
                                            title="Disparo de Catálogo"
                                        >
                                            <MessageSquare size={14} /> Enviar Catálogo
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(true); setCurrentClientId(client.id); setFormData({ nome: client.nome, whatsapp: client.whatsapp, ativo: client.ativo }); setIsModalOpen(true); }}
                                            className="p-2.5 bg-dark-700 text-neutral-400 hover:text-white rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/20"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-dark-800 border-2 border-primary/20 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Store size={120} /></div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-8 border-b-2 border-primary w-fit pr-6">
                            {isEditing ? 'Ajustar Registro' : 'Novo Estabelecimento'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Nome da Loja / Cliente</label>
                                <input
                                    required
                                    className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 outline-none focus:border-primary text-white font-bold transition-all"
                                    placeholder="Ex: Tabacaria Central"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">WhatsApp (Somente Números)</label>
                                <input
                                    required
                                    className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 outline-none focus:border-primary text-white font-mono transition-all"
                                    placeholder="11999999999"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-primary text-dark-900 font-black py-5 rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Sincronizando...' : 'Confirmar Registro'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full text-neutral-500 font-black uppercase text-[10px] tracking-widest mt-2 hover:text-white transition-all underline decoration-dark-600"
                                >
                                    Desistir e Sair
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
