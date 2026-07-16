import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getApiError } from '../lib/api';

interface ImportReport { totalRows: number; validRows: number; importedRows: number; invalidRows: Array<{ row: number; errors: Record<string, string[] | undefined> }>; duplicateRows: Array<{ row: number; businessName: string; matches: Array<{ businessName: string; reasons: string[]; sourceRow?: number }> }> }

export function LeadImportPage() {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: async (dryRun: boolean) => (await api.post<ImportReport>('/leads/import', { csv, dryRun, skipDuplicates: true })).data,
    onSuccess: async (result, dryRun) => {
      setReport(result);
      if (!dryRun) { await queryClient.invalidateQueries({ queryKey: ['leads'] }); toast.success(`${result.importedRows} leads imported`); navigate('/leads'); }
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const selectFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) { toast.error('Choose a CSV file.'); return; }
    if (file.size > 2_000_000) { toast.error('CSV files must be smaller than 2 MB.'); return; }
    setCsv(await file.text()); setFileName(file.name); setReport(null);
  };

  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex items-center gap-4"><Link to="/leads" className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 hover:bg-zinc-900"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-sm text-violet-400">Bulk import</p><h2 className="text-2xl font-semibold tracking-tight">Import leads from CSV</h2></div></div>
    <section className="card p-6 sm:p-8"><div className="grid gap-7 lg:grid-cols-[1fr_320px]"><div><button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }} className="grid min-h-64 w-full place-items-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/40 p-8 text-center transition hover:border-violet-500/50"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><FileSpreadsheet className="h-6 w-6" /></div><p className="mt-5 font-medium">{fileName || 'Choose or drop a CSV file'}</p><p className="mt-2 text-sm text-zinc-600">Maximum 500 rows and 2 MB</p></div></button><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void selectFile(event.target.files?.[0])} /><button disabled={!csv || mutation.isPending} onClick={() => mutation.mutate(true)} className="button-primary mt-4 w-full">{mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Review import</button></div><aside><h3 className="font-semibold">Supported columns</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Only <code className="text-violet-300">businessName</code> is required. Header matching ignores spaces and underscores.</p><div className="mt-4 flex flex-wrap gap-2">{['businessName', 'industry', 'websiteUrl', 'email', 'phone', 'country', 'city', 'address', 'status', 'priority', 'source', 'notes'].map((column) => <code key={column} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-500">{column}</code>)}</div><a className="mt-5 block text-xs text-violet-400" href={'data:text/csv;charset=utf-8,' + encodeURIComponent('businessName,industry,websiteUrl,email,phone,country,city,source,notes\nSample Business,Retail,https://example.com,hello@example.com,+961 1 234 567,Lebanon,Beirut,Manual import,Safe sample data')} download="scalora-leads-template.csv">Download CSV template</a></aside></div></section>
    {report && <section className="card overflow-hidden"><div className="grid grid-cols-2 gap-px bg-zinc-800 sm:grid-cols-4"><Metric label="Total rows" value={report.totalRows} /><Metric label="Ready" value={report.validRows} tone="good" /><Metric label="Duplicates" value={report.duplicateRows.length} tone="warn" /><Metric label="Invalid" value={report.invalidRows.length} tone="bad" /></div>{report.duplicateRows.length > 0 && <ReportGroup title="Duplicate rows" icon={AlertTriangle} tone="text-amber-400"><div className="space-y-2">{report.duplicateRows.map((row) => <div key={row.row} className="rounded-xl border border-zinc-800 p-3 text-sm"><span className="font-medium">Row {row.row}: {row.businessName}</span><p className="mt-1 text-xs text-zinc-600">Matches {row.matches.map((match) => `${match.businessName} (${match.reasons.join(', ')})`).join('; ')}</p></div>)}</div></ReportGroup>}{report.invalidRows.length > 0 && <ReportGroup title="Invalid rows" icon={AlertTriangle} tone="text-rose-400"><div className="space-y-2">{report.invalidRows.map((row) => <div key={row.row} className="rounded-xl border border-zinc-800 p-3 text-sm"><span className="font-medium">Row {row.row}</span><p className="mt-1 text-xs text-zinc-600">{Object.entries(row.errors).flatMap(([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`)).join(' · ')}</p></div>)}</div></ReportGroup>}<div className="flex flex-col gap-3 border-t border-zinc-800 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-sm text-zinc-500"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Invalid and duplicate rows will be skipped.</div><button disabled={!report.validRows || mutation.isPending} onClick={() => mutation.mutate(false)} className="button-primary sm:ml-auto">{mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}Import {report.validRows} valid leads</button></div></section>}
  </div>;
}

function Metric({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'good' | 'warn' | 'bad' }) { const color = { normal: 'text-white', good: 'text-emerald-300', warn: 'text-amber-300', bad: 'text-rose-300' }[tone]; return <div className="bg-zinc-900 p-5"><p className={`text-2xl font-semibold ${color}`}>{value}</p><p className="mt-1 text-xs text-zinc-600">{label}</p></div>; }
function ReportGroup({ title, icon: Icon, tone, children }: { title: string; icon: typeof AlertTriangle; tone: string; children: ReactNode }) { return <div className="border-t border-zinc-800 p-5"><h3 className={`mb-4 flex items-center gap-2 text-sm font-semibold ${tone}`}><Icon className="h-4 w-4" />{title}</h3>{children}</div>; }
