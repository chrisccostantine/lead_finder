import { zodResolver } from '@hookform/resolvers/zod';
import React, { type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { getApiError } from '../../lib/api';
import { createLead, updateLead } from './lead-api';
import { LEAD_PRIORITIES, LEAD_STATUSES, labelEnum, type Lead, type LeadFormValues } from './lead-types';

const optionalUrl = z.string().trim().url('Enter a complete URL, including https://').or(z.literal(''));
const optionalEmail = z.string().trim().email('Enter a valid email').or(z.literal(''));
const contactSchema = z.object({ name: z.string().trim().min(2, 'Contact name is required'), jobTitle: z.string(), email: optionalEmail, phone: z.string(), isPrimary: z.boolean(), notes: z.string() });
const formSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required').max(160), industry: z.string().max(120), description: z.string().max(5000),
  websiteUrl: optionalUrl, email: optionalEmail, phone: z.string().max(40), country: z.string().max(100), city: z.string().max(100), address: z.string().max(500),
  googleMapsUrl: optionalUrl, instagramUrl: optionalUrl, facebookUrl: optionalUrl, linkedinUrl: optionalUrl,
  source: z.string().max(100), sourceReference: z.string().max(255), status: z.enum(LEAD_STATUSES), priority: z.enum(LEAD_PRIORITIES), notes: z.string().max(10000), contacts: z.array(contactSchema).max(20),
});

const emptyValues: LeadFormValues = { businessName: '', industry: '', description: '', websiteUrl: '', email: '', phone: '', country: '', city: '', address: '', googleMapsUrl: '', instagramUrl: '', facebookUrl: '', linkedinUrl: '', source: '', sourceReference: '', status: 'NEW', priority: 'MEDIUM', notes: '', contacts: [] };

function valuesFromLead(lead?: Lead): LeadFormValues {
  if (!lead) return emptyValues;
  return {
    businessName: lead.businessName, industry: lead.industry ?? '', description: lead.description ?? '', websiteUrl: lead.websiteUrl ?? '', email: lead.email ?? '', phone: lead.phone ?? '', country: lead.country ?? '', city: lead.city ?? '', address: lead.address ?? '',
    googleMapsUrl: lead.googleMapsUrl ?? '', instagramUrl: lead.instagramUrl ?? '', facebookUrl: lead.facebookUrl ?? '', linkedinUrl: lead.linkedinUrl ?? '', source: lead.source ?? '', sourceReference: lead.sourceReference ?? '', status: lead.status, priority: lead.priority, notes: lead.notes ?? '',
    contacts: lead.contacts.map((contact) => ({ name: contact.name, jobTitle: contact.jobTitle ?? '', email: contact.email ?? '', phone: contact.phone ?? '', isPrimary: contact.isPrimary, notes: contact.notes ?? '' })),
  };
}

interface DuplicateMatch { id: string; businessName: string; reasons: string[]; archivedAt: string | null }

