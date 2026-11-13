/** Contar puntos de código y bytes UTF-8 igual que el DTO de creación. */
export function passwordValidationError(value: unknown): string | null {
  if (typeof value !== "string") return "La contraseña debe ser un texto.";
  if (/^\s*$/u.test(value))
    return "La contraseña no puede contener únicamente espacios.";
  if (Array.from(value).length < 12)
    return "La contraseña debe tener al menos 12 caracteres.";
  if (new TextEncoder().encode(value).length > 72)
    return "La contraseña es demasiado larga: el máximo es 72 bytes UTF-8. Las tildes y los emojis pueden ocupar varios bytes.";
  return null;
}
