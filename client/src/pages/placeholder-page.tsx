import type { LucideIcon } from 'lucide-react';

export function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <div className="card grid min-h-[480px] place-items-center p-8 text-center"><div className="max-w-md"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-zinc-700 bg-zinc-800/70 text-violet-300"><Icon className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-3 leading-7 text-zinc-500">{description}</p><span className="mt-6 inline-block rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-600">Planned for a later phase</span></div></div>;
}

