/** Only accept the documented Firebase password recovery action. Never redirect to continueUrl. */
export function resetActionCode(search: string): string | null {
  const params = new URLSearchParams(search);
  if (params.getAll('mode').length !== 1 || params.get('mode') !== 'resetPassword' || params.getAll('oobCode').length !== 1) return null;
  const code = params.get('oobCode');
  return code && code.length <= 4096 && !/\s/.test(code) ? code : null;
}

export function passwordResetError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/expired-action-code': return 'This recovery link has expired. Request a new one.';
    case 'auth/invalid-action-code': return 'This recovery link is invalid or has already been used.';
    case 'auth/weak-password': return 'Choose a stronger password and try again.';
    case 'auth/network-request-failed': return 'Connection failed. Check your connection and try again.';
    case 'auth/user-disabled': return 'This account is unavailable. Contact the ATHLIX team.';
    default: return 'Unable to reset your password. Try again or request a new link.';
  }
}
