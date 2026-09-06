/** Map Firebase / API failures to a short Spanish line the owner can act on. */
export function authErrorMessage(err: unknown, fallback: string): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : err instanceof Error
        ? err.message
        : ''

  switch (code) {
    case 'auth/invalid-email':
    case 'invalid_email':
      return 'Ese correo no es válido.'
    case 'auth/too-many-requests':
    case 'too_many':
      return 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
    case 'auth/network-request-failed':
      return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'
    case 'auth/expired-action-code':
      return 'Ese enlace ya venció. Pide uno nuevo.'
    case 'auth/invalid-action-code':
      return 'Ese enlace no es válido o ya se usó. Pide uno nuevo.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/user-disabled':
      return 'Esta cuenta está desactivada.'
    case 'No disponible sin conexión al servidor':
      return 'No hay conexión con el servidor para comprobar este enlace. Pide uno nuevo en un momento.'
    default:
      return fallback
  }
}
