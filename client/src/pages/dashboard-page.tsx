import { ArrowUpRight, Compass, ShieldCheck, Sparkles } from 'lucide-react';

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/50 p-7 shadow-glow sm:p-10">
        <div className="max-w-2xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"><Sparkles className="h-3.5 w-3.5" />Phases 1–4 ready</div><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Turn leads into verified opportunities.</h2><p className="mt-4 max-w-xl leading-7 text-zinc-400">Discover businesses, manage qualified leads, and audit their websites for technical, SEO, conversion, and mobile improvement signals.</p></div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard icon={ShieldCheck} title="Secure access" text="First-admin setup, protected routes, hashed passwords, and token authentication." />
        <InfoCard icon={Compass} title="Focused workflow" text="Every acquisition capability has a clear, dedicated place in the navigation." />
        <InfoCard icon={ArrowUpRight} title="Ready to scale" text="A typed API and modular service layer establish a clean base for later phases." />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <article className="card p-6"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-violet-300"><Icon className="h-5 w-5" /></div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p></article>;
}
