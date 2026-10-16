import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/auth.service";
import { ApiError } from "@/services/api";
import { toast } from "sonner";
import { getWorkerToken } from "@/lib/worker-token";
import type { RolUi, WorkerSession } from "@/types/trabajador";
import { rutaInicialPorRol } from "@/lib/access-control";
import { setWorkerToken } from "@/lib/worker-token";

export type Rol = RolUi;
export type { WorkerSession };

interface SessionContextValue {
  session: WorkerSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usuario: string, password: string) => Promise<WorkerSession | null>;
  logout: (avisar?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/** Estado global de sesión contra el backend real (equivale a CCA). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sessionQuery = useQuery({
    queryKey: ["worker-session"],
    // Sin token no hay request: evita el 401 en loop que te devolvía a /login.
    queryFn: async () => {
      if (!getWorkerToken()) return null;
      try {
        return await AuthService.me();
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    retry: false,
  });

  const logout = useCallback(
    async (avisar = false) => {
      await queryClient.cancelQueries();
      // null explícito + limpieza total: ningún observador puede
      // quedarse con la sesión vieja y mostrársela al cliente.
      queryClient.setQueryData(["worker-session"], null);
      queryClient.removeQueries();
      queryClient.clear();
      setWorkerToken(null);
      if (avisar) toast.info("Tu sesión terminó. Ingresa de nuevo.");
      await navigate({ to: "/login", replace: true });
    },
    [queryClient, navigate],
  );

  useEffect(() => {
    const onExpired = () => void logout(true);
    window.addEventListener("session:expired", onExpired);
    return () => window.removeEventListener("session:expired", onExpired);
  }, [logout]);

  const login = useCallback(
    async (usuario: string, password: string) => {
      let res;
      try {
        res = await AuthService.login(usuario, password);
      } catch (e) {
        // 401 = credenciales malas (retorna null); lo demás se propaga
        // para mostrar "sin conexión" en vez de mentir.
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
      setWorkerToken(res.token);
      queryClient.setQueryData(["worker-session"], {
        usuario: res.usuario,
        nombre: res.nombre,
        rol: res.rol,
      });
      await navigate({ to: rutaInicialPorRol(res.rol), replace: true });
      return { usuario: res.usuario, nombre: res.nombre, rol: res.rol };
    },
    [queryClient, navigate],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isLoading: sessionQuery.isLoading,
      isAuthenticated: Boolean(sessionQuery.data),
      login,
      logout,
    }),
    [sessionQuery.data, sessionQuery.isLoading, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext must be used within SessionProvider");
  return ctx;
}
