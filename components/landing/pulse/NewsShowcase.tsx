'use client';

import React from 'react';
import { ShowcaseSection } from '../shared/ShowcaseSection';
import { PULSE_NEWS_SHOWCASE } from '../constants/pulse';
import { PulseShowcaseCanvas } from './PulseShowcaseCanvas';

export function NewsShowcase() {
  return (
    <ShowcaseSection
      label={PULSE_NEWS_SHOWCASE.label}
      headline={PULSE_NEWS_SHOWCASE.headline}
      sub={PULSE_NEWS_SHOWCASE.sub}
      features={PULSE_NEWS_SHOWCASE.features}
      video={PULSE_NEWS_SHOWCASE.video}
      accentColor="emerald"
      canvasOverride={<PulseShowcaseCanvas type="news" />}
    />
  );
}
