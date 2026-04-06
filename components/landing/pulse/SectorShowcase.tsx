'use client';

import React from 'react';
import { ShowcaseSection } from '../shared/ShowcaseSection';
import { PULSE_SECTOR_SHOWCASE } from '../constants/pulse';
import { PulseShowcaseCanvas } from './PulseShowcaseCanvas';

export function SectorShowcase() {
  return (
    <ShowcaseSection
      label={PULSE_SECTOR_SHOWCASE.label}
      headline={PULSE_SECTOR_SHOWCASE.headline}
      sub={PULSE_SECTOR_SHOWCASE.sub}
      features={PULSE_SECTOR_SHOWCASE.features}
      video={PULSE_SECTOR_SHOWCASE.video}
      mirror
      accentColor="emerald"
      canvasOverride={<PulseShowcaseCanvas type="sectors" />}
    />
  );
}
