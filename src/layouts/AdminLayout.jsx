import { Outlet, NavLink } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";

export default function AdminLayout() {

  const { loadingCompany } = useCompany();

  if (loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="animate-pulse text-lg">
          Carregando sua empresa...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-white">

      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] hidden md:flex flex-col p-4">

        <h2 className="text-xl font-bold mb-6">Tabacaria SaaS</h2>

        <NavLink to="/admin" end className="mb-2">
          Dashboard
        </NavLink>

        <NavLink to="/admin/orders" className="mb-2">
          Pedidos
        </NavLink>

        <NavLink to="/admin/products" className="mb-2">
          Produtos
        </NavLink>

        <NavLink to="/admin/clients" className="mb-2">
          Clientes
        </NavLink>

        <NavLink to="/admin/suppliers" className="mb-2">
          Fornecedores
        </NavLink>

        <NavLink to="/admin/finance" className="mb-2">
          Financeiro
        </NavLink>

        <NavLink to="/admin/settings" className="mb-2">
          Configurações
        </NavLink>

      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

    </div>
  );
}