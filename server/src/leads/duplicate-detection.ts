export interface DuplicateCandidate {
  businessName: string;
  websiteUrl?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface DuplicateKeys {
  businessNameKey: string;
  websiteKey: string | null;
  emailKey: string | null;
  phoneKey: string | null;
}

export function normalizeBusinessName(value: string): string {
  const normalized = value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return normalized || value.trim().toLowerCase();
}

export function normalizeWebsite(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function normalizeEmail(value?: string | null): string | null {
  return value?.trim().toLowerCase() || null;
}

export function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits || null;
}

export function duplicateKeys(candidate: DuplicateCandidate): DuplicateKeys {
  return {
    businessNameKey: normalizeBusinessName(candidate.businessName),
    websiteKey: normalizeWebsite(candidate.websiteUrl),
    emailKey: normalizeEmail(candidate.email),
    phoneKey: normalizePhone(candidate.phone),
  };
}

export function matchingReasons(left: DuplicateKeys, right: DuplicateKeys): string[] {
  const reasons: string[] = [];
  if (left.websiteKey && left.websiteKey === right.websiteKey) reasons.push('website');
  if (left.emailKey && left.emailKey === right.emailKey) reasons.push('email');
  if (left.phoneKey && left.phoneKey === right.phoneKey) reasons.push('phone');
  if (left.businessNameKey === right.businessNameKey) reasons.push('businessName');
  return reasons;
}
