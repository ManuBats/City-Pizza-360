import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function passwordValidationError(value: unknown): string | null {
  if (typeof value !== 'string') return 'La contraseña debe ser un texto.';
  if (/^\s*$/u.test(value))
    return 'La contraseña no puede contener únicamente espacios.';
  if (Array.from(value).length < 12)
    return 'La contraseña debe tener al menos 12 caracteres.';
  if (Buffer.byteLength(value, 'utf8') > 72)
    return 'La contraseña es demasiado larga: el máximo es 72 bytes UTF-8. Las tildes y los emojis pueden ocupar varios bytes.';
  return null;
}

@ValidatorConstraint({ name: 'passwordPolicy', async: false })
export class PasswordPolicy implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return passwordValidationError(value) === null;
  }
  defaultMessage(args: { value: unknown }): string {
    return passwordValidationError(args.value) ?? 'Contraseña inválida.';
  }
}
