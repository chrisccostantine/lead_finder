import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { LeadForm } from '../features/leads/lead-form';
import { fetchLead } from '../features/leads/lead-api';
import { getApiError } from '../lib/api';

export function LeadEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['lead', id], queryFn: () => fetchLead(id!), enabled: mode === 'edit' && Boolean(id) });
  if (mode === 'create') return <LeadForm />;
  if (!id) return <Navigate to="/leads" replace />;
  if (query.isLoading) return <div className="grid min-h-[500px] place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-violet-400" /></div>;
  if (query.isError) return <div className="card p-8 text-center"><p className="font-medium text-rose-300">Could not load this lead</p><p className="mt-2 text-sm text-zinc-600">{getApiError(query.error)}</p></div>;
  return <LeadForm lead={query.data} />;
}
