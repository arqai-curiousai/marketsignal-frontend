'use client';

import { ShowcaseSection } from '../shared/ShowcaseSection';
import { FOREX_HEATMAP_SHOWCASE } from '../constants/forex';

export function ForexHeatmapShowcase() {
  return (
    <ShowcaseSection
      label={FOREX_HEATMAP_SHOWCASE.label}
      headline={FOREX_HEATMAP_SHOWCASE.headline}
      sub={FOREX_HEATMAP_SHOWCASE.sub}
      features={FOREX_HEATMAP_SHOWCASE.features}
      video={FOREX_HEATMAP_SHOWCASE.video}
      mirror={false}
      accentColor="blue"
    />
  );
}
