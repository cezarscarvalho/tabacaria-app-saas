import { supabase } from '../lib/supabaseClient.js';

async function checkSuppliers() {
    const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome, whatsapp');

    if (error) {
        console.error('Erro ao buscar fornecedores:', error.message);
        return;
    }

    console.log('--- LISTA DE FORNECEDORES ---');
    console.table(data);
    process.exit(0);
}

checkSuppliers();
