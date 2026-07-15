import { Navigate } from 'react-router-dom';
import { AuthForm } from '../components/auth-form';
import { useAuth } from '../auth/auth-context';

export function AuthPage({ mode }: { mode: 'login' | 'setup' }) {
  const { user, isLoading, needsSetup } = useAuth();
  const isSetup = mode === 'setup';

  if (!isLoading && user) return <Navigate to="/dashboard" replace />;
  if (!isLoading && isSetup && needsSetup === false) return <Navigate to="/login" replace />;
  if (!isLoading && !isSetup && needsSetup === true) return <Navigate to="/setup" replace />;

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-canvas lg:grid-cols-[1.05fr_.95fr]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(124,58,237,.16),transparent_32%),radial-gradient(circle_at_80%_75%,rgba(217,70,239,.09),transparent_28%)]" />
      <section className="relative hidden border-r border-zinc-800/80 p-12 lg:flex lg:flex-col lg:justify-between">
        <Brand />
        <div className="max-w-xl pb-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.28em] text-violet-400">Internal growth intelligence</p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white">Turn public signals into focused growth opportunities.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">A secure workspace for Scalora to discover, understand, and qualify the right businesses.</p>
        </div>
        <p className="text-xs text-zinc-600">Scalora Growth Engine · Phase 1</p>
      </section>
      <section className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-12 lg:hidden"><Brand /></div>
          <div className="card p-7 sm:p-9">
            <p className="text-sm font-medium text-violet-400">{isSetup ? 'Initial setup' : 'Secure workspace'}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{isSetup ? 'Create the first admin' : 'Welcome back'}</h2>
            <p className="mb-8 mt-3 text-sm leading-6 text-zinc-500">{isSetup ? 'Registration closes automatically after this account is created.' : 'Sign in to continue to the Growth Engine.'}</p>
            <AuthForm mode={mode} />
          </div>
        </div>
      </section>
    </main>
  );
}

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 font-bold shadow-glow">S</div><span className="text-lg font-semibold tracking-tight">Scalora <span className="text-zinc-500">Growth Engine</span></span></div>;
}

