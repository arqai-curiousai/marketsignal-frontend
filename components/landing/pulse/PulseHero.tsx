'use client';

import { LandingHero } from '../shared/LandingHero';
import { PULSE_HERO } from '../constants/pulse';

export function PulseHero() {
  return (
    <LandingHero
      headlineBold={PULSE_HERO.headlineBold}
      headlineSerif={PULSE_HERO.headlineSerif}
      sub={PULSE_HERO.sub}
      primaryCta={PULSE_HERO.primaryCta}
      secondaryCta={PULSE_HERO.secondaryCta}
      video={PULSE_HERO.video}
      blobColors={[
        'bg-brand-emerald/[0.05]',
        'bg-brand-amber/[0.04]',
        'bg-brand-blue/[0.03]',
      ]}
      accentColor="emerald"
    />
  );
}
