'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MessageCircle,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LineChart,
  Users,
  UploadCloud,
  Bot,
  BarChart3,
  ArrowUpRight,
  Lock,
  Clock,
} from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
}

interface PillBadgeProps {
  label: string;
}

interface Metric {
  label: string;
  value: string;
  helper: string;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
}

interface Step {
  id: number;
  title: string;
  description: string;
}

const metrics: Metric[] = [
  {
    label: 'Compliance time saved',
    value: '40–60%',
    helper: 'Per CA team on recurring work',
  },
  {
    label: 'Turnaround for queries',
    value: '< 3 min',
    helper: 'Average AI answer time',
  },
  {
    label: 'Citizen-friendly flows',
    value: '100%',
    helper: 'No finance jargon in wizards',
  },
];

const caFeatures: Feature[] = [
  {
    title: 'Compliance cockpit for every client',
    description:
      'See ITR, GST, TDS and ROC due dates in one view, with risk-weighted tags, filters and calendar sync for your entire portfolio.',
    icon: <BarChart3 className="h-6 w-6" />,
    tag: 'For CAs',
  },
  {
    title: 'AI that understands Indian tax law',
    description:
      'Ask case-style questions (“Proprietorship converted to LLP mid-year…”) and get structured answers with sections, slabs and citations.',
    icon: <MessageCircle className="h-6 w-6" />,
    tag: 'Reasoning-first',
  },
  {
    title: 'Document-aware reconciliation',
    description:
      'Upload ledgers, bank statements and GST returns. OCR + extraction prepares reconciled views that you can review and finalize.',
    icon: <FileText className="h-6 w-6" />,
    tag: 'OCR-native',
  },
];

const citizenFeatures: Feature[] = [
  {
    title: 'Guided tax-saving wizard',
    description:
      'Simple “Yes/No” and multiple-choice steps to discover the right mix of 80C, 80D, NPS and home loan benefits without form chaos.',
    icon: <Sparkles className="h-6 w-6" />,
    tag: 'For citizens',
  },
  {
    title: 'Plain-language explanations',
    description:
      'Every recommendation is explained in clean, jargon-free language you can share with your family or CA.',
    icon: <Users className="h-6 w-6" />,
    tag: 'Human readable',
  },
  {
    title: 'Exportable summary',
    description:
      'Generate a neat summary with action items you can email to your CA or keep as a checklist for the financial year.',
    icon: <CheckCircle2 className="h-6 w-6" />,
    tag: 'Share ready',
  },
];

const steps: Step[] = [
  {
    id: 1,
    title: 'Upload or connect data',
    description:
      'Upload PDFs, images or spreadsheets, or connect accounting tools. The system standardizes and indexes everything securely.',
  },
  {
    id: 2,
    title: 'AI reads like a senior CA',
    description:
      'OCR + tax-aware models extract entities, periods and sections. The AI assistant becomes context-aware for each client or citizen.',
  },
  {
    id: 3,
    title: 'Decide, file, and stay ahead',
    description:
      'Use dashboards, structured answers and guided flows to complete filings, optimize tax saving and never miss a deadline again.',
  },
];

