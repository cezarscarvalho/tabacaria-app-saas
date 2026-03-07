import { useEffect, useState } from "react";
import { getProducts, createProduct } from "../services/productService";
import { useCompany } from "../../../context/CompanyContext";

export default function Products() {

    const { company } = useCompany();

    const [products, setProducts] = useState([]);
    const [nome, setNome] = useState("");
    const [precoVenda, setPrecoVenda] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function loadProducts() {

        if (!company) return;

        setLoading(true);

        try {

            const data = await getProducts(company.id);
            setProducts(data);

        } catch (err) {

            setError("Erro ao carregar produtos");

        }

        setLoading(false);
    }

    useEffect(() => {
        loadProducts();
    }, [company]);

    async function handleAddProduct(e) {

        e.preventDefault();

        if (!nome || !precoVenda) return;

        const product = {
            nome: nome,
            preco_venda: Number(precoVenda),
            estoque_atual: 0,
            company_id: company.id
        };

        const result = await createProduct(product);

        if (!result) {
            alert("Erro ao criar produto");
            return;
        }

        setNome("");
        setPrecoVenda("");

        loadProducts();
    }

    return (

        <div>

            <h1>Produtos</h1>

            <form onSubmit={handleAddProduct}>

                <input
                    type="text"
                    placeholder="Nome do produto"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Preço de venda"
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(e.target.value)}
                />

                <button type="submit">
                    Adicionar
                </button>

            </form>

            {loading && <p>Carregando produtos...</p>}

            {error && <p>{error}</p>}

            <ul>

                {products.map((product) => (

                    <li key={product.id}>
                        {product.nome} - R$ {product.preco_venda}
                    </li>

                ))}

            </ul>

        </div>

    );

}