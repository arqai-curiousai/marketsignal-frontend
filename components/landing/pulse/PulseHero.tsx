'use client';

import { LandingHero } from '../shared/LandingHero';
import { PULSE_HERO } from '../constants/pulse';
import { GlobeCanvas } from './GlobeCanvas';

export function PulseHero() {
  return (
    <LandingHero
      badge="AI News Intelligence"
      headlineBold={PULSE_HERO.headlineBold}
      headlineSerif={PULSE_HERO.headlineSerif}
      sub={PULSE_HERO.sub}
      primaryCta={PULSE_HERO.primaryCta}
      secondaryCta={PULSE_HERO.secondaryCta}
      video={PULSE_HERO.video}
      blobColors={[
        'bg-brand-emerald/[0.04]',
        'bg-brand-amber/[0.03]',
        'bg-brand-blue/[0.02]',
      ]}
      accentColor="emerald"
      socialProof="25 news sources · 6 global regions"
      canvasOverride={<GlobeCanvas />}
      splitLayout
    />
  );
}
