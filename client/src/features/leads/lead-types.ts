export const LEAD_STATUSES = ['NEW', 'REVIEWED', 'QUALIFIED', 'NOT_QUALIFIED', 'READY_FOR_OUTREACH', 'CONTACTED', 'REPLIED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const;
export const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadPriority = typeof LEAD_PRIORITIES[number];

export interface LeadContact {
  id: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
}

export interface LeadStatusHistory {
  id: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  createdAt: string;
  user: { id: string; name: string };
}

export interface Lead {
  id: string;
  businessName: string;
  industry: string | null;
  description: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  source: string | null;
  sourceReference: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: LeadContact[];
  statusHistory?: LeadStatusHistory[];
  _count?: { statusHistory: number };
}

export interface LeadListResponse {
  data: Lead[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface LeadFormValues {
  businessName: string;
  industry: string;
  description: string;
  websiteUrl: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  source: string;
  sourceReference: string;
  status: LeadStatus;
  priority: LeadPriority;
  notes: string;
  contacts: Array<{ name: string; jobTitle: string; email: string; phone: string; isPrimary: boolean; notes: string }>;
}

export function labelEnum(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
