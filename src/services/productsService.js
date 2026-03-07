import { supabase } from "../core/supabaseClient";

export async function getProducts(companyId) {
    const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("company_id", companyId);

    return { data, error };
}

export async function createProduct(product) {
    const { data, error } = await supabase
        .from("produtos")
        .insert(product);

    return { data, error };
}