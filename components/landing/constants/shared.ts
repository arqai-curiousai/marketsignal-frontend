import {
  Shield,
  Eye,
  Database,
  type LucideIcon,
} from 'lucide-react';

// ── Dual Agent Engine (universal across all landing pages) ──
export const DUAL_AGENT = {
  label: 'THE ENGINE',
  headline: 'Two Minds',
  headlineSerif: 'One Signal',
  sub: 'Every market snapshot is analyzed independently by two AI agents with opposing mandates. Their disagreement is the signal.',
  callouts: [
    {
      title: 'Hallucination Guard',
      description: 'Confidence capped at 0.85 for extreme outputs',
    },
    {
      title: 'Divergence Signals',
      description: 'When agents disagree, conviction is highest',
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
  visual: 'filter' | 'agents' | 'data-flow';
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
        'SEBI-compliant by design. Regulatory content filtering blocks investment advice keywords. We surface signals and analytics — never buy or sell recommendations.',
      visual: 'filter' as const,
    },
    {
      icon: Eye,
      title: 'AI Transparency',
      description:
        'Every signal shows both agent perspectives, conflict type, and confidence scores. Hallucination guard caps confidence at 0.85 for extreme outputs. No black boxes.',
      visual: 'agents' as const,
    },
    {
      icon: Database,
      title: 'Data Integrity',
      description:
        'S3 archival with upload verification before deletion. MongoDB hot data with Beanie ODM. 5-minute refresh cycles. Market-hours-aware scheduling prevents stale data.',
      visual: 'data-flow' as const,
    },
  ] as TrustCard[],
  disclaimer:
    'MarketSignal is an analytics platform. Information only — not investment advice. Past signals are not indicative of future performance.',
};
