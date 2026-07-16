import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '../auth/auth-context';
import { api, getApiError } from '../lib/api';
import type { AuthResponse } from '../lib/types';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;
type AuthInput = LoginInput & { name?: string };

export function AuthForm({ mode }: { mode: 'login' | 'setup' }) {
  const isSetup = mode === 'setup';
  const schema = z.object({
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(isSetup ? 10 : 1, isSetup ? 'Use at least 10 characters' : 'Password is required').max(128),
    name: isSetup ? z.string().trim().min(2, 'Name must be at least 2 characters').max(80) : z.string().optional(),
  });
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const form = useForm<AuthInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', ...(isSetup ? { name: '' } : {}) },
  });

  const mutation = useMutation({
    mutationFn: async (values: AuthInput) => {
      const endpoint = isSetup ? '/auth/register' : '/auth/login';
      const { data } = await api.post<AuthResponse>(endpoint, values);
      return data;
    },
    onSuccess: (data) => {
      signIn(data);
      toast.success(isSetup ? 'Admin account created' : 'Welcome back');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
      {isSetup && (
        <Field icon={UserRound} label="Full name" error={form.formState.errors.name?.message}>
          <input className="input pl-11" autoComplete="name" placeholder="Alex Morgan" {...form.register('name')} />
        </Field>
      )}
      <Field icon={Mail} label="Email" error={form.formState.errors.email?.message}>
        <input className="input pl-11" type="email" autoComplete="email" placeholder="you@scalora.com" {...form.register('email')} />
      </Field>
      <Field icon={LockKeyhole} label="Password" error={form.formState.errors.password?.message}>
        <input className="input pl-11" type="password" autoComplete={isSetup ? 'new-password' : 'current-password'} placeholder={isSetup ? 'At least 10 characters' : 'Your password'} {...form.register('password')} />
      </Field>
      <button className="button-primary w-full" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {isSetup ? 'Create admin account' : 'Sign in'}
      </button>
    </form>
  );
}

function Field({ icon: Icon, label, error, children }: { icon: typeof Mail; label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <span className="relative block"><Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />{children}</span>
      {error && <span className="block text-xs text-rose-400">{error}</span>}
    </label>
  );
}
