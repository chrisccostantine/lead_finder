import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, ChevronRight, FileSearch, FileText, LayoutDashboard, LogOut, Menu, MessageSquareText, Search, Settings, Sparkles, X } from 'lucide-react';
import { useAuth } from '../auth/auth-context';

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Lead Finder', path: '/lead-finder', icon: Search },
  { label: 'Leads', path: '/leads', icon: BriefcaseBusiness },
  { label: 'Audits', path: '/audits', icon: FileSearch },
  { label: 'Outreach', path: '/outreach', icon: MessageSquareText },
  { label: 'Proposals', path: '/proposals', icon: FileText },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const current = navigation.find((item) => location.pathname.startsWith(item.path));

  return (
    <div className="min-h-screen bg-canvas text-zinc-100">
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-xl transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-3">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 font-bold">S</div><div><p className="font-semibold">Scalora</p><p className="text-xs text-zinc-500">Growth Engine</p></div></div>
          <button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="mt-6 flex-1 space-y-1" aria-label="Primary navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
              <Icon className="h-[18px] w-[18px]" /><span>{label}</span><ChevronRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-60" />
            </NavLink>
          ))}
        </nav>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-800 text-sm font-semibold">{user?.name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user?.name}</p><p className="truncate text-xs text-zinc-500">{user?.email}</p></div><button title="Log out" aria-label="Log out" onClick={signOut} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"><LogOut className="h-4 w-4" /></button></div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-zinc-800/80 bg-canvas/85 px-5 backdrop-blur-xl sm:px-8">
          <button aria-label="Open navigation" className="mr-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div><p className="text-xs text-zinc-600">Workspace</p><h1 className="font-semibold tracking-tight">{current?.label ?? 'Scalora'}</h1></div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-xs text-violet-300 sm:flex"><Sparkles className="h-3.5 w-3.5" />Internal preview</div>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

