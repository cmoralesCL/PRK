
import * as React from 'react';
import { Panel } from '@/components/panel';
import { getPanelData } from '@/app/server/queries';

export const dynamic = 'force-dynamic';

export default async function PanelPage() {
  // Fetch data specifically for the strategic panel view, without date filtering.
  const { lifePrks: orbits, areaPrks: phases, allHabitTasks: allPulses } = await getPanelData();

  return (
    <Panel
      orbits={orbits}
      phases={phases}
      allPulses={allPulses}
    />
  );
}
