'use client';

import React, { useCallback, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Scale,
  FileText,
  Brain,
  Sparkles,
  Lock,
  ChevronRight,
  BookOpen,
  Building2,
  Users,
  CheckCircle2,
  LineChart,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LegalHeader from '@/components/layout/Header';
import LegalFooter from '@/components/layout/Footer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WorkflowStep {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
}

interface UseCaseItem {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly metric: string;
  readonly icon: ReactNode;
}

interface MetricDisplay {
  readonly id: number;
  readonly label: string;
  readonly value: string;
}

interface PricingOption {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly priceNote?: string;
  readonly ctaLabel: string;
  readonly isHighlighted?: boolean;
  readonly features: readonly string[];
}

interface SectionHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly align?: 'left' | 'center';
}

interface CTAHandlers {
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
}

interface MiniStatProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}

interface BulletItemProps {
  readonly children: ReactNode;
}

// ============================================================================
// THEME TOKENS (Saffron / legalaid)
// ============================================================================

interface LandingThemeTokens {
  readonly pageBackground: string;
  readonly baseText: string;
  readonly mutedText: string;
  readonly strongBorder: string;
  readonly softBorder: string;
  readonly heroBackground: string;
  readonly sectionBackground: string;
  readonly sectionAltBackground: string;
  readonly accentBadgeBg: string;
  readonly accentBadgeBorder: string;
  readonly accentBadgeText: string;
  readonly accentText: string;
  readonly accentSoftBg: string;
  readonly accentSoftBorder: string;
  readonly heroGradientText: string;
  readonly primaryButtonGradient: string;
  readonly primaryButtonGradientHover: string;
  readonly primaryButtonText: string;
  readonly secondaryButtonBg: string;
  readonly secondaryButtonBorder: string;
  readonly cardBg: string;
  readonly cardElevatedBg: string;
  readonly statIconBg: string;
  readonly statIconText: string;
}

const getLandingTheme = (): LandingThemeTokens => ({
  pageBackground:
    'bg-[radial-gradient(circle_at_top,_#050308,_#020617)]',
  baseText: 'text-slate-100',
  mutedText: 'text-slate-400',
  strongBorder: 'border-slate-800/80',
  softBorder: 'border-slate-800/60',
  heroBackground:
    'bg-gradient-to-b from-slate-950/60 via-slate-950 to-slate-950/90',
  sectionBackground: 'bg-slate-950',
  sectionAltBackground:
    'bg-gradient-to-b from-slate-950 via-slate-950 to-black',
  accentBadgeBg: 'bg-orange-500/10',
  accentBadgeBorder: 'border-orange-400/35',
  accentBadgeText: 'text-orange-100',
  accentText: 'text-orange-300',
  accentSoftBg: 'bg-orange-500/10',
  accentSoftBorder: 'border-orange-400/30',
  heroGradientText:
    'bg-gradient-to-b from-orange-50 via-orange-100 to-amber-300 bg-clip-text text-transparent',
  primaryButtonGradient:
    'bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300',
  primaryButtonGradientHover:
    'hover:from-orange-300 hover:via-amber-200 hover:to-yellow-200',
  primaryButtonText: 'text-slate-950',
  secondaryButtonBg: 'bg-slate-900/70',
  secondaryButtonBorder: 'border-slate-700',
  cardBg: 'bg-slate-900/70',
  cardElevatedBg: 'bg-slate-950/85',
  statIconBg: 'bg-orange-500/10',
  statIconText: 'text-orange-300',
});

const LANDING_THEME = getLandingTheme();

// ============================================================================
// CONSTANTS & DATA
// ============================================================================

const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  {
    id: 1,
    title: 'Ingest knowledge',
    description:
      'Securely connect judgments, statutes, internal notes, and DMS repositories into a governed knowledge graph.',
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: 2,
    title: 'Ask complex questions',
    description:
      'Query in natural language and get grounded answers with pinpoint citations and paragraph-level references.',
    icon: <Brain className="h-6 w-6" />,
  },
  {
    id: 3,
    title: 'Draft & review',
    description:
      'Generate arguments, redlines, and briefing notes with side-by-side comparison against your existing drafts.',
    icon: <Scale className="h-6 w-6" />,
  },
  {
    id: 4,
    title: 'Explain & justify',
    description:
      'Trace reasoning, inspect sources, and export clean explanation memos for partners and clients.',
    icon: <ShieldCheck className="h-6 w-6" />,
  },
] as const;

