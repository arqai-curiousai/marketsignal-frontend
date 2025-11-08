import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, LogIn, UserPlus, Shield, Sparkles, Stars, Sparkle, Diamond } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Utility animations ---
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 1.02, 0.73, 1] } },
};

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
};

// --- The Landing Page Component ---
export default function PremiumLanding() {
  const [openAuth, setOpenAuth] = React.useState<null | "login" | "signup">(null);

  const onSubmitLogin: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // TODO: integrate with your login endpoint
  };
  const onSubmitSignup: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // TODO: integrate with your signup/OTP endpoint
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f1a] text-zinc-200 antialiased">
      {/* Decorative background */}
      <Backdrop />

      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-cyan-300 blur-[1px]" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/70 via-fuchsia-500/70 to-cyan-400/70" />
            </div>
            <span className="text-lg font-semibold tracking-wide text-white">arQai Legal</span>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            <NavLink>Features</NavLink>
            <NavLink>Pricing</NavLink>
            <NavLink>Docs</NavLink>
            <NavLink>Contact</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-zinc-200 hover:text-white" onClick={() => setOpenAuth("login")}>Log in</Button>
            <Button className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 text-[#0b0f1a] hover:opacity-90" onClick={() => setOpenAuth("signup")}>
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-8 pt-10 md:grid-cols-2 md:gap-14 md:pt-16">
          <motion.div {...fadeUp} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <Sparkles className="h-3.5 w-3.5" /> Premium AI for legal research
            </div>
            <h1 className="text-balance bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl md:text-6xl">
              Research law with <span className="underline decoration-fuchsia-400/60 decoration-[6px] underline-offset-[10px]">clarity</span> and speed.
            </h1>
            <p className="max-w-xl text-zinc-400">
              A refined workspace that turns judgments into insights. Search, summarize, and cite with confidence—on a medium‑dark canvas designed to stay out of your way.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="bg-white text-[#0b0f1a] hover:bg-zinc-100" onClick={() => setOpenAuth("signup")}>
                <UserPlus className="mr-2 h-4 w-4" /> Create your account
              </Button>
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setOpenAuth("login")}>
                <LogIn className="mr-2 h-4 w-4" /> Log in
              </Button>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-zinc-300 sm:grid-cols-2">
              <Li icon={<Check />}>OTP login with secure sessions</Li>
              <Li icon={<Check />}>Judgment search · citations</Li>
              <Li icon={<Check />}>Workspace projects & notes</Li>
              <Li icon={<Check />}>Encrypted cloud sync</Li>
            </ul>
          </motion.div>

          <motion.div {...fade} className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/15 to-cyan-400/10 blur-2xl" />
            <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10 bg-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-cyan-300" /> Live Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Stat title="Indexed Cases" value="1.2M+" />
                  <Stat title="Avg. Answer Time" value="0.8s" />
                  <Stat title="Daily Users" value="8,142" />
                </div>
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-300">“Found precedent in seconds. The citations panel is chef’s kiss.”</p>
                  <p className="mt-1 text-xs text-zinc-500">— Senior Associate, Delhi</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Feature icon={<Stars />} title="Crisp Results" text="Smart ranking over 1950–2025 judgments with semantic filters." />
            <Feature icon={<Diamond />} title="Premium UX" text="A medium‑dark aesthetic with elegant contrast and subtle motion." />
            <Feature icon={<Sparkle />} title="Privacy First" text="HttpOnly cookies, short‑lived tokens, and controlled data flows." />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative z-10">
        <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-fuchsia-600/20 to-cyan-500/10 p-6 sm:p-10">
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-2xl font-semibold text-white">Begin your 7‑day premium trial</h3>
                <p className="mt-1 text-zinc-300">Full access · No credit card · Cancel anytime</p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="lg" className="bg-white text-[#0b0f1a] hover:bg-zinc-100" onClick={() => setOpenAuth("signup")}>Create account</Button>
                <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setOpenAuth("login")}>
                  I have an account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10/">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 text-sm text-zinc-400">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {new Date().getFullYear()} arQai. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Dialogs */}
      <Dialog open={openAuth === "login"} onOpenChange={(o) => setOpenAuth(o ? "login" : null)}>
        <DialogContent className="max-w-md border-white/10 bg-[#0b0f1a] text-zinc-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white"><LogIn className="h-5 w-5"/> Log in</DialogTitle>
            <DialogDescription>Welcome back. Continue from where you left.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-login">Email</Label>
              <Input id="email-login" type="email" placeholder="you@firm.com" className="bg-white/5" required />
            </div>
            <Button type="submit" className="w-full bg-white text-[#0b0f1a] hover:bg-zinc-100">Continue</Button>
          </form>
          <p className="text-center text-xs text-zinc-400">Prefer OTP? Just enter your email and we’ll send a code.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={openAuth === "signup"} onOpenChange={(o) => setOpenAuth(o ? "signup" : null)}>
        <DialogContent className="max-w-md border-white/10 bg-[#0b0f1a] text-zinc-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white"><UserPlus className="h-5 w-5"/> Create your account</DialogTitle>
            <DialogDescription>Start your premium trial. No credit card needed.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitSignup} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" placeholder="Ankur" className="bg-white/5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" placeholder="Rajauria" className="bg-white/5" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-signup">Work email</Label>
              <Input id="email-signup" type="email" placeholder="you@firm.com" className="bg-white/5" required />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 text-[#0b0f1a] hover:opacity-90">
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <p className="text-center text-xs text-zinc-400">By continuing, you agree to our Terms and Privacy Policy.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Small pieces ---
function NavLink({ children }: { children: React.ReactNode }) {
  return (
    <a className="text-sm text-zinc-300 transition hover:text-white" href="#">{children}</a>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Li({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-emerald-300">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-1 text-sm text-zinc-400">{text}</p>
    </div>
  );
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {/* soft grid */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"
      />
      {/* glow orbs */}
      <div className="absolute left-1/2 top-[-6rem] h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute right-10 top-10 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-6rem] left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
    </div>
  );
}