'use client';

import { LandingHero } from '../shared/LandingHero';
import { FOREX_HERO } from '../constants/forex';
import { ForexConstellationCanvas } from './ForexConstellationCanvas';

export function ForexHero() {
  return (
    <LandingHero
      badge="AI-Powered Forex Analytics"
      headlineBold={FOREX_HERO.headlineBold}
      headlineSerif={FOREX_HERO.headlineSerif}
      sub={FOREX_HERO.sub}
      primaryCta={FOREX_HERO.primaryCta}
      secondaryCta={FOREX_HERO.secondaryCta}
      video={FOREX_HERO.video}
      blobColors={[
        'bg-brand-blue/[0.04]',
        'bg-sky-400/[0.03]',
        'bg-brand-emerald/[0.02]',
      ]}
      accentColor="blue"
      socialProof="Free forever &middot; No credit card required"
      canvasOverride={<ForexConstellationCanvas />}
      splitLayout
    />
  );
}
