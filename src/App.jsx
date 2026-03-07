import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanyProvider } from "./context/CompanyContext";

import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./modules/dashboard/pages/Dashboard";
import Orders from "./modules/orders/pages/Orders";
import Products from "./modules/products/pages/Products";
import Clients from "./modules/clients/pages/Clients";
import Suppliers from "./modules/suppliers/pages/Suppliers.jsx";
import Finance from "./modules/finance/pages/Finance";
import Settings from "./modules/settings/pages/Settings";

import Login from "./pages/auth/Login";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <CompanyProvider>
        <Routes>

          {/* rota de login */}
          <Route path="/login" element={<Login />} />

          {/* rotas admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="clients" element={<Clients />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="finance" element={<Finance />} />
            <Route path="settings" element={<Settings />} />
          </Route>

        </Routes>
      </CompanyProvider>
    </BrowserRouter>
  );
}

export default App;