export function LeadForm({ lead }: { lead?: Lead }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [duplicates, setDuplicates] = React.useState<DuplicateMatch[]>([]);
  const form = useForm<LeadFormValues>({ resolver: zodResolver(formSchema), defaultValues: valuesFromLead(lead) });
  const contacts = useFieldArray({ control: form.control, name: 'contacts' });

  const mutation = useMutation({
    mutationFn: ({ values, allowDuplicate }: { values: LeadFormValues; allowDuplicate: boolean }) => lead ? updateLead(lead.id, values) : createLead(values, allowDuplicate),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(lead ? 'Lead updated' : 'Lead created');
      navigate(`/leads/${saved.id}`);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.data?.error?.code === 'DUPLICATE_LEAD') {
        setDuplicates(error.response.data.error.details?.duplicates ?? []);
        return;
      }
      toast.error(getApiError(error));
    },
  });

  const submit = (allowDuplicate = false) => form.handleSubmit((values) => mutation.mutate({ values, allowDuplicate }))();
  const fieldError = (name: keyof LeadFormValues) => (form.formState.errors[name] as { message?: string } | undefined)?.message;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center gap-4"><Link to={lead ? `/leads/${lead.id}` : '/leads'} className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-sm text-violet-400">{lead ? 'Edit lead' : 'New lead'}</p><h2 className="text-2xl font-semibold tracking-tight">{lead ? lead.businessName : 'Add a potential client'}</h2></div></div>

    {duplicates.length > 0 && <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /><div className="flex-1"><h3 className="font-semibold text-amber-200">Potential duplicate detected</h3><p className="mt-1 text-sm text-amber-200/60">Review these matches before continuing.</p><div className="mt-3 space-y-2">{duplicates.map((item) => <Link key={item.id} to={`/leads/${item.id}`} className="block rounded-xl border border-amber-500/15 bg-black/15 p-3 text-sm hover:border-amber-500/30"><span className="font-medium">{item.businessName}</span><span className="ml-2 text-xs text-amber-300/60">Matches: {item.reasons.join(', ')}</span></Link>)}</div>{!lead && <button type="button" onClick={() => submit(true)} className="mt-4 rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10">Create anyway</button>}</div></div></div>}

    <form onSubmit={(event) => { event.preventDefault(); void submit(false); }} className="space-y-6" noValidate>
      <Section title="Business information" description="Core details used to identify and qualify this lead."><div className="grid gap-5 sm:grid-cols-2"><Field label="Business name" required error={fieldError('businessName')}><input className="input" {...form.register('businessName')} /></Field><Field label="Industry" error={fieldError('industry')}><input className="input" placeholder="Hospitality, retail, healthcare…" {...form.register('industry')} /></Field><Field label="Description" wide error={fieldError('description')}><textarea className="input min-h-28 resize-y" {...form.register('description')} /></Field><Field label="Website" error={fieldError('websiteUrl')}><input className="input" type="url" placeholder="https://example.com" {...form.register('websiteUrl')} /></Field><Field label="Email" error={fieldError('email')}><input className="input" type="email" {...form.register('email')} /></Field><Field label="Phone"><input className="input" {...form.register('phone')} /></Field><Field label="Source"><input className="input" placeholder="Referral, directory, event…" {...form.register('source')} /></Field><Field label="Source reference"><input className="input" {...form.register('sourceReference')} /></Field></div></Section>
      <Section title="Location" description="Geographic information for search and segmentation."><div className="grid gap-5 sm:grid-cols-2"><Field label="Country"><input className="input" {...form.register('country')} /></Field><Field label="City"><input className="input" {...form.register('city')} /></Field><Field wide label="Address"><input className="input" {...form.register('address')} /></Field><Field wide label="Google Maps URL" error={fieldError('googleMapsUrl')}><input className="input" type="url" {...form.register('googleMapsUrl')} /></Field></div></Section>
      <Section title="Social presence" description="Only add public business profile URLs."><div className="grid gap-5 sm:grid-cols-2"><Field label="Instagram URL" error={fieldError('instagramUrl')}><input className="input" type="url" {...form.register('instagramUrl')} /></Field><Field label="Facebook URL" error={fieldError('facebookUrl')}><input className="input" type="url" {...form.register('facebookUrl')} /></Field><Field wide label="LinkedIn URL" error={fieldError('linkedinUrl')}><input className="input" type="url" {...form.register('linkedinUrl')} /></Field></div></Section>
      <Section title="Qualification" description="Set the current pipeline state and review priority."><div className="grid gap-5 sm:grid-cols-2"><Field label="Status"><select className="input" {...form.register('status')}>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{labelEnum(status)}</option>)}</select></Field><Field label="Priority"><select className="input" {...form.register('priority')}>{LEAD_PRIORITIES.map((priority) => <option key={priority} value={priority}>{labelEnum(priority)}</option>)}</select></Field><Field wide label="Internal notes" error={fieldError('notes')}><textarea className="input min-h-32 resize-y" {...form.register('notes')} /></Field></div></Section>
      <Section title="Contacts" description="Add business contacts manually; no private data collection is performed."><div className="space-y-4">{contacts.fields.map((contact, index) => <div key={contact.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-medium">Contact {index + 1}</p><button type="button" onClick={() => contacts.remove(index)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Name" required error={form.formState.errors.contacts?.[index]?.name?.message}><input className="input" {...form.register(`contacts.${index}.name`)} /></Field><Field label="Job title"><input className="input" {...form.register(`contacts.${index}.jobTitle`)} /></Field><Field label="Email" error={form.formState.errors.contacts?.[index]?.email?.message}><input className="input" type="email" {...form.register(`contacts.${index}.email`)} /></Field><Field label="Phone"><input className="input" {...form.register(`contacts.${index}.phone`)} /></Field><label className="flex items-center gap-3 text-sm text-zinc-400"><input type="checkbox" className="h-4 w-4 accent-violet-500" {...form.register(`contacts.${index}.isPrimary`)} />Primary contact</label></div></div>)}<button type="button" onClick={() => contacts.append({ name: '', jobTitle: '', email: '', phone: '', isPrimary: contacts.fields.length === 0, notes: '' })} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"><Plus className="h-4 w-4" />Add contact</button></div></Section>
      <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur"><Link to={lead ? `/leads/${lead.id}` : '/leads'} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800">Cancel</Link><button type="submit" disabled={mutation.isPending} className="button-primary">{mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{lead ? 'Save changes' : 'Create lead'}</button></div>
    </form>
  </div>;
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="card p-6 sm:p-8"><div className="mb-6"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-zinc-500">{description}</p></div>{children}</section>;
}

function Field({ label, required, wide, error, children }: { label: string; required?: boolean; wide?: boolean; error?: string; children: ReactNode }) {
  return <label className={`block ${wide ? 'sm:col-span-2' : ''}`}><span className="mb-2 block text-sm text-zinc-400">{label}{required && <span className="text-rose-400"> *</span>}</span>{children}{error && <span className="mt-1.5 block text-xs text-rose-400">{error}</span>}</label>;
}
