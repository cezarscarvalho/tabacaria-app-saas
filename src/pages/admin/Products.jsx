import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useCompany } from "../../context/CompanyContext";

export default function Products() {

    const { companyId, role, loadingCompany } = useCompany();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");

    // =============================
    // BUSCAR PRODUTOS
    // =============================
    const fetchProducts = async () => {
        if (!companyId) return;

        setLoading(true);

        const { data, error } = await supabase
            .from("produtos")
            .select("*")
            .eq("company_id", companyId)
            .order("id", { ascending: false });

        if (error) {
            console.error("Erro ao buscar produtos:", error.message);
        } else {
            setProducts(data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (!loadingCompany && companyId) {
            fetchProducts();
        }
    }, [companyId, loadingCompany]);

    // =============================
    // CRIAR PRODUTO
    // =============================
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!nome || !preco) return;

        const { error } = await supabase
            .from("produtos")
            .insert([
                {
                    nome,
                    preco_venda: parseFloat(preco),
                    company_id: companyId
                }
            ]);

        if (error) {
            console.error("Erro ao criar produto:", error.message);
        } else {
            setNome("");
            setPreco("");
            fetchProducts();
        }
    };

    // =============================
    // PERMISSÃO
    // =============================
    const canCreate = role === "owner" || role === "admin";

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Produtos</h1>

            {canCreate && (
                <form onSubmit={handleCreate} className="mb-6 space-x-2">
                    <input
                        type="text"
                        placeholder="Nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="px-3 py-2 bg-dark-800 border border-dark-700 rounded"
                    />
                    <input
                        type="number"
                        placeholder="Preço"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        className="px-3 py-2 bg-dark-800 border border-dark-700 rounded"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-black rounded"
                    >
                        Criar
                    </button>
                </form>
            )}

            {loading && <p>Carregando...</p>}

            {!loading && products.length === 0 && (
                <p>Nenhum produto cadastrado.</p>
            )}

            <ul className="space-y-2">
                {products.map((product) => (
                    <li
                        key={product.id}
                        className="border border-dark-700 p-3 rounded"
                    >
                        {product.nome} - R$ {product.preco_venda}
                    </li>
                ))}
            </ul>
        </div>
    );
}