import { useEffect, useState } from "react";
import { getProducts, createProduct } from "../../services/productsService";
import { useCompany } from "../../context/CompanyContext";

export default function Products() {

    const { company } = useCompany();

    const [products, setProducts] = useState([]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function loadProducts() {
        if (!company) return;

        setLoading(true);

        const { data, error } = await getProducts(company.id);

        if (error) {
            setError(error.message);
        } else {
            setProducts(data);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadProducts();
    }, [company]);

    async function handleAddProduct(e) {
        e.preventDefault();

        if (!name || !price) return;

        const product = {
            name,
            price: Number(price),
            company_id: company.id
        };

        const { error } = await createProduct(product);

        if (error) {
            alert("Erro ao criar produto");
            return;
        }

        setName("");
        setPrice("");

        loadProducts();
    }

    return (
        <div>

            <h1>Produtos</h1>

            <form onSubmit={handleAddProduct}>
                <input
                    type="text"
                    placeholder="Nome do produto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Preço"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
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
                        {product.name} - R$ {product.price}
                    </li>
                ))}
            </ul>

        </div>
    );
}