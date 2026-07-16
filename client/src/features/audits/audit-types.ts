export type AuditStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface AuditIssue { category: 'TECHNICAL' | 'PERFORMANCE' | 'SEO' | 'CONVERSION' | 'MOBILE'; severity: AuditSeverity; title: string; description: string; recommendation: string }
export interface WebsiteAudit {
  id: string; leadId: string; url: string; status: AuditStatus; overallScore: number | null; technicalScore: number | null; performanceScore: number | null; seoScore: number | null; conversionScore: number | null; mobileScore: number | null;
  strengths: string[]; problems: AuditIssue[]; recommendedActions: string[]; rawMetrics: Record<string, unknown>; failureReason: string | null; startedAt: string | null; completedAt: string | null; createdAt: string;
  lead: { id: string; businessName: string; websiteUrl: string | null };
}
export interface AuditListResponse { data: WebsiteAudit[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
