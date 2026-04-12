import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useInventarioStore } from '@/store/inventarioStore';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProductosPage from './pages/ProductosPage';
import VentasPage from './pages/VentasPage';
import NotFound from './pages/NotFound';
import { SearchProvider } from '@/context/SearchContext';

const queryClient = new QueryClient();

const DataBootstrapper = () => {
  const { cargarDatos } = useInventarioStore();
  const token = localStorage.getItem('inventa_pro_token');

  useEffect(() => {
    if (token) {
      void cargarDatos();
    }
  }, [cargarDatos, token]);

  return null;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const token = localStorage.getItem('inventa_pro_token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const ProtectedApp = () => (
  <>
    <DataBootstrapper />
    <AppLayout />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SearchProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth><ProtectedApp /></RequireAuth>}>
              <Route path="/" element={<Navigate replace to="/dashboard" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/ventas" element={<VentasPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SearchProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
