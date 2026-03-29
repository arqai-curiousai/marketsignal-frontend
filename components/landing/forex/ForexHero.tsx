'use client';

import { LandingHero } from '../shared/LandingHero';
import { FOREX_HERO } from '../constants/forex';

export function ForexHero() {
  return (
    <LandingHero
      headlineBold={FOREX_HERO.headlineBold}
      headlineSerif={FOREX_HERO.headlineSerif}
      sub={FOREX_HERO.sub}
      primaryCta={FOREX_HERO.primaryCta}
      secondaryCta={FOREX_HERO.secondaryCta}
      video={FOREX_HERO.video}
      blobColors={[
        'bg-brand-blue/[0.05]',
        'bg-sky-400/[0.04]',
        'bg-brand-emerald/[0.03]',
      ]}
      accentColor="blue"
    />
  );
}
