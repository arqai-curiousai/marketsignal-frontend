'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};

type UseCase = {
  id: number;
  title: string;
  description: string;
  metric: string;
  icon: React.ReactNode;
};

type Metric = {
  id: number;
  label: string;
  value: string;
};

type PricingPlan = {
  id: number;
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  ctaLabel: string;
  highlight?: boolean;
  features: string[];
};

type FooterColumn = {
  id: number;
  title: string;
  links: { label: string; href: string }[];
};

const steps: Step[] = [
  {
    id: 1,
    title: "Ingest knowledge",
    description:
      "Securely connect judgments, statutes, internal notes, and DMS repositories into a governed knowledge graph.",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: 2,
    title: "Ask complex questions",
    description:
      "Query in natural language and get grounded answers with pinpoint citations and paragraph-level references.",
    icon: <Brain className="h-6 w-6" />,
  },
  {
    id: 3,
    title: "Draft & review",
    description:
      "Generate arguments, redlines, and briefing notes with side-by-side comparison against your existing drafts.",
    icon: <Scale className="h-6 w-6" />,
  },
  {
    id: 4,
    title: "Explain & justify",
    description:
      "Trace reasoning, inspect sources, and export clean explanation memos for partners and clients.",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
];

const useCases: UseCase[] = [
  {
    id: 1,
    title: "Case prep & research",
    description:
      "Surface relevant precedents, pinpoint ratios, and conflicting views in minutes instead of hours.",
    metric: "6 hr → 2 hr per matter",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: 2,
    title: "Contract review & redlining",
    description:
      "Compare clauses against playbooks, flag deviations, and draft redlines aligned with your risk profile.",
    metric: "Up to 58% less review time",
    icon: <Scale className="h-6 w-6" />,
  },
  {
    id: 3,
    title: "Compliance & policy checks",
    description:
      "Scan documents against regulatory frameworks and internal policies across jurisdictions.",
    metric: "Better managed risk exposure",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  {
    id: 4,
    title: "Client-ready summaries",
    description:
      "Turn dense documents into crisp, audience-specific summaries ready for partner or client review.",
    metric: "4× faster client updates",
    icon: <Users className="h-6 w-6" />,
  },
];

const testimonialMetrics: Metric[] = [
  { id: 1, label: "Faster document review", value: "50%" },
  { id: 2, label: "More client-ready outputs", value: "4×" },
  { id: 3, label: "Accuracy & compliance", value: "99%" },
];

const pricingPlans: PricingPlan[] = [
  {
    id: 1,
    name: "Solo / Boutique",
    description: "For individual practitioners and small, focused teams.",
    price: "₹ X,XXX",
    priceNote: "per user / month, billed annually",
    ctaLabel: "Start free trial",
    features: [
      "Unlimited research queries",
      "Up to 100 AI-drafted documents / month",
      "Secure, India-hosted cloud deployment",
      "Email support and onboarding checklist",
    ],
  },
  {
    id: 2,
    name: "Law Firms",
    description: "For multi-partner firms with complex workflows and teams.",
    price: "Let’s talk",
    priceNote: "volume pricing available",
    ctaLabel: "Talk to sales",
    highlight: true,
    features: [
      "Team workspaces and shared knowledge libraries",
      "Advanced workflows (approvals, checklists, playbooks)",
      "On-prem / VPC deployment options",
      "Dedicated success manager & priority support",
    ],
  },
  {
    id: 3,
    name: "In-house Teams",
    description: "For corporate legal and general counsel teams.",
    price: "Custom",
    priceNote: "based on region & integrations",
    ctaLabel: "Request proposal",
    features: [
      "Integrations with internal tools (DMS, ticketing, ERP)",
      "Tailored policy & contract libraries",
      "Granular access control and audit logs",
      "Executive-grade reporting and analytics",
    ],
  },
];

const footerColumns: FooterColumn[] = [
  {
    id: 1,
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Changelog", href: "#changelog" },
    ],
  },
  {
    id: 2,
    title: "Solutions",
    links: [
      { label: "Law firms", href: "#solutions" },
      { label: "In-house teams", href: "#solutions" },
      { label: "Boutique practices", href: "#solutions" },
    ],
  },
  {
    id: 3,
    title: "Security",
    links: [
      { label: "Governance", href: "#trust" },
      { label: "Compliance", href: "#trust" },
      { label: "Data privacy", href: "#trust" },
    ],
  },
  {
    id: 4,
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#resources" },
      { label: "Case studies", href: "#resources" },
    ],
  },
  {
    id: 5,
    title: "Legal",
    links: [
      { label: "Terms of service", href: "#" },
      { label: "Privacy policy", href: "#" },
      { label: "Cookie policy", href: "#" },
    ],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: [0.21, 1.02, 0.73, 1] },
};

