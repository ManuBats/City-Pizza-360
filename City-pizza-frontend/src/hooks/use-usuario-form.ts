import { useState } from "react";
import { useUsuarios } from "@/hooks/use-usuarios";
import type { Rol } from "@/components/worker/worker-auth";
import { passwordValidationError } from "@/lib/password-policy";

// Formulario de alta (extraído de app/(interno)/admin/usuarios/page.tsx).
// Se apoya en useUsuarios para crear y recargar el equipo.
export function useUsuarioForm() {
  const usuarios = useUsuarios();
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("cajero");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (usuarios.creando) return;
    usuarios.setError(null);
    const validationError = passwordValidationError(password);
    setPasswordError(validationError);
    if (validationError) return;
    try {
      await usuarios.crear({ usuario, nombre, password, rol });
    } catch {
      // useUsuarios muestra el error; conservar los datos para corregirlos.
      return;
    }
    setUsuario("");
    setNombre("");
    setPassword("");
    setRol("cajero");
    setMostrarPassword(false);
  }

  return {
    ...usuarios,
    usuario,
    setUsuario: (v: string) => setUsuario(v.toLowerCase()),
    nombre,
    setNombre,
    password,
    setPassword: (value: string) => {
      setPassword(value);
      setPasswordError(null);
    },
    passwordError,
    mostrarPassword,
    toggleMostrarPassword: () => setMostrarPassword((value) => !value),
    rol,
    setRol,
    onSubmit,
  };
}