const USE_CASES: readonly UseCaseItem[] = [
  {
    id: 1,
    title: 'Case prep & research',
    description:
      'Surface relevant precedents, pinpoint ratios, and conflicting views in minutes instead of hours.',
    metric: '6 hr → 2 hr per matter',
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: 2,
    title: 'Contract review & redlining',
    description:
      'Compare clauses against playbooks, flag deviations, and draft redlines aligned with your risk profile.',
    metric: 'Up to 58% less review time',
    icon: <Scale className="h-6 w-6" />,
  },
  {
    id: 3,
    title: 'Compliance & policy checks',
    description:
      'Scan documents against regulatory frameworks and internal policies across jurisdictions.',
    metric: 'Better managed risk exposure',
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  {
    id: 4,
    title: 'Client-ready summaries',
    description:
      'Turn dense documents into crisp, audience-specific summaries ready for partner or client review.',
    metric: '4× faster client updates',
    icon: <Users className="h-6 w-6" />,
  },
] as const;

const TESTIMONIAL_METRICS: readonly MetricDisplay[] = [
  { id: 1, label: 'Faster document review', value: '50%' },
  { id: 2, label: 'More client-ready outputs', value: '4×' },
  { id: 3, label: 'Accuracy & compliance', value: '99%' },
] as const;

const PRICING_PLANS: readonly PricingOption[] = [
  {
    id: 1,
    name: 'Solo / Boutique',
    description: 'For individual practitioners and small, focused teams.',
    price: '₹ X,XXX',
    priceNote: 'per user / month, billed annually',
    ctaLabel: 'Start free trial',
    isHighlighted: false,
    features: [
      'Unlimited research queries',
      'Up to 100 AI-drafted documents / month',
      'Secure, India-hosted cloud deployment',
      'Email support and onboarding checklist',
    ],
  },
  {
    id: 2,
    name: 'Law Firms',
    description: 'For multi-partner firms with complex workflows and teams.',
    price: "Let's talk",
    priceNote: 'volume pricing available',
    ctaLabel: 'Talk to sales',
    isHighlighted: true,
    features: [
      'Team workspaces and shared knowledge libraries',
      'Advanced workflows (approvals, checklists, playbooks)',
      'On-prem / VPC deployment options',
      'Dedicated success manager & priority support',
    ],
  },
  {
    id: 3,
    name: 'In-house Teams',
    description: 'For corporate legal and general counsel teams.',
    price: 'Custom',
    priceNote: 'based on region & integrations',
    ctaLabel: 'Request proposal',
    isHighlighted: false,
    features: [
      'Integrations with internal tools (DMS, ticketing, ERP)',
      'Tailored policy & contract libraries',
      'Granular access control and audit logs',
      'Executive-grade reporting and analytics',
    ],
  },
] as const;

// ============================================================================
// ANIMATION VARIANTS – typed with MotionProps to avoid TS errors
// ============================================================================

type SectionMotionVariant = Pick<
  MotionProps,
  'initial' | 'whileInView' | 'viewport' | 'transition'
>;

const ANIMATION_VARIANTS: Record<
  'fadeUp' | 'fadeIn' | 'scaleUp',
  SectionMotionVariant
> = {
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: {
      duration: 0.6,
      ease: [0.21, 1.02, 0.73, 1],
    },
  },
  fadeIn: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6 },
  },
  scaleUp: {
    initial: { opacity: 0, scale: 0.96 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.5 },
  },
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const MiniStat: FC<MiniStatProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2.5 transition-transform duration-200 hover:-translate-y-1">
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-lg ${LANDING_THEME.statIconBg} ${LANDING_THEME.statIconText}`}
    >
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-100">
        {value}
      </span>
    </div>
  </div>
);

const BulletItem: FC<BulletItemProps> = ({ children }) => (
  <li className="flex items-start gap-2">
    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-orange-400 to-amber-300" />
    <span>{children}</span>
  </li>
);

const SectionHeader: FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
}) => {
  const alignmentClasses =
    align === 'left'
      ? 'items-start text-left'
      : 'items-center text-center';

  return (
    <div className={`flex flex-col gap-2 ${alignmentClasses}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
        {eyebrow}
      </span>
      <h2 className="text-balance text-xl font-semibold text-slate-50 md:text-2xl">
        {title}
      </h2>
      <p className="max-w-2xl text-xs text-slate-300 md:text-sm">
        {description}
      </p>
    </div>
  );
};

