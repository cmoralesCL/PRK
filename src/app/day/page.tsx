import * as React from 'react';
import { getDashboardData } from '@/app/server/queries';
import { parseISO, format } from 'date-fns';
import { Header } from '@/components/header';
import { DayView } from '@/components/day-view';

export const dynamic = 'force-dynamic';

export default async function DayPage({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || format(new Date(), 'yyyy-MM-dd');

  const { lifePrks, areaPrks, habitTasks, commitments } = await getDashboardData(selectedDate);

  return (
    <>
        <Header />
        <DayView
            lifePrks={lifePrks}
            areaPrks={areaPrks}
            habitTasks={habitTasks}
            commitments={commitments}
            initialSelectedDate={selectedDate}
        />
    </>
  );
}
