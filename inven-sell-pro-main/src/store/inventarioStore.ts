import { create } from 'zustand';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'inventa_pro_token';

type ApiError = {
  detail?: string | Array<{ msg?: string }>;
};

const getErrorMessage = (error: unknown, fallback = 'Error inesperado') => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const extractApiErrorMessage = (payload: ApiError | null, fallback: string) => {
  if (!payload?.detail) return fallback;
  if (typeof payload.detail === 'string') return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    return payload.detail[0]?.msg ?? fallback;
  }
  return fallback;
};

const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const ensureToken = async () => {
  const stored = getStoredToken();
  if (!stored) {
    throw new Error('Debes iniciar sesion para acceder a esta informacion');
  }
  return stored;
};

const apiRequest = async <T>(
  path: string,
  init?: RequestInit,
  requiresAuth = false,
  retryOnUnauthorized = true
) => {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');

  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const token = await ensureToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (requiresAuth && response.status === 401 && retryOnUnauthorized) {
    clearStoredToken();
    throw new Error('Tu sesion expiro. Inicia sesion nuevamente');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const raw = await response.text();
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const message = extractApiErrorMessage(payload as ApiError, `Error API (${response.status})`);
    throw new Error(message);
  }

  return payload as T;
};

const normalizeProducto = (producto: Producto) => ({
  ...producto,
  descripcion: producto.descripcion ?? '',
});

// --- Types ---
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
}

export type EstadoVenta = 'activa' | 'anulada';

export interface DetalleVenta {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  estado: EstadoVenta;
  detalles: DetalleVenta[];
}

// --- Store ---
interface InventarioState {
  productos: Producto[];
  ventas: Venta[];
  cargando: boolean;
  errorCarga: string | null;

  cargarDatos: () => Promise<void>;

  // Productos
  agregarProducto: (data: Omit<Producto, 'id'>) => Promise<{ success: boolean; error?: string }>;
  editarProducto: (id: number, data: Partial<Omit<Producto, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  eliminarProducto: (id: number) => Promise<{ success: boolean; error?: string }>;

  // Ventas
  crearVenta: (detalles: { producto_id: number; cantidad: number }[]) => Promise<{ success: boolean; error?: string }>;
  editarVenta: (id: number, detalles: { producto_id: number; cantidad: number }[]) => Promise<{ success: boolean; error?: string }>;
  anularVenta: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export const useInventarioStore = create<InventarioState>((set, get) => ({
  productos: [],
  ventas: [],
  cargando: false,
  errorCarga: null,

  cargarDatos: async () => {
    set({ cargando: true, errorCarga: null });
    try {
      const [productos, ventas] = await Promise.all([
        apiRequest<Producto[]>('/productos/', undefined, true),
        apiRequest<Venta[]>('/ventas/', undefined, true),
      ]);

      set({
        productos: productos.map(normalizeProducto),
        ventas,
        cargando: false,
        errorCarga: null,
      });
    } catch (error) {
      set({
        cargando: false,
        errorCarga: getErrorMessage(error, 'No fue posible cargar datos desde la API'),
      });
    }
  },

  agregarProducto: async (data) => {
    try {
      const nuevo = await apiRequest<Producto>(
        '/productos/',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        true
      );

      set((state) => ({ productos: [...state.productos, normalizeProducto(nuevo)] }));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'No fue posible crear el producto') };
    }
  },

  editarProducto: async (id, data) => {
    try {
      const actualizado = await apiRequest<Producto>(
        `/productos/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
        true
      );

      set((state) => ({
        productos: state.productos.map((producto) =>
          producto.id === id ? normalizeProducto(actualizado) : producto
        ),
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'No fue posible actualizar el producto') };
    }
  },

  eliminarProducto: async (id) => {
    try {
      await apiRequest<void>(
        `/productos/${id}`,
        {
          method: 'DELETE',
        },
        true
      );

      set((state) => ({
        productos: state.productos.filter((producto) => producto.id !== id),
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'No fue posible eliminar el producto') };
    }
  },

  crearVenta: async (detalles) => {
    try {
      const venta = await apiRequest<Venta>(
        '/ventas/',
        {
          method: 'POST',
          body: JSON.stringify({ detalles }),
        },
        true
      );

      set((state) => ({ ventas: [...state.ventas, venta] }));
      await get().cargarDatos();
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'No fue posible registrar la venta') };
    }
  },

  editarVenta: async (id, detalles) => {
    try {
      const venta = await apiRequest<Venta>(
        `/ventas/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ detalles }),
        },
        true
      );

      set((state) => ({
        ventas: state.ventas.map((item) => (item.id === id ? venta : item)),
      }));
      await get().cargarDatos();
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'No fue posible editar la venta') };
    }
  },

  anularVenta: async (id) => {
    try {
      const venta = await apiRequest<Venta>(
        `/ventas/${id}/anular`,
        {
          method: 'POST',
        },
        true
      );

      set((state) => ({
        ventas: state.ventas.map((item) => (item.id === id ? venta : item)),
      }));
      await get().cargarDatos();
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'No fue posible anular la venta') };
    }
  },
}));
