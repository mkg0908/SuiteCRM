export type Role = 'agent' | 'manager';

export function maskPhone(phone: string, role: Role): string {
  if (role === 'manager') return phone;
  return phone.replace(/(\d{3}[-.]?\d{3})[-.]?(\d{4})/, '$1-••••');
}

export function maskEmail(email: string, role: Role): string {
  if (role === 'manager') return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}•••@${domain}`;
}

export function maskContactFields<
  T extends { customerEmail?: string | null; customerPhone?: string | null },
>(record: T, role: Role): T {
  const result = { ...record };
  if (result.customerEmail) {
    result.customerEmail = maskEmail(result.customerEmail, role);
  }
  if (result.customerPhone) {
    result.customerPhone = maskPhone(result.customerPhone, role);
  }
  return result;
}
