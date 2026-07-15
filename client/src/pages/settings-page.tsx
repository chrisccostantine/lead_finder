import { BadgeCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/auth-context';

export function SettingsPage() {
  const { user } = useAuth();
  return <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><section className="card p-6 sm:p-8"><p className="text-sm font-medium text-violet-400">Account</p><h2 className="mt-1 text-2xl font-semibold">Profile details</h2><div className="mt-8 grid gap-5 sm:grid-cols-2"><ReadOnlyField label="Name" value={user?.name ?? ''} /><ReadOnlyField label="Role" value={user?.role ?? ''} /><div className="sm:col-span-2"><ReadOnlyField label="Email" value={user?.email ?? ''} /></div></div><p className="mt-6 text-xs leading-5 text-zinc-600">Profile editing is intentionally not part of the Phase 1 scope.</p></section><aside className="card p-6"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400"><BadgeCheck className="h-5 w-5" /></div><h3 className="mt-5 font-semibold">Admin access active</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Public registration is disabled after the initial account is created.</p><div className="mt-6 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500"><KeyRound className="h-4 w-4 text-violet-400" />Protected by JWT authentication</div></aside></div>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="block"><span className="mb-2 block text-sm text-zinc-400">{label}</span><input className="input text-zinc-400" value={value} readOnly /></label>;
}

