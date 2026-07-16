import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, XCircle } from 'lucide-react';
import type { AuditStatus } from './audit-types';

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  const style = { PENDING: 'text-amber-300 bg-amber-500/10', RUNNING: 'text-violet-300 bg-violet-500/10', COMPLETED: 'text-emerald-300 bg-emerald-500/10', FAILED: 'text-rose-300 bg-rose-500/10' }[status];
  const Icon = { PENDING: Clock3, RUNNING: LoaderCircle, COMPLETED: CheckCircle2, FAILED: XCircle }[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${style}`}><Icon className={`h-3.5 w-3.5 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />{status.toLowerCase()}</span>;
}

export function AuditFailure({ reason }: { reason: string | null }) { return <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200"><AlertTriangle className="h-5 w-5 shrink-0" /><div><p className="font-medium">Audit could not be completed</p><p className="mt-1 text-rose-300/70">{reason || 'The website could not be analyzed.'}</p></div></div>; }
