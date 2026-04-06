'use client';

import React from 'react';
import { ShowcaseSection } from '../shared/ShowcaseSection';
import { PULSE_CORRELATION_SHOWCASE } from '../constants/pulse';
import { PulseShowcaseCanvas } from './PulseShowcaseCanvas';

export function CorrelationShowcase() {
  return (
    <ShowcaseSection
      label={PULSE_CORRELATION_SHOWCASE.label}
      headline={PULSE_CORRELATION_SHOWCASE.headline}
      sub={PULSE_CORRELATION_SHOWCASE.sub}
      features={PULSE_CORRELATION_SHOWCASE.features}
      video={PULSE_CORRELATION_SHOWCASE.video}
      accentColor="blue"
      canvasOverride={<PulseShowcaseCanvas type="correlation" />}
    />
  );
}
