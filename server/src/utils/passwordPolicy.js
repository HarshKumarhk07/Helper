export function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length === 0) {
    return { ok: false, message: 'Password is required' };
  }
  const checks = [];
  if (pw.length < 8) checks.push('at least 8 characters');
  if (!/[A-Z]/.test(pw)) checks.push('an uppercase letter');
  if (!/[0-9]/.test(pw)) checks.push('a digit');
  // You can add more rules here if needed (special chars, lower-case already implied)

  if (checks.length === 0) return { ok: true };

  const last = checks.length > 1 ? ` and ${checks.pop()}` : '';
  const rest = checks.length ? checks.join(', ') : '';
  const requirement = `${rest}${last}`.trim();
  return { ok: false, message: `Password must contain ${requirement}.` };
}

export default validatePassword;
