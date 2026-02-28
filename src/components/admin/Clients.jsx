import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Plus, Edit, Trash2, UserPlus, X, Save } from 'lucide-react';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentClientId, setCurrentClientId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
        ativo: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredClients = clients.filter(client =>
        client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.whatsapp.includes(searchTerm)
    );

    const formatWhatsApp = (value) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');
        let formatted = numbers;

        // Formatação básica para BR: (11) 98888-7777
        if (numbers.length > 2 && numbers.length <= 7) {
            formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        } else if (numbers.length > 7) {
            formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        }
        return formatted;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : (name === 'whatsapp' ? formatWhatsApp(value) : value)
        });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ nome: '', whatsapp: '', ativo: true });
        setIsModalOpen(true);
    };

    const openEditModal = (client) => {
        setIsEditing(true);
        setCurrentClientId(client.id);
        setFormData({
            nome: client.nome,
            whatsapp: client.whatsapp,
            ativo: client.ativo
        });
        setIsModalOpen(true);
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ ativo: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchClients();
        } catch (error) {
            console.error('Erro ao atualizar status:', error.message);
            alert('Erro ao atualizar status do cliente.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.')) {
            try {
                const { error } = await supabase
                    .from('clientes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                fetchClients();
            } catch (error) {
                console.error('Erro ao excluir:', error.message);
                alert('Erro ao excluir cliente.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('clientes')
                    .update(formData)
                    .eq('id', currentClientId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clientes')
                    .insert([formData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchClients();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error.message);
            alert(`Erro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clientes</h1>
                    <p className="text-neutral-400 text-sm mt-1">Gerencie a sua base de clientes</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
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
                        <UserPlus size={18} />
                        Novo Cliente
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-dark-900/50 border-b border-dark-700 text-sm font-semibold text-neutral-400">
                                <th className="py-4 px-6 w-16">ID</th>
                                <th className="py-4 px-6">Nome</th>
                                <th className="py-4 px-6 w-48">WhatsApp</th>
                                <th className="py-4 px-6 w-32 text-center">Status</th>
                                <th className="py-4 px-6 w-24 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loading && clients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            <p>Carregando clientes...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-neutral-500">
                                        {searchTerm ? 'Nenhum cliente encontrado com esse termo.' : 'Nenhum cliente cadastrado até o momento.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="py-4 px-6 text-sm text-neutral-500 font-medium">#{client.id}</td>
                                        <td className="py-4 px-6">
                                            <span className="font-semibold text-white">{client.nome}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-neutral-300">
                                            {client.whatsapp || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleToggleActive(client.id, client.ativo)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-900 ${client.ativo ? 'bg-primary' : 'bg-dark-600'}`}
                                            >
                                                <span className="sr-only">Alternar status</span>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${client.ativo ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(client)}
                                                    className="p-1.5 text-neutral-400 hover:text-primary bg-dark-900/50 hover:bg-dark-700 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
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
                                {isEditing ? <Edit size={20} className="text-primary" /> : <UserPlus size={20} className="text-primary" />}
                                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
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
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Nome do cliente"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">WhatsApp</label>
                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    maxLength={15}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="ativo"
                                    name="ativo"
                                    checked={formData.ativo}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-dark-600 bg-dark-900 text-primary focus:ring-primary focus:ring-offset-dark-800"
                                />
                                <label htmlFor="ativo" className="text-sm font-medium text-white cursor-pointer select-none">
                                    Cliente Ativo
                                </label>
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
