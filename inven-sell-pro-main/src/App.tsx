import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventarioStore } from "@/store/inventarioStore";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ProductosPage from "./pages/ProductosPage";
import VentasPage from "./pages/VentasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DataBootstrapper = () => {
  const { cargarDatos } = useInventarioStore();

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DataBootstrapper />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/ventas" element={<VentasPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
