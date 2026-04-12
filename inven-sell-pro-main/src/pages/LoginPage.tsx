import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TOKEN_STORAGE_KEY = 'inventa_pro_token';
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

const registerUser = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail || 'No fue posible registrar el usuario';
    throw new Error(detail);
  }
};

const loginUser = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail || 'No fue posible iniciar sesion';
    throw new Error(detail);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload?.access_token) {
    throw new Error('La API no devolvio un token valido');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token);
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (isRegisterMode && password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        await registerUser(username, password);
      }

      await loginUser(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticacion');
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-[#21262d] bg-[#161b22] p-8 shadow-card">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00e676] text-black font-bold">
              I
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b949e]">INVENSELL PRO</p>
            <h1 className="mt-4 text-2xl font-bold text-[#e6edf3]">
              {isRegisterMode ? 'Crear cuenta' : 'Bienvenido de nuevo'}
            </h1>
            <p className="mt-2 text-sm text-[#8b949e]">
              {isRegisterMode
                ? 'Registra un usuario nuevo usando la API del backend.'
                : 'Ingresa tus credenciales para acceder al panel ejecutivo.'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Usuario</label>
              <div className="relative rounded-xl border border-[#21262d] bg-[#0d1117] px-4 py-2 focus-within:border-[#00e676]">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="nombre.usuario"
                  className="bg-transparent border-0 pl-10 text-[#e6edf3] placeholder:text-[#8b949e] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Contrasena</label>
              <div className="relative rounded-xl border border-[#21262d] bg-[#0d1117] px-4 py-2 focus-within:border-[#00e676]">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="bg-transparent border-0 pl-10 text-[#e6edf3] placeholder:text-[#8b949e] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {isRegisterMode ? (
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.08em] text-[#8b949e]">Confirmar contrasena</label>
                <div className="relative rounded-xl border border-[#21262d] bg-[#0d1117] px-4 py-2 focus-within:border-[#00e676]">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="********"
                    className="bg-transparent border-0 pl-10 text-[#e6edf3] placeholder:text-[#8b949e] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-xs text-[#8b949e]">Se creara el usuario usando el endpoint `/auth/register` del backend.</p>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-sm text-[#8b949e]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-[#21262d] bg-[#0d1117] text-[#00e676] focus:ring-[#00e676]"
                />
                Recordarme
              </label>
              <button
                type="button"
                className="text-[#00e676] hover:text-[#6bff9d]"
                onClick={() => {
                  setIsRegisterMode((current) => !current);
                  setError('');
                  setConfirmPassword('');
                }}
              >
                {isRegisterMode ? 'Ya tengo cuenta' : 'Crear cuenta'}
              </button>
            </div>

            {error ? <div className="rounded-xl border border-[#f85149] bg-[#3b1718] px-4 py-3 text-sm text-[#f85149]">{error}</div> : null}

            <Button
              type="submit"
              className="w-full rounded-xl bg-[#00e676] text-black font-bold hover:brightness-110 h-11"
              disabled={loading}
            >
              {isRegisterMode ? 'Registrarse' : 'Iniciar sesion'} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 border-t border-[#21262d] pt-5 text-center text-sm text-[#8b949e]">
            {isRegisterMode ? 'Si el usuario no existe, se creara con /auth/register.' : 'No tienes una cuenta? '}
            {!isRegisterMode ? (
              <button
                type="button"
                className="text-[#00e676] hover:text-[#6bff9d]"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError('');
                  setConfirmPassword('');
                }}
              >
                Registrate aqui
              </button>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#21262d] px-6 py-4 text-sm text-[#8b949e] flex flex-col sm:flex-row sm:justify-between gap-3">
        <span>(c) 2024 INVENSELL PRO. PRECISION ATMOSPHERE.</span>
        <div className="flex gap-4 justify-center sm:justify-end">
          <button className="hover:text-[#00e676]">Privacy Policy</button>
          <button className="hover:text-[#00e676]">Terms of Service</button>
          <button className="hover:text-[#00e676]">System Status</button>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
