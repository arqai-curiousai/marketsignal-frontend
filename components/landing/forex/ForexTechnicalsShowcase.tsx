'use client';

import { ShowcaseSection } from '../shared/ShowcaseSection';
import { FOREX_TECHNICALS_SHOWCASE } from '../constants/forex';

export function ForexTechnicalsShowcase() {
  return (
    <ShowcaseSection
      label={FOREX_TECHNICALS_SHOWCASE.label}
      headline={FOREX_TECHNICALS_SHOWCASE.headline}
      sub={FOREX_TECHNICALS_SHOWCASE.sub}
      features={FOREX_TECHNICALS_SHOWCASE.features}
      video={FOREX_TECHNICALS_SHOWCASE.video}
      mirror={false}
      accentColor="amber"
    />
  );
}
