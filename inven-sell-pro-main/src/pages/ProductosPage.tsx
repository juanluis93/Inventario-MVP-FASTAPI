import { useEffect, useMemo, useState } from 'react';
import { useInventarioStore, type Producto } from '@/store/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchContext } from '@/context/SearchContext';

const emptyForm = { nombre: '', descripcion: '', precio: '', stock: '' };
const palette = ['#00b894', '#00e676', '#22c55e', '#14b8a6', '#38bdf8'];

const ProductosPage = () => {
  const { productos, agregarProducto, editarProducto, eliminarProducto, cargando, errorCarga, cargarDatos } = useInventarioStore();
  const { query } = useSearchContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const filteredProductos = useMemo(
    () =>
      productos.filter((p) =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(query.toLowerCase())
      ),
    [productos, query]
  );

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalStock = productos.reduce((sum, producto) => sum + producto.stock, 0);
  const agotados = productos.filter((p) => p.stock === 0).length;
  const valorInventario = productos.reduce((sum, producto) => sum + producto.precio * producto.stock, 0);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredProductos.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const currentProducts = filteredProductos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIndex = filteredProductos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(filteredProductos.length, currentPage * pageSize);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const generateSku = (producto: Producto) => {
    const prefix = producto.nombre
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    return `${prefix}-${String(producto.id).padStart(2, '0')}`;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (producto: Producto) => {
    setEditingId(producto.id);
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: String(producto.precio),
      stock: String(producto.stock),
    });
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !saving) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.precio.trim() || form.stock.trim() === '') {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock, 10);

    if (Number.isNaN(precio) || precio <= 0) {
      toast.error('Ingresa un precio valido');
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      toast.error('Ingresa un stock valido');
      return;
    }

    setSaving(true);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio,
      stock,
    };

    const result = editingId
      ? await editarProducto(editingId, payload)
      : await agregarProducto(payload);

    setSaving(false);

    if (!result.success) {
      toast.error(result.error ?? 'No fue posible guardar el producto');
      return;
    }

    toast.success(editingId ? 'Producto actualizado' : 'Producto creado');
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setDeleting(true);
    const result = await eliminarProducto(deletingId);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? 'No fue posible eliminar el producto');
      return;
    }

    toast.success('Producto eliminado');
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const renderStockBadge = (stock: number) => {
    if (stock === 0) return <span className="inline-flex rounded-full bg-[#f85149] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">0 unidades</span>;
    if (stock <= 5) return <span className="inline-flex rounded-full bg-[#e3702a] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-black">{stock} unidades</span>;
    if (stock <= 10) return <span className="inline-flex rounded-full bg-[#d29922] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-black">{stock} unidades</span>;
    return <span className="inline-flex rounded-full bg-[#0f766e] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">{stock} unidades</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Inventario Maestro</p>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Productos</h1>
        </div>
        <Button className="bg-[#00e676] text-black hover:brightness-110" onClick={openCreate}>
          + Nuevo Producto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Total Stock</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">{totalStock}</p>
          <p className="mt-3 text-sm text-[#00e676]">+12% vs mes pasado</p>
        </div>
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Agotados</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">{agotados}</p>
          <p className="mt-3 text-sm text-[#f85149]">Requiere atencion</p>
        </div>
        <div className="rounded-3xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Valor Inventario</p>
          <p className="mt-4 text-3xl font-bold text-[#e6edf3]">${valorInventario.toFixed(2)}</p>
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

      <div className="rounded-3xl border border-[#21262d] bg-[#161b22] overflow-hidden">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-[#0f161f]">
            <tr>
              <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Producto</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Descripcion</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Precio</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Stock</th>
              <th className="border-b border-[#21262d] px-5 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-[#8b949e]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#8b949e]">Cargando productos...</td>
              </tr>
            ) : currentProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#8b949e]">No se encontraron productos</td>
              </tr>
            ) : (
              currentProducts.map((producto) => {
                const color = palette[producto.id % palette.length];
                return (
                  <tr key={producto.id} className="border-b border-[#21262d] hover:bg-[#1c2128]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold text-white" style={{ backgroundColor: color }}>
                          {producto.nombre.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-medium text-[#e6edf3]">{producto.nombre}</div>
                          <div className="text-xs text-[#8b949e]">SKU: {generateSku(producto)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#8b949e]">{producto.descripcion || 'Sin descripcion'}</td>
                    <td className="px-5 py-4 text-right font-mono text-[#00e676]">${producto.precio.toFixed(2)}</td>
                    <td className="px-5 py-4 text-center">{renderStockBadge(producto.stock)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(producto)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(producto.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-[#f85149]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[#21262d] bg-[#161b22] p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#8b949e]">MOSTRANDO {startIndex} A {endIndex} DE {filteredProductos.length} PRODUCTOS</div>
        {pageCount > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3] disabled:border-[#21262d] disabled:bg-[#161b22] disabled:text-[#4b5563] disabled:opacity-100"
              disabled={currentPage === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Prev
            </Button>
            {Array.from({ length: pageCount }, (_, index) => (
              <Button
                key={index}
                type="button"
                variant={currentPage === index + 1 ? 'default' : 'outline'}
                size="sm"
                className={
                  currentPage === index + 1
                    ? 'bg-[#00e676] text-black hover:brightness-110'
                    : 'border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3]'
                }
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3] disabled:border-[#21262d] disabled:bg-[#161b22] disabled:text-[#4b5563] disabled:opacity-100"
              disabled={currentPage === pageCount}
              onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="border-[#21262d] bg-[#161b22] text-[#e6edf3] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                placeholder="Ej: Laptop HP"
                className="border-[#21262d] bg-[#0d1117] text-[#e6edf3] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">Descripcion</label>
              <Textarea
                value={form.descripcion}
                onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                placeholder="Descripcion del producto"
                rows={3}
                className="border-[#21262d] bg-[#0d1117] text-[#e6edf3] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">Precio *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(event) => setForm({ ...form, precio: event.target.value })}
                  placeholder="0.00"
                  className="border-[#21262d] bg-[#0d1117] text-[#e6edf3] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">Stock *</label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  placeholder="0"
                  className="border-[#21262d] bg-[#0d1117] text-[#e6edf3] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeDialog(false)}
              disabled={saving}
              className="border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              Cancelar
            </Button>
            <Button className="bg-[#00e676] text-black hover:brightness-110" onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-[#21262d] bg-[#161b22] text-[#e6edf3] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#8b949e]">Esta accion no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductosPage;
