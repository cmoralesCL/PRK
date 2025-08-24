
import * as React from 'react';
import { Panel } from '@/components/panel';
import { getPanelData } from '@/app/server/queries';

export const dynamic = 'force-dynamic';

export default async function PanelPage() {
  // Fetch data specifically for the strategic panel view, without date filtering.
  const { lifePrks, areaPrks, allHabitTasks } = await getPanelData();

  return (
    <Panel
      lifePrks={lifePrks}
      areaPrks={areaPrks}
      allHabitTasks={allHabitTasks}
    />
  );
}
