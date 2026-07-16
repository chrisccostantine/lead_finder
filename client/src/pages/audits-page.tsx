import { useQuery } from '@tanstack/react-query';
import { FileSearch, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAudits } from '../features/audits/audit-api';
import { AuditStatusBadge } from '../features/audits/audit-status';
import { getApiError } from '../lib/api';

export function AuditsPage() {
  const query = useQuery({ queryKey: ['audits'], queryFn: () => fetchAudits(), refetchInterval: (state) => state.state.data?.data.some((audit) => ['PENDING', 'RUNNING'].includes(audit.status)) ? 2500 : false });
  return <div className="space-y-6"><div><p className="text-sm font-medium text-violet-400">Website intelligence</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">Audits</h2><p className="mt-2 text-sm text-zinc-500">Review website health and turn verified findings into clear improvement opportunities.</p></div>
    {query.isLoading ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-violet-400" /></div> : query.isError ? <div className="card p-8 text-center text-rose-300">{getApiError(query.error)}</div> : query.data?.data.length ? <section className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-zinc-950/50 text-[11px] uppercase text-zinc-600"><tr><th className="p-4">Lead</th><th className="p-4">Status</th><th className="p-4">Overall</th><th className="p-4">Website</th><th className="p-4">Created</th></tr></thead><tbody className="divide-y divide-zinc-800">{query.data.data.map((audit) => <tr key={audit.id} className="hover:bg-zinc-900/50"><td className="p-4"><Link to={`/audits/${audit.id}`} className="font-medium hover:text-violet-300">{audit.lead.businessName}</Link></td><td className="p-4"><AuditStatusBadge status={audit.status} /></td><td className="p-4 text-sm">{audit.overallScore == null ? '—' : `${audit.overallScore}/100`}</td><td className="max-w-xs truncate p-4 text-sm text-zinc-500">{audit.url}</td><td className="p-4 text-sm text-zinc-500">{new Date(audit.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div></section> : <div className="card grid min-h-80 place-items-center p-8 text-center"><div><FileSearch className="mx-auto h-9 w-9 text-zinc-700" /><h3 className="mt-4 font-medium">No audits yet</h3><p className="mt-2 text-sm text-zinc-600">Open a lead with a website and start its first audit.</p><Link to="/leads" className="mt-5 inline-block text-sm text-violet-400">Browse leads</Link></div></div>}
  </div>;
}
