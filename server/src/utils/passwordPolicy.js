export function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length === 0) {
    return { ok: false, message: 'Password is required' };
  }
  // Minimum bar: 8 chars + at least one digit. Aligned with the seeded demo
  // accounts (e.g. "admin123") so admin-created users use the same rules
  // people are actually signing in with.
  const checks = [];
  if (pw.length < 8) checks.push('at least 8 characters');
  if (!/[0-9]/.test(pw)) checks.push('a digit');

  if (checks.length === 0) return { ok: true };

  const last = checks.length > 1 ? ` and ${checks.pop()}` : '';
  const rest = checks.length ? checks.join(', ') : '';
  const requirement = `${rest}${last}`.trim();
  return { ok: false, message: `Password must contain ${requirement}.` };
}

export default validatePassword;
