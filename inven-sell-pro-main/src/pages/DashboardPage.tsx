import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventarioStore } from '@/store/inventarioStore';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Circle, DollarSign, AlertTriangle, MoreHorizontal } from 'lucide-react';

const formatInvoiceId = (id: number) => `#INV-${String(id).padStart(4, '0')}`;

const isSameLocalDay = (value: string, reference: Date) => {
  const date = new Date(value);
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { productos, ventas, cargando, errorCarga, cargarDatos } = useInventarioStore();

  const ventasActivas = useMemo(() => ventas.filter((v) => v.estado === 'activa'), [ventas]);
  const totalVentas = useMemo(() => ventasActivas.reduce((sum, v) => sum + v.total, 0), [ventasActivas]);
  const productosBajoStock = useMemo(() => productos.filter((p) => p.stock <= 10), [productos]);
  const ventasDeHoy = useMemo(() => {
    const now = new Date();
    return ventas
      .filter((venta) => isSameLocalDay(venta.fecha, now))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ventas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Dashboard Overview</p>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Dashboard Overview</h1>
          <p className="mt-2 text-sm text-[#8b949e]">Real-time inventory and sales performance tracking.</p>
        </div>
      </div>

      {errorCarga ? (
        <div className="rounded-3xl border border-[#f85149]/20 bg-[#2d1517] p-4 text-sm text-[#f85149] flex items-center justify-between gap-3">
          <span>Error cargando API: {errorCarga}</span>
          <Button variant="outline" size="sm" onClick={() => void cargarDatos()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {cargando ? (
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-4 text-sm text-[#8b949e]">Cargando información...</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Total de Productos</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">{productos.length}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#00e676]">
            <ArrowUpRight className="h-4 w-4" />
            +12%
          </div>
        </div>

        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Ventas Activas</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">{ventasActivas.length}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#00e676]">
            <Circle className="h-3 w-3" />
            En curso
          </div>
        </div>

        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Ingresos Totales</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">${totalVentas.toFixed(2)}</p>
          <div className="mt-4 h-1.5 w-16 rounded-full bg-[#00e676]/20" />
        </div>

        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Stock Bajo</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">{productosBajoStock.length}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#f85149]">
            <AlertTriangle className="h-4 w-4" />
            Crítico
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#21262d] bg-[#161b22]">
          <div className="flex items-center justify-between border-b border-[#21262d] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Ventas de Hoy</h2>
            <MoreHorizontal className="h-5 w-5 text-[#8b949e]" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#0f161f]">
                  <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">ID</th>
                  <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Fecha</th>
                  <th className="border-b border-[#21262d] px-5 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Total</th>
                  <th className="border-b border-[#21262d] px-5 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventasDeHoy.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#8b949e]">No hay ventas registradas hoy</td>
                  </tr>
                ) : (
                  ventasDeHoy.map((venta) => (
                    <tr key={venta.id} className="border-b border-[#21262d] hover:bg-[#1c2128]">
                      <td className="px-5 py-4 font-mono text-xs text-[#00e676]">{formatInvoiceId(venta.id)}</td>
                      <td className="px-5 py-4 text-sm text-[#e6edf3]">{new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(venta.fecha))}</td>
                      <td className="px-5 py-4 text-right font-mono text-[#e6edf3]">${venta.total.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        {venta.estado === 'activa' ? (
                          <span className="inline-flex rounded-full bg-[#00e676]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#00e676]">Activa</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#f85149]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#f85149]">Anulada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[#21262d] bg-[#161b22]">
          <div className="flex items-center justify-between border-b border-[#21262d] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Stock Bajo</h2>
            <Button
              variant="outline"
              className="border-[#21262d] bg-[#0f161f] text-[#00e676] hover:bg-[#21262d] text-sm"
              onClick={() => navigate('/productos')}
            >
              Ver inventario completo
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#0f161f]">
                  <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Nombre</th>
                  <th className="border-b border-[#21262d] px-5 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Precio</th>
                  <th className="border-b border-[#21262d] px-5 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productosBajoStock.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-[#8b949e]">No hay productos con stock bajo</td>
                  </tr>
                ) : (
                  productosBajoStock.map((producto) => {
                    const badgeColor = producto.stock === 0 ? 'bg-[#f85149] text-[#ffffff]' : producto.stock <= 5 ? 'bg-[#e3702a] text-[#000000]' : 'bg-[#d29922] text-[#000000]';
                    return (
                      <tr key={producto.id} className="border-b border-[#21262d] hover:bg-[#1c2128]">
                        <td className="flex items-center gap-3 px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-bold text-white bg-[#00e676]">
                            {producto.nombre.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-[#e6edf3]">{producto.nombre}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-[#e6edf3]">${producto.precio.toFixed(2)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${badgeColor}`}>{producto.stock} unidades</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
