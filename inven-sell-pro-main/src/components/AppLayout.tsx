import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
];

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('inventa_pro_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[192px] flex-col border-r border-[#21262d] bg-[#0d1117] transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col gap-2 border-b border-[#21262d] px-5 pb-6 pt-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00e676] text-black font-bold">I</div>
          <div>
            <p className="text-sm font-bold tracking-tight">InvenSell Pro</p>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">Precision Inventory</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 border-t border-dashed border-[#21262d] px-2 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-l-2 border-[#00e676] bg-[#09100f] text-[#00e676]'
                    : 'text-[#8b949e] hover:bg-[#11181f] hover:text-[#e6edf3]'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-dashed border-[#21262d] px-4 py-5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#8b949e] hover:bg-[#11181f] hover:text-[#e6edf3]"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen ? <div className="fixed inset-0 z-40 bg-[#00000080] lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

      <div className="min-h-screen lg:ml-[192px]">
        <div className="p-4 md:p-6 xl:p-8">
          <button
            className="mb-4 inline-flex rounded-xl border border-[#21262d] bg-[#161b22] p-2 text-[#8b949e] lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            type="button"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <main className="min-h-[calc(100vh-2rem)] bg-[#0d1117]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