const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6 },
};

const LegalLandingPage: React.FC = () => {
  const router = useRouter();

  const handlePrimaryCta = (): void => {
    router.push("/login");
  };

  const handleDemoCta = (): void => {
    router.push("/contact");
  };

  return (
    <main className="relative min-h-screen bg-[#050812] text-slate-100 antialiased">
      <BackgroundDecor />
      <Header onPrimaryCta={handlePrimaryCta} onSecondaryCta={handleDemoCta} />

      {/* HERO */}
      <section
        id="hero"
        className="relative z-10 border-b border-slate-800/70 bg-gradient-to-b from-slate-950/60 via-slate-950 to-slate-950/90"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-16 pt-24 md:flex-row md:items-stretch md:pt-28">
          <motion.div className="flex-1 space-y-6" {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI-native co-pilot for serious legal work
            </span>
            <h1 className="text-balance bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl md:text-6xl">
              Research, draft, and review
              <span className="block text-emerald-300">
                with a co-pilot that cites every step.
              </span>
            </h1>
            <p className="max-w-xl text-base text-slate-300 md:text-lg">
              arQai Legal weaves together judgments, statutes, and your private
              knowledge into a governed workspace – so every answer, draft, and
              summary is anchored in verifiable law.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                onClick={handlePrimaryCta}
              >
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-900"
                onClick={handleDemoCta}
              >
                Book a demo
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 md:text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Designed for Indian and common-law workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>Private by design · HttpOnly sessions · audit trails</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="flex-1" {...fadeIn}>
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* SECTIONS */}
      <HowItWorksSection />
      <IntegrationSection />
      <UseCasesSection />
      <TrustSection />
      <TestimonialSection />
      <PricingSection
        onPrimaryCta={handlePrimaryCta}
        onSecondaryCta={handleDemoCta}
      />
      <FinalCtaSection onPrimaryCta={handleDemoCta} />
      <Footer />
    </main>
  );
};

interface HeaderProps {
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPrimaryCta, onSecondaryCta }) => {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-sky-500">
            <div className="absolute inset-[2px] rounded-[0.7rem] bg-slate-950" />
            <Scale className="relative z-10 mx-auto mt-1.5 h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-wide text-slate-50">
              arQai Legal Co-pilot
            </span>
            <span className="text-[11px] text-slate-400">
              AI workspace for litigation &amp; advisory teams
            </span>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
          <a href="#features" className="hover:text-emerald-300">
            Features
          </a>
          <a href="#solutions" className="hover:text-emerald-300">
            Solutions
          </a>
          <a href="#trust" className="hover:text-emerald-300">
            Trust &amp; security
          </a>
          <a href="#pricing" className="hover:text-emerald-300">
            Pricing
          </a>
          <a href="#resources" className="hover:text-emerald-300">
            Resources
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-xs text-slate-300 hover:text-slate-50 md:inline-flex"
            onClick={onSecondaryCta}
          >
            Book demo
          </Button>
          <Button
            size="sm"
            className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            onClick={onPrimaryCta}
          >
            Login
          </Button>
        </div>
      </div>
    </header>
  );
};

const BackgroundDecor: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)]" />
    <div className="absolute left-1/2 top-[-10rem] h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
    <div className="absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
    <div className="absolute bottom-[-8rem] left-[-2rem] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
  </div>
);

const HeroPreview: React.FC = () => {
  return (
    <Card className="relative overflow-hidden border-slate-800/70 bg-slate-900/70 shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
      <CardHeader className="border-b border-slate-800/70 bg-slate-900/90">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-100">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Research workspace
          </span>
          <span className="text-[11px] text-emerald-300">
            Live · synced to judgments
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[2fr,1.2fr]">
          <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Query</span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <Clock className="h-3 w-3" />
                0.8s
              </span>
            </div>
            <div className="rounded-lg bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-200">
              How have Indian courts interpreted{" "}
              <span className="font-semibold text-emerald-300">
                Section 34
              </span>{" "}
              in the context of delayed arbitral awards in infrastructure
              disputes?
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <p className="text-[11px] font-medium text-slate-300">
              Answer overview
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Grounded in 12 Supreme Court &amp; 34 HC matters</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Breaks down ratio vs. obiter with citations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
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
  );
};

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2.5">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  </div>
);

