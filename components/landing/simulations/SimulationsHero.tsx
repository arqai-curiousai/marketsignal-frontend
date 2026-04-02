'use client';

import { LandingHero } from '../shared/LandingHero';
import { SIM_HERO } from '../constants/simulations';

export function SimulationsHero() {
  return (
    <LandingHero
      badge="Simulation Lab"
      headlineBold={SIM_HERO.headlineBold}
      headlineSerif={SIM_HERO.headlineSerif}
      sub={SIM_HERO.sub}
      primaryCta={SIM_HERO.primaryCta}
      secondaryCta={SIM_HERO.secondaryCta}
      video={SIM_HERO.video}
      blobColors={[
        'bg-brand-violet/[0.04]',
        'bg-indigo-400/[0.03]',
        'bg-brand-blue/[0.02]',
      ]}
      accentColor="violet"
      socialProof="Monte Carlo \u00B7 Portfolio Optimizer \u00B7 Free"
    />
  );
}
