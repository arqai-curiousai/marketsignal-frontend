import {
  Shield,
  Eye,
  Database,
  Clock,
  type LucideIcon,
} from 'lucide-react';

// ── Dual Agent Engine (universal across all landing pages) ──
export const DUAL_AGENT = {
  label: 'THE ENGINE',
  headline: 'Two Minds',
  headlineSerif: 'One Verdict',
  sub: 'Every market snapshot is analyzed independently by two AI agents with opposing mandates. Their disagreement is the insight.',
  callouts: [
    {
      title: 'Hallucination Guard',
      description: 'Confidence capped at 0.85 for extreme outputs',
    },
    {
      title: 'Divergence Detection',
      description: 'When agents disagree, the analysis is most informative',
    },
    {
      title: 'Deterministic Resolver',
      description: 'No LLM randomness in the final call',
    },
  ],
  video: {
    webm: '/landing/videos/agent-neural.webm',
    mp4: '/landing/videos/agent-neural.mp4',
  },
};

// ── Trust Wall (universal across all landing pages) ──
export interface TrustCard {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: 'emerald' | 'blue' | 'violet' | 'amber';
}

export const TRUST = {
  label: 'TRUST & TRANSPARENCY',
  headline: 'Built for Compliance',
  headlineSerif: 'Designed for Clarity',
  cards: [
    {
      icon: Shield,
      title: 'Regulatory Compliance',
      description:
        'Content filtering blocks investment advice keywords. We surface analytics, patterns, and data — never buy or sell recommendations.',
      accent: 'emerald' as const,
    },
    {
      icon: Eye,
      title: 'AI Transparency',
      description:
        'Both agent perspectives, conflict types, and confidence scores are always visible. Hallucination guard caps confidence at 0.85. No black boxes.',
      accent: 'blue' as const,
    },
    {
      icon: Database,
      title: 'Data Integrity',
      description:
        'S3 archival with verified uploads. MongoDB hot data with 5-minute refresh. Market-hours-aware scheduling prevents stale data.',
      accent: 'violet' as const,
    },
    {
      icon: Clock,
      title: 'Market Hours Aware',
      description:
        'Signal refresh respects trading hours across NSE, Forex, and Commodity sessions. Data goes stale-safe during off-hours.',
      accent: 'amber' as const,
    },
  ] as TrustCard[],
  testimonial: {
    quote: 'The dual-agent approach surfaces insights I wouldn\'t see with a single model. The divergence signals are genuinely useful for timing entries.',
    author: 'Early Beta Tester',
    role: 'Forex Trader, Mumbai',
  },
  badges: [
    'SEBI Compliant',
    'No Investment Advice',
    'End-to-End Encrypted',
    'Open Beta',
  ],
  disclaimer:
    'Meridian is an analytics platform. Information only — not investment advice. Past patterns are not indicative of future performance.',
};
