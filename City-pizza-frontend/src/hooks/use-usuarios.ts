import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createWorker, listWorkers, setWorkerActivo } from "@/lib/auth";
import { getErrorMessage } from "@/services/api";
import type { Rol } from "@/components/worker/worker-auth";

// Gestión de usuarios (admin) extraída de routes/admin-usuarios.tsx.
// Lee del mock local lib/auth.ts.
// TODO(Fase B): reemplazar por AuthService.listWorkers/createWorker/setWorkerActivo.
export function useUsuarios() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const equipo = useQuery({
    queryKey: ["workers"],
    queryFn: () => listWorkers(),
  });

  async function recargar() {
    await queryClient.invalidateQueries({ queryKey: ["workers"] });
  }

  const crear = useMutation({
    mutationFn: (input: { usuario: string; nombre: string; password: string; rol: Rol }) =>
      createWorker(input),
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error ?? "No se pudo crear el usuario.");
        return;
      }
      setError(null);
      toast.success("Usuario creado");
      void recargar();
    },
    onError: (e) =>
      setError(getErrorMessage(e, "Revisa los datos: usuario en minúsculas (mín. 3) y contraseña de 4+ caracteres.")),
  });

  const toggle = useMutation({
    mutationFn: (input: { usuario: string; activo: boolean }) =>
      setWorkerActivo(input.usuario, input.activo),
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error ?? "No se pudo actualizar.");
        toast.error(res.error ?? "No se pudo actualizar.");
      } else {
        setError(null);
      }
      void recargar();
    },
    onError: (e) => {
      setError(getErrorMessage(e, "No se pudo actualizar."));
    },
  });

  return {
    workers: equipo.data ?? [],
    cargando: equipo.isLoading,
    error, setError,
    crear: crear.mutate, creando: crear.isPending,
    toggle: toggle.mutate, alternando: toggle.isPending,
  };
}
