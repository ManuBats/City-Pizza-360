import { useState } from "react";
import { useUsuarios } from "@/hooks/use-usuarios";
import type { Rol } from "@/components/worker/worker-auth";

// Formulario de alta (extraído de app/(interno)/admin/usuarios/page.tsx).
// Se apoya en useUsuarios para crear y recargar el equipo.
export function useUsuarioForm() {
  const usuarios = useUsuarios();
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("cajero");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    usuarios.setError(null);
    usuarios.crear({ usuario, nombre, password, rol });
    setUsuario("");
    setNombre("");
    setPassword("");
    setRol("cajero");
  }

  return {
    ...usuarios,
    usuario, setUsuario: (v: string) => setUsuario(v.toLowerCase()),
    nombre, setNombre,
    password, setPassword,
    rol, setRol,
    onSubmit,
  };
}
