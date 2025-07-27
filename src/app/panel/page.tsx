
import * as React from 'react';
import { Panel } from '@/components/panel';
import { getDashboardData } from '@/app/actions';
import { parseISO, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function PanelPage({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || format(new Date(), 'yyyy-MM-dd');

  const { lifePrks, areaPrks, habitTasks, commitments } = await getDashboardData(selectedDate);

  return (
    <Panel
      lifePrks={lifePrks}
      areaPrks={areaPrks}
      habitTasks={habitTasks}
      commitments={commitments}
      initialSelectedDate={selectedDate}
    />
  );
}
