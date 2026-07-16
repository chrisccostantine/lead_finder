import { api } from '../../lib/api';
import type { Lead, LeadFormValues, LeadListResponse } from './lead-types';

export async function fetchLeads(params: Record<string, string | number | boolean | undefined>) {
  const { data } = await api.get<LeadListResponse>('/leads', { params });
  return data;
}

export async function fetchLead(id: string) {
  const { data } = await api.get<{ lead: Lead }>(`/leads/${id}`);
  return data.lead;
}

export async function createLead(values: LeadFormValues, allowDuplicate = false) {
  const { data } = await api.post<{ lead: Lead }>('/leads', { ...values, allowDuplicate });
  return data.lead;
}

export async function updateLead(id: string, values: Partial<LeadFormValues>) {
  const { data } = await api.patch<{ lead: Lead }>(`/leads/${id}`, values);
  return data.lead;
}

export async function archiveLead(id: string) {
  const { data } = await api.post<{ lead: Lead }>(`/leads/${id}/archive`);
  return data.lead;
}
