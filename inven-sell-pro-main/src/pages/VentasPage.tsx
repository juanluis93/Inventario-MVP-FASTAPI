import { useState } from 'react';
import { useInventarioStore } from '@/store/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Trash2, ShoppingCart, XCircle, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface LineaVenta {
  producto_id: number;
  cantidad: number;
}

const VentasPage = () => {
  const { ventas, productos, crearVenta, anularVenta, cargando, errorCarga, cargarDatos } = useInventarioStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [lineas, setLineas] = useState<LineaVenta[]>([{ producto_id: 0, cantidad: 1 }]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const filtered = ventas
    .filter((v) => String(v.id).includes(search) || v.estado.includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const selectedVenta = ventas.find((v) => v.id === selectedVentaId);

  const addLinea = () => setLineas([...lineas, { producto_id: 0, cantidad: 1 }]);
  const removeLinea = (idx: number) => setLineas(lineas.filter((_, i) => i !== idx));
  const updateLinea = (idx: number, field: keyof LineaVenta, value: number) =>
    setLineas(lineas.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const calcularTotal = () =>
    lineas.reduce((sum, l) => {
      const prod = productos.find((p) => p.id === l.producto_id);
      return sum + (prod ? prod.precio * l.cantidad : 0);
    }, 0);

  const handleCrear = async () => {
    const valid = lineas.filter((l) => l.producto_id > 0 && l.cantidad > 0);
    if (valid.length === 0) { toast.error('Agrega al menos un producto'); return; }
    setSaving(true);
    const result = await crearVenta(valid);
    setSaving(false);
    if (result.success) {
      toast.success('Venta registrada');
      setCreateOpen(false);
      setLineas([{ producto_id: 0, cantidad: 1 }]);
    } else {
      toast.error(result.error);
    }
  };

  const handleAnular = async (id: number) => {
    setCancelingId(id);
    const result = await anularVenta(id);
    setCancelingId(null);
    if (result.success) {
      toast.success('Venta anulada - stock devuelto');
    } else {
      toast.error(result.error ?? 'No fue posible anular la venta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground text-sm mt-1">Registra y gestiona las ventas del negocio</p>
        </div>
        <Button onClick={() => { setLineas([{ producto_id: 0, cantidad: 1 }]); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Venta
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por ID o estado..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {errorCarga && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm flex items-center justify-between gap-3">
          <span className="text-destructive">Error cargando API: {errorCarga}</span>
          <Button variant="outline" size="sm" onClick={() => void cargarDatos()}>Reintentar</Button>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-card border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Cargando ventas...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  No hay ventas registradas
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id} className="group">
                  <TableCell className="font-mono text-muted-foreground text-xs">#{v.id}</TableCell>
                  <TableCell className="text-sm">{new Date(v.fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">${v.total.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    {v.estado === 'activa' ? (
                      <Badge className="bg-success text-success-foreground">Activa</Badge>
                    ) : (
                      <Badge variant="destructive">Anulada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{v.detalles.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedVentaId(v.id); setDetailOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {v.estado === 'activa' && (
                        <Button variant="ghost" size="icon" onClick={() => void handleAnular(v.id)} disabled={cancelingId === v.id}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Sale Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto">
            {lineas.map((l, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  {idx === 0 && <label className="text-xs font-medium mb-1 block">Producto</label>}
                  <Select value={l.producto_id ? String(l.producto_id) : ''} onValueChange={(v) => updateLinea(idx, 'producto_id', Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre} (stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  {idx === 0 && <label className="text-xs font-medium mb-1 block">Cant.</label>}
                  <Input type="number" min={1} value={l.cantidad} onChange={(e) => updateLinea(idx, 'cantidad', parseInt(e.target.value) || 1)} />
                </div>
                <div className="w-24 text-right font-mono text-sm pt-1">
                  {(() => { const p = productos.find((p) => p.id === l.producto_id); return p ? `$${(p.precio * l.cantidad).toFixed(2)}` : '—'; })()}
                </div>
                {lineas.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeLinea(idx)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLinea} className="gap-1">
              <Plus className="h-3 w-3" /> Agregar línea
            </Button>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Total:</span>
            <span className="text-xl font-bold font-mono">${calcularTotal().toFixed(2)}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleCrear()} disabled={saving}>Registrar Venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Venta #{selectedVenta?.id}</DialogTitle>
          </DialogHeader>
          {selectedVenta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Fecha:</span><br/>{new Date(selectedVenta.fecha).toLocaleString('es-ES')}</div>
                <div><span className="text-muted-foreground">Estado:</span><br/>
                  {selectedVenta.estado === 'activa' ? <Badge className="bg-success text-success-foreground">Activa</Badge> : <Badge variant="destructive">Anulada</Badge>}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">P. Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVenta.detalles.map((d) => {
                    const prod = productos.find((p) => p.id === d.producto_id);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>{prod?.nombre ?? `#${d.producto_id}`}</TableCell>
                        <TableCell className="text-center">{d.cantidad}</TableCell>
                        <TableCell className="text-right font-mono">${d.precio_unitario.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">${(d.precio_unitario * d.cantidad).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="text-right text-lg font-bold font-mono border-t pt-2">Total: ${selectedVenta.total.toFixed(2)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VentasPage;
