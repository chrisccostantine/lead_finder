import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSearch, LoaderCircle, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getApiError } from '../../lib/api';
import { fetchAudits, startAudit } from './audit-api';
import { AuditStatusBadge } from './audit-status';

export function LeadAuditPanel({ leadId, websiteUrl }: { leadId: string; websiteUrl: string | null }) {
  const navigate = useNavigate(); const qc = useQueryClient();
  const query = useQuery({ queryKey: ['audits', { leadId }], queryFn: () => fetchAudits({ leadId, pageSize: 5 }), refetchInterval: (state) => state.state.data?.data.some((audit) => audit.status === 'PENDING' || audit.status === 'RUNNING') ? 2000 : false });
  const mutation = useMutation({ mutationFn: () => startAudit(leadId), onSuccess: async (audit) => { await qc.invalidateQueries({ queryKey: ['audits'] }); toast.success('Website audit queued'); navigate(`/audits/${audit.id}`); }, onError: (error) => toast.error(getApiError(error)) });
  return <section className="card p-5 md:col-span-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><FileSearch className="h-5 w-5 text-violet-400" /><div><h3 className="text-sm font-medium">Website audit history</h3><p className="text-xs text-zinc-600">Safe technical, SEO, conversion, and mobile checks</p></div></div><button onClick={() => mutation.mutate()} disabled={!websiteUrl || mutation.isPending} className="button-primary py-2.5 sm:ml-auto">{mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{websiteUrl ? 'Start audit' : 'Add website first'}</button></div>
    {query.isError && <p className="mt-4 text-sm text-rose-300">{getApiError(query.error)}</p>}
    {query.data?.data.length ? <div className="mt-4 divide-y divide-zinc-800">{query.data.data.map((audit) => <Link key={audit.id} to={`/audits/${audit.id}`} className="flex items-center gap-3 py-3 text-sm hover:text-violet-300"><AuditStatusBadge status={audit.status} /><span>{new Date(audit.createdAt).toLocaleString()}</span><span className="ml-auto text-zinc-500">{audit.overallScore == null ? '—' : `${audit.overallScore}/100`}</span></Link>)}</div> : !query.isLoading && <p className="mt-4 text-sm text-zinc-600">No website audits yet.</p>}
  </section>;
}
