import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AuthService } from "@/services/auth.service";
import { getErrorMessage } from "@/services/api";
import type { RolUi } from "@/types/trabajador";

// Gestión de usuarios (admin) contra el backend real.
export function useUsuarios() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const equipo = useQuery({
    queryKey: ["workers"],
    queryFn: () => AuthService.listWorkers(),
  });

  async function recargar() {
    await queryClient.invalidateQueries({ queryKey: ["workers"] });
  }

  const crear = useMutation({
    mutationFn: (input: { usuario: string; nombre: string; password: string; rol: RolUi }) =>
      AuthService.createWorker(input),
    onSuccess: () => {
      setError(null);
      toast.success("Usuario creado");
      void recargar();
    },
    onError: (e) =>
      setError(getErrorMessage(e, "Revisa los datos: usuario en minúsculas (mín. 3) y contraseña de 4+ caracteres.")),
  });

  const toggle = useMutation({
    mutationFn: (input: { usuario: string; activo: boolean }) =>
      AuthService.setWorkerActivo(input.usuario, input.activo),
    onSuccess: () => {
      setError(null);
      void recargar();
    },
    onError: (e) => {
      const msg = getErrorMessage(e, "No se pudo actualizar.");
      setError(msg);
      toast.error(msg);
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
