import type { LeadPriority, LeadStatus } from './lead-types';
import { labelEnum } from './lead-types';

const statusStyles: Record<LeadStatus, string> = {
  NEW: 'border-sky-500/20 bg-sky-500/10 text-sky-300', REVIEWED: 'border-zinc-600 bg-zinc-800 text-zinc-300',
  QUALIFIED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300', NOT_QUALIFIED: 'border-zinc-700 bg-zinc-800/50 text-zinc-500',
  READY_FOR_OUTREACH: 'border-violet-500/20 bg-violet-500/10 text-violet-300', CONTACTED: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  REPLIED: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300', MEETING_BOOKED: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300',
  PROPOSAL_SENT: 'border-amber-500/20 bg-amber-500/10 text-amber-300', WON: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300', LOST: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
};

const priorityStyles: Record<LeadPriority, string> = {
  LOW: 'text-zinc-500', MEDIUM: 'text-sky-400', HIGH: 'text-amber-400', URGENT: 'text-rose-400',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>{labelEnum(status)}</span>;
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return <span className={`text-xs font-semibold ${priorityStyles[priority]}`}>{labelEnum(priority)}</span>;
}
