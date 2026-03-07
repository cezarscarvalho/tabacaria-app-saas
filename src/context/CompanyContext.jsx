import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../core/supabaseClient";

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
    const [session, setSession] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [role, setRole] = useState(null);
    const [loadingCompany, setLoadingCompany] = useState(true);

    // ==========================
    // BUSCAR SESSÃO AUTOMATICAMENTE
    // ==========================
    useEffect(() => {

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
            });

        return () => subscription.unsubscribe();

    }, []);

    // ==========================
    // CARREGAR EMPRESA
    // ==========================
    useEffect(() => {

        if (!session) {
            setLoadingCompany(false);
            return;
        }

        async function loadCompany() {

            setLoadingCompany(true);

            const { data: vinculo, error } = await supabase
                .from("usuarios_empresa")
                .select("empresa_id, role")
                .eq("user_id", session.user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Erro ao buscar vínculo:", error);
                setLoadingCompany(false);
                return;
            }

            if (!vinculo) {
                // Criar empresa nova
                const { data: novaEmpresa, error: errorEmpresa } = await supabase
                    .from("empresas")
                    .insert([
                        {
                            nome: "Minha Empresa",
                            owner_id: session.user.id
                        }
                    ])
                    .select()
                    .single();

                if (errorEmpresa) {
                    console.error("Erro ao criar empresa:", errorEmpresa);
                    setLoadingCompany(false);
                    return;
                }

                await supabase.from("usuarios_empresa").insert([
                    {
                        empresa_id: novaEmpresa.id,
                        user_id: session.user.id,
                        role: "owner"
                    }
                ]);

                setCompanyId(novaEmpresa.id);
                setRole("owner");

            } else {
                setCompanyId(vinculo.empresa_id);
                setRole(vinculo.role);
            }

            setLoadingCompany(false);
        }

        loadCompany();

    }, [session]);

    return (
        <CompanyContext.Provider value={{ companyId, role, loadingCompany }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    return useContext(CompanyContext);
}