// ============================================================================
// DECORATIVE BACKGROUND
// ============================================================================

const BackgroundDecor: FC = () => (
  <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#050308,_#020617)]" />
    <motion.div
      className="absolute -left-24 top-[-8rem] h-80 w-80 rounded-full bg-orange-500/18 blur-3xl"
      animate={{ opacity: [0.4, 0.8, 0.4], x: [0, 18, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute right-[-4rem] top-1/3 h-80 w-80 rounded-full bg-amber-400/16 blur-3xl"
      animate={{ opacity: [0.2, 0.7, 0.2], x: [0, -20, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-[-9rem] left-1/4 h-96 w-96 rounded-full bg-slate-800/24 blur-3xl"
      animate={{ opacity: [0.15, 0.4, 0.15], scale: [0.9, 1.05, 0.9] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

// ============================================================================
// PREVIEW / HERO COMPONENTS
// ============================================================================

const HeroPreview: FC = () => (
  <motion.div
    {...ANIMATION_VARIANTS.scaleUp}
    whileHover={{ y: -6 }}
  >
    <Card
      className={`relative overflow-hidden border ${LANDING_THEME.strongBorder} ${LANDING_THEME.cardElevatedBg} shadow-[0_22px_55px_rgba(0,0,0,0.85)]`}
    >
      <CardHeader className="border-b border-slate-800/80 bg-slate-950/90">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-100">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-orange-300" />
            Research workspace
          </span>
          <span className="text-[11px] text-orange-200">
            Live · synced to judgments
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[2fr,1.2fr]">
          <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Query</span>
              <span className="inline-flex items-center gap-1 text-orange-300">
                <Clock className="h-3 w-3" />
                0.8s
              </span>
            </div>
            <div className="rounded-lg bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-200">
              How have Indian courts interpreted{' '}
              <span className="font-semibold text-orange-300">
                Section 34
              </span>{' '}
              in the context of delayed arbitral awards in infrastructure
              disputes?
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3">
            <p className="text-[11px] font-medium text-slate-300">
              Answer overview
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-300" />
                <span>
                  Grounded in 12 Supreme Court &amp; 34 HC matters
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-300" />
                <span>Breaks down ratio vs. obiter with citations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-300" />
                <span>Exports to memo, note, or email format</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MiniStat
            icon={<LineChart className="h-3.5 w-3.5" />}
            label="Matters accelerated"
            value="240+"
          />
          <MiniStat
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Avg. time saved / matter"
            value="3.8h"
          />
          <MiniStat
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Citation coverage"
            value="1950 – 2025"
          />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const MockWorkspace: FC = () => (
  <motion.div
    className="relative"
    {...ANIMATION_VARIANTS.scaleUp}
    whileHover={{ y: -4 }}
  >
    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-orange-500/18 via-amber-400/18 to-yellow-400/18 blur-2xl" />
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/90 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-1 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-orange-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="ml-3 text-[11px] text-slate-400">
          matter / Infra dispute – Section 34
        </span>
      </div>
      <div className="grid gap-0 border-t border-slate-800/60 md:grid-cols-[2fr,1.1fr]">
        <div className="border-r border-slate-800/60 p-4">
          <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Judgment view</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
              <FileText className="h-3 w-3" />
              Extracted from PDF
            </span>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-[11px] leading-relaxed text-slate-200">
            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-orange-300">
              Para 34
            </span>{' '}
            The Court notes that delays attributable solely to the employer
            cannot, by themselves, justify setting aside an award absent
            perversity or patent illegality in the reasoning...
            <div className="mt-2 h-px w-full bg-gradient-to-r from-orange-400/60 via-slate-700 to-transparent" />
            <span className="text-[10px] text-slate-400">
              Highlighted by co-pilot · linked to 3 similar matters
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0 border-t border-slate-800/60 p-4 md:border-t-0">
          <p className="mb-2 text-[11px] font-medium text-slate-300">
            Insights &amp; reasoning trace
          </p>
          <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-[11px] text-slate-200">
            <p>
              1. The Court treats delay as a{' '}
              <span className="font-semibold text-orange-300">
                factual matrix
              </span>{' '}
              rather than an independent ground under Section 34.
            </p>
            <p>
              2. The award survives where the tribunal has{' '}
              <span className="font-semibold text-orange-300">
                accounted for delay
              </span>{' '}
              in its reasoning, even if parties disagree with the quantum.
            </p>
            <p>
              3. The co-pilot suggests citing{' '}
              <span className="font-semibold text-orange-300">
                XYZ Infra v. State (2022)
              </span>{' '}
              and{' '}
              <span className="font-semibold text-orange-300">
                ABC Constructions v. NHAI (2024)
              </span>{' '}
              to strengthen the proposition.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
              <Building2 className="h-3 w-3" />
              Firm knowledge base
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
              <Brain className="h-3 w-3" />
              RAG + fine-tuned models
            </span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const TrustCard: FC = () => (
  <motion.div
    className="relative"
    {...ANIMATION_VARIANTS.scaleUp}
    whileHover={{ y: -4 }}
  >
    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-orange-500/18 via-amber-400/18 to-yellow-400/18 blur-2xl" />
    <div
      className={`relative space-y-4 rounded-3xl border p-5 shadow-[0_22px_55px_rgba(0,0,0,0.9)] ${LANDING_THEME.strongBorder} ${LANDING_THEME.cardElevatedBg}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-orange-300">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-50">
            Governance snapshot
          </p>
          <p className="text-[11px] text-slate-400">
            Designed for internal policies and regulatory expectations.
          </p>
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 text-[11px] text-slate-200">
        <div className="flex items-center justify-between">
          <span>Deployment mode</span>
          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-orange-300">
            VPC / on-prem
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Data residency</span>
          <span className="text-slate-300">India or region of choice</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Access model</span>
          <span className="text-slate-300">SSO, SAML, role-based</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Audit coverage</span>
          <span className="text-slate-300">
            Prompts, actions &amp; exports
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-orange-300" />
        <span>
          Built with guardrails to keep sensitive data within your
          control.
        </span>
      </div>
    </div>
  </motion.div>
);

// ============================================================================
// SECTIONS
// ============================================================================

interface HeroSectionProps {
  readonly handlers: CTAHandlers;
}

const HeroSection: FC<HeroSectionProps> = ({ handlers }) => (
  <section
    id="hero"
    className={`relative z-10 border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.heroBackground}`}
  >
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-16 pt-24 md:flex-row md:items-stretch md:pt-28">
      <motion.div
        className="flex-1 space-y-6"
        {...ANIMATION_VARIANTS.fadeUp}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${LANDING_THEME.accentBadgeBorder} ${LANDING_THEME.accentBadgeBg} ${LANDING_THEME.accentBadgeText}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          legalaid · AI-native co-pilot for serious legal work
        </span>
        <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl md:text-6xl">
          Research, draft, and review
          <span className={`block mt-2 ${LANDING_THEME.heroGradientText}`}>
            with a co-pilot that cites every step.
          </span>
        </h1>
        <p className="max-w-xl text-base text-slate-300 md:text-lg">
          arQai legalaid weaves together judgments, statutes, and your
          private knowledge into a governed workspace – so every answer,
          draft, and summary is anchored in verifiable law.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className={`relative overflow-hidden ${LANDING_THEME.primaryButtonGradient} ${LANDING_THEME.primaryButtonGradientHover} ${LANDING_THEME.primaryButtonText} rounded-xl px-5 shadow-[0_0_22px_rgba(249,115,22,0.5)]`}
            onClick={handlers.onPrimary}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/25 opacity-0 transition-opacity duration-200 hover:opacity-100" />
            <span className="relative z-10 flex items-center">
              Start free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className={`rounded-xl border px-4 ${LANDING_THEME.secondaryButtonBg} ${LANDING_THEME.secondaryButtonBorder} text-slate-100 hover:bg-slate-900`}
            onClick={handlers.onSecondary}
          >
            Book a demo
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 md:text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-orange-300" />
            <span>Designed for Indian and common-law workflows</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-orange-300" />
            <span>Private by design · HttpOnly sessions · audit trails</span>
          </div>
        </div>
      </motion.div>

      <div className="flex-1">
        <HeroPreview />
      </div>
    </div>
  </section>
);

const HowItWorksSection: FC = () => (
  <section
    id="features"
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionBackground}`}
  >
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="How it works"
        title="From raw judgments to reasoned, cite-ready output"
        description="The co-pilot wraps cutting-edge AI research in a workflow designed for legal teams – not generic chatbots."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-4">
        {WORKFLOW_STEPS.map((step) => (
          <motion.div
            key={step.id}
            className={`flex flex-col rounded-2xl border p-5 transition-transform duration-200 ${LANDING_THEME.strongBorder} ${LANDING_THEME.cardBg}`}
            whileHover={{ y: -4 }}
          >
            <div
              className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${LANDING_THEME.accentSoftBg} text-orange-300`}
            >
              {step.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-50">
              {step.title}
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const IntegrationSection: FC = () => (
  <section
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionBackground}`}
  >
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-20">
      <motion.div
        className="flex-1 space-y-5"
        {...ANIMATION_VARIANTS.fadeUp}
      >
        <SectionHeader
          eyebrow="Deep AI + legal integration"
          title="More than chat: a governed workspace for your legal stack"
          description="Connect case law, statutes, research notes, and internal DMS into a single, queryable surface with controllable data flows."
          align="left"
        />
        <ul className="space-y-3 text-sm text-slate-300">
          <BulletItem>
            Native support for Indian Supreme &amp; High Court judgments,
            with expansion paths for other common-law jurisdictions.
          </BulletItem>
          <BulletItem>
            Document-aware drafting that respects your firm playbooks and
            partner preferences.
          </BulletItem>
          <BulletItem>
            First-class support for citations, paragraph anchors, and
            reasoning traces – ready to paste into memos and notes.
          </BulletItem>
        </ul>
      </motion.div>
      <div className="flex-1">
        <MockWorkspace />
      </div>
    </div>
  </section>
);

const UseCasesSection: FC = () => (
  <section
    id="solutions"
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionBackground}`}
  >
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Use-case highlights"
        title="Built for litigation, transactions, and in-house teams"
        description="Start with high-leverage workflows that move the needle for your practice – then expand into deeper automation over time."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-4">
        {USE_CASES.map((useCase) => (
          <motion.div
            key={useCase.id}
            className={`flex flex-col rounded-2xl border p-5 transition-transform duration-200 ${LANDING_THEME.strongBorder} ${LANDING_THEME.cardBg}`}
            whileHover={{ y: -4 }}
          >
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-orange-300">
              {useCase.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-50">
              {useCase.title}
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              {useCase.description}
            </p>
            <span className="mt-3 text-xs font-medium text-orange-300">
              {useCase.metric}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const TrustSection: FC = () => (
  <section
    id="trust"
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionBackground}`}
  >
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-20">
      <motion.div
        className="flex-1 space-y-5"
        {...ANIMATION_VARIANTS.fadeUp}
      >
        <SectionHeader
          eyebrow="Trust, governance & security"
          title="Your matters stay your matters"
          description="Bring AI into your practice without compromising confidentiality, privilege, or compliance obligations."
          align="left"
        />
        <ul className="space-y-3 text-sm text-slate-300">
          <BulletItem>
            Private deployments in your VPC or on-prem with strict network
            boundaries.
          </BulletItem>
          <BulletItem>
            Granular access control, workspace-level permissions, and
            retention policies.
          </BulletItem>
          <BulletItem>
            Guardrails to require citations for critical flows, with
            human-in-the-loop review.
          </BulletItem>
          <BulletItem>
            Detailed audit log of prompts, actions, and outputs for
            governance and training.
          </BulletItem>
        </ul>
      </motion.div>
      <div className="flex-1">
        <TrustCard />
      </div>
    </div>
  </section>
);

const TestimonialSection: FC = () => (
  <section
    id="about"
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionBackground}`}
  >
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <motion.div
        className="space-y-6 text-center"
        {...ANIMATION_VARIANTS.fadeUp}
      >
        <p className="mx-auto max-w-3xl text-balance text-lg italic text-slate-200">
          &quot;The co-pilot has changed the tempo of our work – research
          notes that took half a day now land with citations and reasoning
          in under an hour.&quot;
        </p>
        <p className="text-sm text-slate-400">
          General Counsel, technology company
        </p>
      </motion.div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {TESTIMONIAL_METRICS.map((metric) => (
          <motion.div
            key={metric.id}
            {...ANIMATION_VARIANTS.scaleUp}
          >
            <Card
              className={`w-full max-w-xs border text-center ${LANDING_THEME.strongBorder} ${LANDING_THEME.cardBg}`}
            >
              <CardContent className="py-6">
                <div className="text-3xl font-semibold text-orange-300">
                  {metric.value}
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  {metric.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

interface PricingSectionProps {
  readonly handlers: CTAHandlers;
}

const PricingSection: FC<PricingSectionProps> = ({ handlers }) => (
  <section
    id="pricing"
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionBackground}`}
  >
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Pricing & plans"
        title="Start focused, scale with your practice"
        description="Begin with a pilot for a small team, then expand into firm-wide deployment once workflows are proven."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            {...ANIMATION_VARIANTS.fadeUp}
            transition={{
              ...(ANIMATION_VARIANTS.fadeUp.transition ?? {}),
              delay: plan.id * 0.08,
            }}
          >
            <Card
              className={`flex h-full flex-col border transition-transform duration-200 ${LANDING_THEME.strongBorder} ${LANDING_THEME.cardBg} ${
                plan.isHighlighted
                  ? 'ring-2 ring-orange-400/70 shadow-lg shadow-orange-500/25'
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base text-slate-50">
                  <span>{plan.name}</span>
                  {plan.isHighlighted ? (
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300">
                      Recommended
                    </span>
                  ) : null}
                </CardTitle>
                <p className="mt-1 text-xs text-slate-300">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between pb-5">
                <div>
                  <div className="text-2xl font-semibold text-orange-300">
                    {plan.price}
                  </div>
                  {plan.priceNote ? (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {plan.priceNote}
                    </p>
                  ) : null}
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2"
                      >
                        <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 flex-shrink-0 text-orange-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Button
                    className={`w-full rounded-xl text-sm font-semibold ${
                      plan.isHighlighted
                        ? `${LANDING_THEME.primaryButtonGradient} ${LANDING_THEME.primaryButtonGradientHover} ${LANDING_THEME.primaryButtonText} ${LANDING_THEME.primaryButtonText}`
                        : 'bg-slate-800 text-slate-50 hover:bg-slate-700'
                    }`}
                    onClick={
                      plan.id === 1
                        ? handlers.onPrimary
                        : handlers.onSecondary
                    }
                  >
                    {plan.ctaLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

interface FinalCtaSectionProps {
  readonly onDemoCta: () => void;
}

const FinalCtaSection: FC<FinalCtaSectionProps> = ({ onDemoCta }) => (
  <section
    id="walkthrough"
    className={`border-b ${LANDING_THEME.softBorder} ${LANDING_THEME.sectionAltBackground}`}
  >
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        {...ANIMATION_VARIANTS.fadeUp}
      >
        <h2 className="text-balance text-2xl font-semibold text-slate-50 md:text-3xl">
          Bring an AI co-pilot into your legal stack
        </h2>
        <p className="max-w-2xl text-sm text-slate-300 md:text-base">
          See a live walkthrough on your own matters. We will help you
          scope a pilot that respects privilege, governance, and your
          team&apos;s way of working.
        </p>
        <Button
          size="lg"
          className={`mt-2 rounded-xl px-5 ${LANDING_THEME.primaryButtonGradient} ${LANDING_THEME.primaryButtonGradientHover} ${LANDING_THEME.primaryButtonText} shadow-[0_0_22px_rgba(249,115,22,0.5)]`}
          onClick={onDemoCta}
        >
          Request a customised demo
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  </section>
);

// ============================================================================
// HOOKS & MAIN PAGE
// ============================================================================

const useNavigationHandlers = (): CTAHandlers => {
  const router = useRouter();

  const onPrimary = useCallback((): void => {
    router.push('/login');
  }, [router]);

  const onSecondary = useCallback((): void => {
    router.push('/contact');
  }, [router]);

  return useMemo(
    () => ({ onPrimary, onSecondary }),
    [onPrimary, onSecondary],
  );
};

const LegalLandingPage: FC = () => {
  const handlers = useNavigationHandlers();

  return (
    <main
      className={`relative min-h-screen antialiased ${LANDING_THEME.pageBackground} ${LANDING_THEME.baseText}`}
    >
      <BackgroundDecor />
      <LegalHeader />

      <HeroSection handlers={handlers} />
      <HowItWorksSection />
      <IntegrationSection />
      <UseCasesSection />
      <TrustSection />
      <TestimonialSection />
      <PricingSection handlers={handlers} />
      <FinalCtaSection onDemoCta={handlers.onSecondary} />

      <LegalFooter />
    </main>
  );
};

export default LegalLandingPage;