const HowItWorksSection: React.FC = () => (
  <section id="features" className="border-b border-slate-800/60 bg-slate-950">
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="How it works"
        title="From raw judgments to reasoned, cite-ready output"
        description="The co-pilot wraps cutting-edge AI research in a workflow designed for legal teams – not generic chatbots."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-4">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              {step.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-50">
              {step.title}
            </h3>
            <p className="mt-2 text-xs text-slate-300">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const IntegrationSection: React.FC = () => (
  <section className="border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-20">
      <motion.div className="flex-1 space-y-5" {...fadeUp}>
        <SectionHeader
          eyebrow="Deep AI + legal integration"
          title="More than chat: a governed workspace for your legal stack"
          description="Connect case law, statutes, research notes, and internal DMS into a single, queryable surface with controllable data flows."
          align="left"
        />
        <ul className="space-y-3 text-sm text-slate-300">
          <BulletItem>
            Native support for Indian Supreme &amp; High Court judgments, with
            expansion paths for other common-law jurisdictions.
          </BulletItem>
          <BulletItem>
            Document-aware drafting that respects your firm playbooks and
            partner preferences.
          </BulletItem>
          <BulletItem>
            First-class support for citations, paragraph anchors, and reasoning
            traces – ready to paste into memos and notes.
          </BulletItem>
        </ul>
      </motion.div>
      <motion.div className="flex-1" {...fadeIn}>
        <MockWorkspace />
      </motion.div>
    </div>
  </section>
);

const UseCasesSection: React.FC = () => (
  <section id="solutions" className="border-b border-slate-800/60 bg-slate-950">
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Use-case highlights"
        title="Built for litigation, transactions, and in-house teams"
        description="Start with high-leverage workflows that move the needle for your practice – then expand into deeper automation over time."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-4">
        {useCases.map((useCase) => (
          <motion.div
            key={useCase.id}
            className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-emerald-300">
              {useCase.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-50">
              {useCase.title}
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              {useCase.description}
            </p>
            <span className="mt-3 text-xs font-medium text-emerald-300">
              {useCase.metric}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const TrustSection: React.FC = () => (
  <section id="trust" className="border-b border-slate-800/60 bg-slate-950">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-20">
      <motion.div className="flex-1 space-y-5" {...fadeUp}>
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
            Granular access control, workspace-level permissions, and retention
            policies.
          </BulletItem>
          <BulletItem>
            Guardrails to require citations for critical flows, with
            human-in-the-loop review.
          </BulletItem>
          <BulletItem>
            Detailed audit log of prompts, actions, and outputs for governance
            and training.
          </BulletItem>
        </ul>
      </motion.div>
      <motion.div className="flex-1" {...fadeIn}>
        <TrustCard />
      </motion.div>
    </div>
  </section>
);

const TestimonialSection: React.FC = () => (
  <section id="about" className="border-b border-slate-800/60 bg-slate-950">
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <motion.div className="space-y-6 text-center" {...fadeUp}>
        <p className="mx-auto max-w-3xl text-balance text-lg italic text-slate-200">
          “The co-pilot has changed the tempo of our work – research notes that
          took half a day now land with citations and reasoning in under an
          hour.”
        </p>
        <p className="text-sm text-slate-400">
          General Counsel, technology company
        </p>
      </motion.div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {testimonialMetrics.map((metric) => (
          <Card
            key={metric.id}
            className="w-full max-w-xs border-slate-800/80 bg-slate-900/70 text-center"
          >
            <CardContent className="py-6">
              <div className="text-3xl font-semibold text-emerald-300">
                {metric.value}
              </div>
              <p className="mt-2 text-xs text-slate-300">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

interface PricingSectionProps {
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({
  onPrimaryCta,
  onSecondaryCta,
}) => (
  <section id="pricing" className="border-b border-slate-800/60 bg-slate-950">
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Pricing & plans"
        title="Start focused, scale with your practice"
        description="Begin with a pilot for a small team, then expand into firm-wide deployment once workflows are proven."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex h-full flex-col border-slate-800/80 bg-slate-900/70 ${
              plan.highlight ? "ring-2 ring-emerald-400/70" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base text-slate-50">
                <span>{plan.name}</span>
                {plan.highlight ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
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
                <div className="text-2xl font-semibold text-emerald-300">
                  {plan.price}
                </div>
                {plan.priceNote ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {plan.priceNote}
                  </p>
                ) : null}
                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                      : "bg-slate-800 text-slate-50 hover:bg-slate-700"
                  }`}
                  onClick={plan.id === 1 ? onPrimaryCta : onSecondaryCta}
                >
                  {plan.ctaLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

interface FinalCtaSectionProps {
  onPrimaryCta: () => void;
}

const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onPrimaryCta }) => (
  <section
    id="walkthrough"
    className="border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-950 to-black"
  >
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-balance text-2xl font-semibold text-slate-50 md:text-3xl">
          Bring an AI co-pilot into your legal stack
        </h2>
        <p className="max-w-2xl text-sm text-slate-300 md:text-base">
          See a live walkthrough on your own matters. We will help you scope a
          pilot that respects privilege, governance, and your team&apos;s way
          of working.
        </p>
        <Button
          size="lg"
          className="mt-2 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          onClick={onPrimaryCta}
        >
          Request a customised demo
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
);

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = "center",
}) => {
  const alignment =
    align === "left"
      ? "items-start text-left"
      : "items-center text-center";

  return (
    <div className={`flex flex-col gap-2 ${alignment}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
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

interface BulletItemProps {
  children: React.ReactNode;
}

const BulletItem: React.FC<BulletItemProps> = ({ children }) => (
  <li className="flex items-start gap-2">
    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
    <span>{children}</span>
  </li>
);

const MockWorkspace: React.FC = () => (
  <div className="relative">
    <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-2xl" />
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/90 shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-1 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
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
            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-emerald-300">
              Para 34
            </span>{" "}
            The Court notes that delays attributable solely to the employer
            cannot, by themselves, justify setting aside an award absent
            perversity or patent illegality in the reasoning...
            <div className="mt-2 h-px w-full bg-gradient-to-r from-emerald-400/60 via-slate-700 to-transparent" />
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
              1. The Court treats delay as a{" "}
              <span className="font-semibold text-emerald-300">
                factual matrix
              </span>{" "}
              rather than an independent ground under Section 34.
            </p>
            <p>
              2. The award survives where the tribunal has{" "}
              <span className="font-semibold text-emerald-300">
                accounted for delay
              </span>{" "}
              in its reasoning, even if parties disagree with the quantum.
            </p>
            <p>
              3. The co-pilot suggests citing{" "}
              <span className="font-semibold text-emerald-300">
                XYZ Infra v. State (2022)
              </span>{" "}
              and{" "}
              <span className="font-semibold text-emerald-300">
                ABC Constructions v. NHAI (2024)
              </span>{" "}
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
  </div>
);

const TrustCard: React.FC = () => (
  <div className="relative">
    <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-2xl" />
    <div className="relative space-y-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5 shadow-[0_22px_55px_rgba(0,0,0,0.85)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
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
          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-emerald-300">
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
          <span className="text-slate-300">Prompts, actions &amp; exports</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
        <span>
          Built with guardrails to keep sensitive data within your control.
        </span>
      </div>
    </div>
  </div>
);

const Footer: React.FC = () => (
  <footer className="border-t border-slate-800/60 bg-black">
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-sky-500">
              <div className="absolute inset-[2px] rounded-[0.7rem] bg-slate-950" />
              <Scale className="relative z-10 mx-auto mt-1.5 h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">
                arQai Legal Co-pilot
              </p>
              <p className="text-[11px] text-slate-400">
                AI workspace for Indian and global legal teams.
              </p>
            </div>
          </div>
          <p className="max-w-sm text-xs text-slate-400">
            Built at the intersection of law and applied AI to help teams move
            faster without compromising on depth, accuracy, or governance.
          </p>
        </div>
        <div className="grid gap-6 text-xs text-slate-300 sm:grid-cols-3 md:grid-cols-5">
          {footerColumns.map((column) => (
            <div key={column.id} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {column.title}
              </p>
              <ul className="space-y-1.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-emerald-300">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-800/60 pt-4 text-[11px] text-slate-500 md:flex-row">
        <span>&copy; {new Date().getFullYear()} arQai. All rights reserved.</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Secure by design</span>
          </span>
          <span className="hidden text-slate-600 md:inline">·</span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>Made for legal teams</span>
          </span>
        </span>
      </div>
    </div>
  </footer>
);

export default LegalLandingPage;
