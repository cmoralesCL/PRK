
import * as React from 'react';
import { Panel } from '@/components/panel';
import { getDashboardData } from '@/app/actions';
import { parseISO, format } from 'date-fns';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default async function PanelPage({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || format(new Date(), 'yyyy-MM-dd');

  const { lifePrks, areaPrks, habitTasks, commitments } = await getDashboardData(selectedDate);

  return (
    <>
      <Header />
      <Panel
        lifePrks={lifePrks}
        areaPrks={areaPrks}
        habitTasks={habitTasks}
        commitments={commitments}
        initialSelectedDate={selectedDate}
      />
    </>
  );
}
