'use client';

import { ShowcaseSection } from '../shared/ShowcaseSection';
import { FOREX_STRENGTH_SHOWCASE } from '../constants/forex';

export function ForexStrengthShowcase() {
  return (
    <ShowcaseSection
      label={FOREX_STRENGTH_SHOWCASE.label}
      headline={FOREX_STRENGTH_SHOWCASE.headline}
      sub={FOREX_STRENGTH_SHOWCASE.sub}
      features={FOREX_STRENGTH_SHOWCASE.features}
      video={FOREX_STRENGTH_SHOWCASE.video}
      mirror={true}
      accentColor="emerald"
    />
  );
}
