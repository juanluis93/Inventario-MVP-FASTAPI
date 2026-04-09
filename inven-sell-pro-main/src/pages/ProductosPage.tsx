import { useState } from 'react';
import { useInventarioStore } from '@/store/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Producto } from '@/store/inventarioStore';

const emptyForm = { nombre: '', descripcion: '', precio: '', stock: '' };

const ProductosPage = () => {
  const { productos, agregarProducto, editarProducto, eliminarProducto, cargando, errorCarga, cargarDatos } = useInventarioStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Producto) => {
    setEditingId(p.id);
    setForm({ nombre: p.nombre, descripcion: p.descripcion, precio: String(p.precio), stock: String(p.stock) });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio || form.stock === '') {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock);
    if (isNaN(precio) || precio <= 0) { toast.error('Precio inválido'); return; }
    if (isNaN(stock) || stock < 0) { toast.error('Stock inválido'); return; }

    setSaving(true);
    if (editingId) {
      const result = await editarProducto(editingId, { nombre: form.nombre, descripcion: form.descripcion, precio, stock });
      if (result.success) {
        toast.success('Producto actualizado');
      } else {
        toast.error(result.error ?? 'No fue posible actualizar el producto');
      }
    } else {
      const result = await agregarProducto({ nombre: form.nombre, descripcion: form.descripcion, precio, stock });
      if (result.success) {
        toast.success('Producto creado');
      } else {
        toast.error(result.error ?? 'No fue posible crear el producto');
      }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      setDeleting(true);
      const result = await eliminarProducto(deletingId);
      if (result.success) {
        toast.success('Producto eliminado');
      } else {
        toast.error(result.error ?? 'No fue posible eliminar el producto');
      }
      setDeleting(false);
    }
    setDeleteDialogOpen(false);
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Sin stock</Badge>;
    if (stock <= 10) return <Badge className="bg-warning text-warning-foreground">Bajo</Badge>;
    return <Badge className="bg-success text-success-foreground">{stock}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tu catálogo de productos e inventario</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {errorCarga && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm flex items-center justify-between gap-3">
          <span className="text-destructive">Error cargando API: {errorCarga}</span>
          <Button variant="outline" size="sm" onClick={() => void cargarDatos()}>Reintentar</Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Cargando productos...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  No hay productos
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-mono text-muted-foreground text-xs">#{p.id}</TableCell>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">{p.descripcion}</TableCell>
                  <TableCell className="text-right font-mono font-medium">${p.precio.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{stockBadge(p.stock)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setDeletingId(p.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre *</label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Laptop HP" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción</label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Precio *</label>
                <Input type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Stock *</label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>{editingId ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductosPage;
