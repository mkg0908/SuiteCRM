/**
 * CaseFlow Privacy Mapper - role-based phone/email masking
 */

export type UserRole = 'agent' | 'manager';

/** Mask email: p•••@riverahotels.com */
export function maskEmail(email: string): string {
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return '•••@•••';
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  const visible = local.charAt(0);
  return `${visible}${'•'.repeat(3)}${domain}`;
}

/** Mask phone: 415-555-•••• */
export function maskPhone(phone: string): string {
  // Keep area code and exchange, mask last 4 digits
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    const area = phone.slice(0, phone.indexOf(cleaned.slice(3, 6)));
    // Simple approach: replace last 4 digits with bullets
    return phone.replace(/\d{4}$/, '••••');
  }
  return '•'.repeat(phone.length);
}

export interface ContactFields {
  customerEmail?: string | null;
  customerPhone?: string | null;
}

/** Apply role-based masking to contact fields */
export function applyContactMasking<T extends ContactFields>(
  data: T,
  role: UserRole,
): T & { customerEmail?: string | null; customerPhone?: string | null } {
  if (role === 'manager') {
    return data;
  }
  // Agent role: mask contacts
  return {
    ...data,
    customerEmail: data.customerEmail ? maskEmail(data.customerEmail) : data.customerEmail,
    customerPhone: data.customerPhone ? maskPhone(data.customerPhone) : data.customerPhone,
  };
}

/** Apply masking to an array of records */
export function maskContactsForRole<T extends ContactFields>(items: T[], role: UserRole): T[] {
  return items.map((item) => applyContactMasking(item, role));
}

export interface AgentContactFields {
  email?: string | null;
  phone?: string | null;
}

/** Apply role-based masking to agent/staff contact fields */
export function maskAgentContact<T extends AgentContactFields>(agent: T, role: UserRole): T {
  if (role === 'manager') return agent;
  return {
    ...agent,
    email: agent.email ? maskEmail(agent.email) : agent.email,
    phone: agent.phone ? maskPhone(agent.phone) : agent.phone,
  };
}
