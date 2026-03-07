import { supabase } from "../../../core/supabaseClient";

// LISTAR PRODUTOS
export async function getProducts(companyId) {
    const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("company_id", companyId)
        .order("nome");

    if (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
    }

    return data;
}

// CRIAR PRODUTO
export async function createProduct(product) {
    const { data, error } = await supabase
        .from("produtos")
        .insert([product])
        .select();

    if (error) {
        console.error("Erro ao criar produto:", error);
        return null;
    }

    return data[0];
}

// ATUALIZAR PRODUTO
export async function updateProduct(id, updates) {
    const { data, error } = await supabase
        .from("produtos")
        .update(updates)
        .eq("id", id)
        .select();

    if (error) {
        console.error("Erro ao atualizar produto:", error);
        return null;
    }

    return data[0];
}

// DELETAR PRODUTO
export async function deleteProduct(id) {
    const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao deletar produto:", error);
        return false;
    }

    return true;
}