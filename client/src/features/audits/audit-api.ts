import { api } from '../../lib/api';
import type { AuditListResponse, WebsiteAudit } from './audit-types';

export async function fetchAudits(params: { leadId?: string; status?: string; page?: number; pageSize?: number } = {}) { return (await api.get<AuditListResponse>('/audits', { params })).data; }
export async function fetchAudit(id: string) { return (await api.get<{ audit: WebsiteAudit }>(`/audits/${id}`)).data.audit; }
export async function startAudit(leadId: string) { return (await api.post<{ audit: WebsiteAudit }>(`/audits/leads/${leadId}`)).data.audit; }
export async function rerunAudit(id: string) { return (await api.post<{ audit: WebsiteAudit }>(`/audits/${id}/rerun`)).data.audit; }
