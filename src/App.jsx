import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanyProvider } from "./context/CompanyContext";

import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import Clients from "./pages/admin/Clients";
import Suppliers from "./pages/admin/Suppliers";
import Finance from "./pages/admin/Finance";
import Settings from "./pages/admin/Settings";

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