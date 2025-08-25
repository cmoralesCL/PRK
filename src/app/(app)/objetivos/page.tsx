
import * as React from 'react';
import { ObjetivosPanel } from '@/components/objetivos-panel';
import { getPanelData } from '@/app/server/queries';

export const dynamic = 'force-dynamic';

export default async function ObjetivosPage() {
  // Fetch data specifically for the strategic panel view, without date filtering.
  const { orbits, phases, allPulses } = await getPanelData();

  return (
    <ObjetivosPanel
      orbits={orbits}
      phases={phases}
      allPulses={allPulses}
    />
  );
}
