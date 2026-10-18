export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[\s()-]/g, "");
  if (/^07\d{8}$/.test(digits)) return "+254" + digits.slice(1);
  if (/^01\d{8}$/.test(digits)) return "+254" + digits.slice(1);
  if (/^\+254[17]\d{8}$/.test(digits)) return digits;
  return null;
}
