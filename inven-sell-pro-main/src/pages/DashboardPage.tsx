import { useInventarioStore } from '@/store/inventarioStore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';

const DashboardPage = () => {
  const { productos, ventas, cargando, errorCarga, cargarDatos } = useInventarioStore();

  const ventasActivas = ventas.filter((v) => v.estado === 'activa');
  const totalVentas = ventasActivas.reduce((s, v) => s + v.total, 0);
  const productosBajoStock = productos.filter((p) => p.stock <= 10);
  const ultimasVentas = [...ventas].sort((a, b) => b.id - a.id).slice(0, 5);

  const stats = [
    { label: 'Productos', value: productos.length, icon: Package, color: 'text-primary' },
    { label: 'Ventas Activas', value: ventasActivas.length, icon: ShoppingCart, color: 'text-accent' },
    { label: 'Ingresos', value: `$${totalVentas.toFixed(2)}`, icon: DollarSign, color: 'text-success' },
    { label: 'Stock Bajo', value: productosBajoStock.length, icon: AlertTriangle, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general del inventario y ventas</p>
      </div>

      {errorCarga && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm flex items-center justify-between gap-3">
          <span className="text-destructive">Error cargando API: {errorCarga}</span>
          <Button variant="outline" size="sm" onClick={() => void cargarDatos()}>Reintentar</Button>
        </div>
      )}

      {cargando && (
        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          Sincronizando datos con FastAPI...
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h2 className="font-semibold">Últimas Ventas</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimasVentas.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin ventas aún</TableCell></TableRow>
                ) : (
                  ultimasVentas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">#{v.id}</TableCell>
                      <TableCell className="text-sm">{new Date(v.fecha).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell className="text-right font-mono font-medium">${v.total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {v.estado === 'activa' ? <Badge className="bg-success text-success-foreground text-xs">Activa</Badge> : <Badge variant="destructive" className="text-xs">Anulada</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h2 className="font-semibold">Productos con Stock Bajo</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosBajoStock.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Todo en orden 👍</TableCell></TableRow>
                ) : (
                  productosBajoStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-right font-mono">${p.precio.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {p.stock === 0 ? <Badge variant="destructive">0</Badge> : <Badge className="bg-warning text-warning-foreground">{p.stock}</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
