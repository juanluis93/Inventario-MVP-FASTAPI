import { useEffect, useMemo, useState } from 'react';
import { useInventarioStore } from '@/store/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Trash2, XCircle, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchContext } from '@/context/SearchContext';

interface LineaVenta {
  producto_id: number;
  cantidad: number;
}

const emptyLinea = (): LineaVenta => ({ producto_id: 0, cantidad: 1 });

const isSameLocalDay = (value: string, reference: Date) => {
  const date = new Date(value);
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
};

const VentasPage = () => {
  const { ventas, productos, crearVenta, anularVenta, cargando, errorCarga, cargarDatos } = useInventarioStore();
  const { query } = useSearchContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [lineas, setLineas] = useState<LineaVenta[]>([emptyLinea()]);
  const [saving, setSaving] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'todas' | 'activas' | 'anuladas'>('todas');
  const [page, setPage] = useState(1);

  const ventasActivas = useMemo(() => ventas.filter((venta) => venta.estado === 'activa'), [ventas]);
  const ventasHoy = useMemo(() => {
    const now = new Date();
    return ventas.filter((venta) => venta.estado === 'activa' && isSameLocalDay(venta.fecha, now));
  }, [ventas]);

  const ventasHoyTotal = ventasHoy.reduce((sum, venta) => sum + venta.total, 0);
  const totalIngresos = ventasActivas.reduce((sum, venta) => sum + venta.total, 0);
  const ticketPromedio = ventasActivas.length ? totalIngresos / ventasActivas.length : 0;
  const anulaciones = ventas.filter((venta) => venta.estado === 'anulada').length;

  const filteredVentas = useMemo(() => {
    return ventas
      .filter((venta) =>
        activeTab === 'activas'
          ? venta.estado === 'activa'
          : activeTab === 'anuladas'
            ? venta.estado === 'anulada'
            : true
      )
      .filter((venta) => String(venta.id).includes(query) || venta.estado.includes(query.toLowerCase()))
      .sort((a, b) => b.id - a.id);
  }, [ventas, activeTab, query]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, query]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredVentas.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const currentVentas = filteredVentas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIndex = filteredVentas.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(filteredVentas.length, currentPage * pageSize);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const selectedVenta = ventas.find((venta) => venta.id === selectedVentaId);

  const formatDateLabel = (fecha: string) =>
    new Intl.DateTimeFormat('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(fecha));

  const formatTimeLabel = (fecha: string) =>
    new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(fecha));

  const resetVentaForm = () => {
    setLineas([emptyLinea()]);
  };

  const addLinea = () => setLineas((current) => [...current, emptyLinea()]);

  const removeLinea = (index: number) => {
    setLineas((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  };

  const updateLinea = (index: number, field: keyof LineaVenta, value: number) => {
    setLineas((current) =>
      current.map((linea, lineIndex) => (lineIndex === index ? { ...linea, [field]: value } : linea))
    );
  };

  const getProducto = (productoId: number) => productos.find((producto) => producto.id === productoId);

  const calcularTotal = () =>
    lineas.reduce((sum, linea) => {
      const producto = getProducto(linea.producto_id);
      return sum + (producto ? producto.precio * linea.cantidad : 0);
    }, 0);

  const openCrearVenta = () => {
    resetVentaForm();
    setCreateOpen(true);
  };

  const openVentaDetail = (ventaId: number) => {
    setSelectedVentaId(ventaId);
    setDetailOpen(true);
  };

  const closeVentaDialog = (open: boolean) => {
    setCreateOpen(open);
    if (!open && !saving) {
      resetVentaForm();
    }
  };

  const handleCrear = async () => {
    const validas = lineas.filter((linea) => linea.producto_id > 0 && linea.cantidad > 0);

    if (validas.length === 0) {
      toast.error('Agrega al menos un producto a la venta');
      return;
    }

    const productoDuplicado = validas.some(
      (linea, index) => validas.findIndex((item) => item.producto_id === linea.producto_id) !== index
    );

    if (productoDuplicado) {
      toast.error('No repitas el mismo producto en varias lineas');
      return;
    }

    const productoSinStock = validas.find((linea) => {
      const producto = getProducto(linea.producto_id);
      return !producto || producto.stock < linea.cantidad;
    });

    if (productoSinStock) {
      toast.error('Revisa el stock disponible antes de registrar la venta');
      return;
    }

    setSaving(true);
    const result = await crearVenta(validas);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error ?? 'No fue posible registrar la venta');
      return;
    }

    toast.success('Venta registrada');
    setCreateOpen(false);
    resetVentaForm();
  };

  const handleAnular = async (id: number) => {
    setCancelingId(id);
    const result = await anularVenta(id);
    setCancelingId(null);

    if (!result.success) {
      toast.error(result.error ?? 'No fue posible anular la venta');
      return;
    }

    toast.success('Venta anulada y stock devuelto');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Ventas Hoy</p>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Ventas</h1>
          <p className="mt-2 text-sm text-[#8b949e]">Registra y gestiona las ventas del negocio</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d]">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button className="bg-[#00e676] text-black hover:brightness-110" onClick={openCrearVenta}>
            + Nueva Venta
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Ventas Hoy</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">${ventasHoyTotal.toFixed(2)}</p>
          <p className="mt-3 text-sm text-[#00e676]">+14.2% vs ayer</p>
        </div>
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Ticket Promedio</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">${ticketPromedio.toFixed(2)}</p>
          <p className="mt-3 text-sm text-[#8b949e]">Basado en {ventasActivas.length} ventas</p>
        </div>
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Anulaciones</p>
          <p className={`mt-4 text-3xl font-bold ${anulaciones > 5 ? 'text-[#f85149]' : 'text-[#8b949e]'}`}>{anulaciones}</p>
          <p className={`mt-3 text-sm ${anulaciones > 5 ? 'text-[#f85149]' : 'text-[#8b949e]'}`}>
            {anulaciones > 5 ? 'Atencion requerida' : 'Dentro del rango normal'}
          </p>
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

      <div className="flex flex-col gap-3 rounded-3xl border border-[#21262d] bg-[#161b22] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#0f161f] p-1">
            {(['todas', 'activas', 'anuladas'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-[#0d1117] text-[#00e676]' : 'text-[#8b949e] hover:bg-[#11181f]'}`}
              >
                {tab === 'todas' ? 'Todas' : tab === 'activas' ? 'Activas' : 'Anuladas'}
              </button>
            ))}
          </div>
          <Button className="bg-[#00e676] text-black hover:brightness-110" onClick={openCrearVenta}>
            + Nueva Venta
          </Button>
        </div>
      </div>

      <div className="bg-[#161b22] rounded-3xl border border-[#21262d] overflow-hidden">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-[#0f161f]">
            <tr>
              <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">ID</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Fecha</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Items</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Total</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Estado</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#8b949e]">Cargando ventas...</td>
              </tr>
            ) : currentVentas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#8b949e]">No hay ventas para mostrar</td>
              </tr>
            ) : (
              currentVentas.map((venta) => (
                <tr key={venta.id} className="border-b border-[#21262d] hover:bg-[#1c2128]">
                  <td className={`px-5 py-4 font-mono text-xs ${venta.estado === 'activa' ? 'text-[#00e676]' : 'text-[#8b949e]'}`}>#VEN-{venta.id}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-[#e6edf3]">{formatDateLabel(venta.fecha)}</div>
                    <div className="text-xs text-[#8b949e]">{formatTimeLabel(venta.fecha)}</div>
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-[#8b949e]">{venta.detalles.length}</td>
                  <td className="px-5 py-4 text-right font-mono text-[#e6edf3]">${venta.total.toFixed(2)}</td>
                  <td className="px-5 py-4 text-center">
                    {venta.estado === 'activa' ? (
                      <span className="inline-flex rounded-full bg-[#00e676]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#00e676]">Activa</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#f85149]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#f85149]">Anulada</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openVentaDetail(venta.id)}>
                        <Eye className="h-4 w-4 text-[#8b949e]" />
                      </Button>
                      {venta.estado === 'activa' ? (
                        <Button variant="ghost" size="icon" onClick={() => void handleAnular(venta.id)} disabled={cancelingId === venta.id}>
                          <XCircle className="h-4 w-4 text-[#f85149]" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[#21262d] bg-[#161b22] p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#8b949e]">MOSTRANDO {startIndex} A {endIndex} DE {filteredVentas.length} VENTAS</div>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3] disabled:border-[#21262d] disabled:bg-[#161b22] disabled:text-[#4b5563] disabled:opacity-100"
              disabled={currentPage === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-[#e6edf3]">{currentPage} / {pageCount}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3] disabled:border-[#21262d] disabled:bg-[#161b22] disabled:text-[#4b5563] disabled:opacity-100"
              disabled={currentPage === pageCount}
              onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={createOpen} onOpenChange={closeVentaDialog}>
        <DialogContent className="max-w-2xl border-[#21262d] bg-[#161b22] text-[#e6edf3]">
          <DialogHeader>
            <DialogTitle>Nueva Venta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {lineas.map((linea, index) => {
              const producto = getProducto(linea.producto_id);
              const subtotal = producto ? producto.precio * linea.cantidad : 0;

              return (
                <div key={index} className="grid gap-3 rounded-2xl border border-[#21262d] bg-[#0d1117] p-4 md:grid-cols-[1.6fr_120px_120px_48px] md:items-end">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-[#8b949e]">Producto</label>
                    <Select value={linea.producto_id ? String(linea.producto_id) : ''} onValueChange={(value) => updateLinea(index, 'producto_id', Number(value))}>
                      <SelectTrigger className="border-[#21262d] bg-[#161b22] text-[#e6edf3]">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent className="border-[#21262d] bg-[#161b22] text-[#e6edf3]">
                        {productos
                          .filter((productoItem) => productoItem.stock > 0 || productoItem.id === linea.producto_id)
                          .map((productoItem) => (
                            <SelectItem key={productoItem.id} value={String(productoItem.id)}>
                              {productoItem.nombre} | stock: {productoItem.stock} | ${productoItem.precio.toFixed(2)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-[#8b949e]">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={linea.cantidad}
                      onChange={(event) => updateLinea(index, 'cantidad', Math.max(1, parseInt(event.target.value || '1', 10)))}
                      className="border-[#21262d] bg-[#161b22] text-[#e6edf3] focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-[#8b949e]">Subtotal</label>
                    <div className="flex h-10 items-center rounded-md border border-[#21262d] bg-[#161b22] px-3 font-mono text-sm text-[#00e676]">
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeLinea(index)} disabled={lineas.length === 1} className="text-[#f85149]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLinea}
              className="gap-1 border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              <Plus className="h-3 w-3" /> Agregar linea
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-[#21262d] pt-4">
            <div className="text-sm text-[#8b949e]">{lineas.length} linea(s) en la venta</div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.08em] text-[#8b949e]">Total</div>
              <div className="font-mono text-2xl font-bold text-[#e6edf3]">${calcularTotal().toFixed(2)}</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeVentaDialog(false)}
              disabled={saving}
              className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              Cancelar
            </Button>
            <Button className="bg-[#00e676] text-black hover:brightness-110" onClick={() => void handleCrear()} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="border-[#21262d] bg-[#161b22] text-[#e6edf3] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de venta #{selectedVenta?.id}</DialogTitle>
          </DialogHeader>
          {selectedVenta ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#8b949e]">Fecha</p>
                  <p className="text-[#e6edf3]">{new Date(selectedVenta.fecha).toLocaleString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-[#8b949e]">Estado</p>
                  <div className="mt-2">
                    {selectedVenta.estado === 'activa' ? (
                      <span className="inline-flex rounded-full bg-[#00e676]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#00e676]">Activa</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#f85149]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#f85149]">Anulada</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#21262d]">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-[#0f161f]">
                    <tr>
                      <th className="border-b border-[#21262d] px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Producto</th>
                      <th className="border-b border-[#21262d] px-4 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Cant.</th>
                      <th className="border-b border-[#21262d] px-4 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">P. Unit.</th>
                      <th className="border-b border-[#21262d] px-4 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVenta.detalles.map((detalle) => {
                      const producto = getProducto(detalle.producto_id);
                      return (
                        <tr key={detalle.id} className="border-b border-[#21262d] hover:bg-[#1c2128]">
                          <td className="px-4 py-3 text-[#e6edf3]">{producto?.nombre ?? `#${detalle.producto_id}`}</td>
                          <td className="px-4 py-3 text-center text-[#8b949e]">{detalle.cantidad}</td>
                          <td className="px-4 py-3 text-right font-mono text-[#e6edf3]">${detalle.precio_unitario.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[#e6edf3]">${(detalle.precio_unitario * detalle.cantidad).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-right text-lg font-bold font-mono text-[#e6edf3]">Total: ${selectedVenta.total.toFixed(2)}</div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VentasPage;