const ButtonLink: React.FC<ButtonLinkProps> = ({ href, children, variant = 'primary' }) => {
  let baseClasses =
    'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
  let variantClasses: string;

  if (variant === 'primary') {
    variantClasses =
      'bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:ring-emerald-400';
  } else if (variant === 'secondary') {
    variantClasses =
      'bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-600 border border-slate-700';
  } else {
    variantClasses =
      'bg-transparent text-slate-100 hover:bg-slate-900/40 focus-visible:ring-slate-700 border border-slate-800';
  }

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses}`}>
      {children}
    </Link>
  );
};

const PillBadge: React.FC<PillBadgeProps> = ({ label }) => (
  <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
    {label}
  </span>
);

const MetricCard: React.FC<Metric> = ({ label, value, helper }) => (
  <div className="flex flex-col gap-1 rounded-2xl bg-slate-900/40 px-4 py-3 shadow-sm ring-1 ring-white/5">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="text-xl font-semibold text-slate-50">{value}</span>
    <span className="text-xs text-slate-400">{helper}</span>
  </div>
);

const FeatureCard: React.FC<Feature> = ({ title, description, icon, tag }) => (
  <div className="group flex h-full flex-col rounded-2xl bg-slate-900/40 p-5 shadow-sm ring-1 ring-slate-800/80 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/70 hover:ring-emerald-500/60">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
        {icon}
      </div>
      {tag ? (
        <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300">
          {tag}
        </span>
      ) : null}
    </div>
    <h3 className="mb-2 text-sm font-semibold text-slate-50">{title}</h3>
    <p className="text-sm text-slate-400">{description}</p>
  </div>
);

const StepCard: React.FC<Step> = ({ id, title, description }) => (
  <div className="relative flex h-full flex-col rounded-2xl bg-slate-900/40 p-5 ring-1 ring-slate-800/80">
    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-200">
        {id}
      </span>
      <span className="uppercase tracking-wide">Step {id}</span>
    </div>
    <h3 className="mb-2 text-sm font-semibold text-slate-50">{title}</h3>
    <p className="text-sm text-slate-400">{description}</p>
  </div>
);

const ChatPreview: React.FC = () => (
  <div className="relative flex flex-col rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-100">
            AI CA Assistant
          </span>
          <span className="text-[11px] text-emerald-300">Context: Client – Sharma & Co · AY 24–25</span>
        </div>
      </div>
      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-300">
        CA mode
      </span>
    </div>

    <div className="flex flex-col gap-2">
      <div className="max-w-[80%] self-end rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs text-slate-50">
        What are the pending GST and TDS compliances for Sharma & Co for this
        month? Highlight anything time-critical.
      </div>

      <div className="max-w-[90%] self-start rounded-2xl bg-slate-900 px-3 py-2 text-xs text-slate-200 ring-1 ring-slate-800">
        <p className="mb-1 font-semibold text-slate-50">
          Summary – next 7 days
        </p>
        <ul className="mb-2 list-disc pl-4 text-[11px] text-slate-300">
          <li>1 GST 3B filing due in 3 days</li>
          <li>2 TDS returns due in 5 days</li>
        </ul>
        <div className="mb-2 rounded-xl bg-slate-950/70 p-2 text-[11px] text-slate-300 ring-1 ring-slate-800">
          <p className="mb-1 font-semibold text-slate-100">High-risk</p>
          <p>
            GST 3B – Regular · Period: Apr 24 · Risk: Overdue interest if
            delayed beyond 3 days.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Create client task
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-200">
            <FileText className="mr-1 h-3 w-3" />
            View detailed schedule
          </span>
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300">
      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      Answers are grounded in latest Govt. notifications. Ask “why” anytime.
    </div>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 text-slate-50">
      {/* Glow backdrop */}
      <div className="pointer-events-none fixed inset-x-0 top-[-6rem] -z-10 flex justify-center blur-3xl">
        <div className="aspect-[5/1] w-[60rem] bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-indigo-500/30 opacity-60" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-4 md:px-6 lg:px-8 lg:pt-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-50">
                AI CA Assistant
              </span>
              <span className="text-[11px] text-slate-400">
                Built for Indian Chartered Accountants
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
            <Link href="#for-ca" className="hover:text-emerald-300">
              For CAs
            </Link>
            <Link href="#for-citizens" className="hover:text-emerald-300">
              For citizens
            </Link>
            <Link href="#how-it-works" className="hover:text-emerald-300">
              How it works
            </Link>
            <Link href="#security" className="hover:text-emerald-300">
              Security
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" variant="primary">
              Get started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </ButtonLink>
          </div>
        </header>

        {/* Hero */}
        <main className="mt-6 grid flex-1 gap-10 md:mt-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
          <section className="space-y-8">
            <div className="space-y-4">
              <PillBadge label="Premium AI workspace for Indian CAs & citizens" />
              <h1 className="text-balance text-3xl font-semibold text-slate-50 sm:text-4xl lg:text-5xl">
                One workspace for{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
                  compliance
                </span>{' '}
                and tax-saving,
                <br className="hidden sm:block" /> powered by an AI CA assistant.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
                Designed for Indian Chartered Accountants who handle hundreds of
                entities{' '}
                <span className="hidden sm:inline">
                  — and for citizens who just want simple, correct tax
                  decisions.
                </span>{' '}
                High-density dashboards for CAs, guided flows for everyone else.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/signup" variant="primary">
                Start as CA practice
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/citizen/start" variant="secondary">
                Try citizen tax-saving wizard
              </ButtonLink>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                <span>Data stays encrypted in India-first infra.</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                />
              ))}
            </div>
          </section>

          {/* Hero Preview */}
          <section className="space-y-4 rounded-3xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
                  <LineChart className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-100">
                    CA dashboard snapshot
                  </span>
                  <span className="text-[11px] text-slate-400">
                    76 entities · 214 active filings
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-slate-300">
                Next 7 days
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-900/90 p-3 text-xs ring-1 ring-slate-800">
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Returns due</span>
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="mb-1 text-2xl font-semibold text-emerald-300">
                  32
                </div>
                <p className="text-[11px] text-slate-400">
                  5 high-risk filings with potential late fees.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/90 p-3 text-xs ring-1 ring-slate-800">
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Reconciliation</span>
                  <LineChart className="h-3.5 w-3.5" />
                </div>
                <div className="mb-1 text-2xl font-semibold text-slate-50">
                  87%
                </div>
                <p className="text-[11px] text-slate-400">
                  Bank & GST books reconciled for active clients.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/90 p-3 text-xs ring-1 ring-slate-800">
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Citizen flows</span>
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="mb-1 text-2xl font-semibold text-slate-50">
                  4.9★
                </div>
                <p className="text-[11px] text-slate-400">
                  Average rating for tax-saving wizard experience.
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/90 p-3 text-xs ring-1 ring-slate-800">
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <UploadCloud className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Document intake</span>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-300">
                    OCR active
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  <li>• 18 PDFs in queue</li>
                  <li>• 12 completed · 3 under review</li>
                  <li>• Auto-tagged to 9 clients</li>
                </ul>
              </div>
              <ChatPreview />
            </div>
          </section>
        </main>

        {/* For CAs */}
        <section
          id="for-ca"
          className="mt-16 border-t border-slate-800/80 pt-10"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <PillBadge label="For Chartered Accountants" />
              <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                A command center for your entire practice — not just a chatbot.
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Replace scattered spreadsheets, reminder apps and WhatsApp
                threads with a single view of deadlines, reconciliations and
                client health, always backed by an AI that understands Indian
                tax and compliance.
              </p>
            </div>
            <div className="hidden flex-col items-end text-xs text-slate-400 md:flex">
              <span className="mb-1 text-[11px] uppercase tracking-wide">
                Built on
              </span>
              <span>Next.js · TypeScript · Production-grade design system</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {caFeatures.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                tag={feature.tag}
              />
            ))}
          </div>
        </section>

        {/* For Citizens */}
        <section
          id="for-citizens"
          className="mt-16 border-t border-slate-800/80 pt-10"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <PillBadge label="For common citizens" />
              <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                Tax-saving, explained like a friend — structured like a CA.
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                No more guessing between old vs new regime or which instrument
                to pick. A guided, visual wizard asks you human questions and
                produces CA-grade recommendations you can trust.
              </p>
            </div>
            <ButtonLink href="/citizen/start" variant="ghost">
              Start tax-saving wizard
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {citizenFeatures.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                tag={feature.tag}
              />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mt-16 border-t border-slate-800/80 pt-10"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <PillBadge label="Architecture-first, yet simple for users" />
              <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                From documents and ledgers to live, AI-augmented decisions.
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Under the hood: OCR, vector search and policy-aware reasoning.
                On the surface: three clean steps that work the same for CAs and
                citizens.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>Optimized for rapid, incremental module additions.</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <StepCard
                key={step.id}
                id={step.id}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </section>

        {/* Security */}
        <section
          id="security"
          className="mt-16 border-t border-slate-800/80 pt-10"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <PillBadge label="Security & control" />
              <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                Designed for confidential financial data from day zero.
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Your practice and your clients deserve bank-grade security
                standards and clear auditability. The assistant works inside
                these guardrails — not around them.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/40 p-5 ring-1 ring-slate-800/80">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Lock className="h-4 w-4 text-emerald-300" />
                <span>Data security by design</span>
              </div>
              <p className="text-sm text-slate-300">
                Data is encrypted in transit and rest, with strict separation
                across practices and no use of your private data to train public
                models.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/40 p-5 ring-1 ring-slate-800/80">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-100">
                <FileText className="h-4 w-4 text-emerald-300" />
                <span>Explainable answers</span>
              </div>
              <p className="text-sm text-slate-300">
                Each answer comes in structured blocks with referenced sections
                and assumptions, so you can sign off with confidence.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/40 p-5 ring-1 ring-slate-800/80">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Users className="h-4 w-4 text-emerald-300" />
                <span>Built for teams and citizens</span>
              </div>
              <p className="text-sm text-slate-300">
                Role-aware access for partners, associates and back-office
                staff, alongside guided flows tailored for non-experts.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-16 border-t border-slate-800/80 pt-10">
          <div className="flex flex-col gap-4 rounded-3xl bg-slate-950/90 p-6 ring-1 ring-slate-800/80 md:flex-row md:items-center md:justify-between md:p-7">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
                Ready to design your AI-first CA practice?
              </h2>
              <p className="max-w-xl text-sm text-slate-300">
                Start with a single client, a single citizen flow, or a single
                OCR pipeline. The underlying architecture and design system are
                ready to scale when you are.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/signup" variant="primary">
                Get started as CA
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/citizen/start" variant="ghost">
                Explore citizen experience
              </ButtonLink>
            </div>
          </div>

          <footer className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-900 pt-4 text-[11px] text-slate-500 md:flex-row">
            <span>© {new Date().getFullYear()} AI CA Assistant. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/terms" className="hover:text-slate-300">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-slate-300">
                Privacy
              </Link>
              <span className="flex items-center gap-1 text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
                Built with Next.js & TypeScript-first architecture.
              </span>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
