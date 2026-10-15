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
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/** Estado global de sesión contra el backend real (equivale a CCA). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sessionQuery = useQuery({
    queryKey: ["worker-session"],
    queryFn: async () => {
      try {
        return await AuthService.me();
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    retry: false,
  });

  const logout = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    setWorkerToken(null);
    await navigate({ to: "/login", replace: true });
  }, [queryClient, navigate]);

  useEffect(() => {
    window.addEventListener("session:expired", logout);
    return () => window.removeEventListener("session:expired", logout);
  }, [logout]);

  const login = useCallback(
    async (usuario: string, password: string) => {
      let res;
      try {
        res = await AuthService.login(usuario, password);
      } catch {
        return null;
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
