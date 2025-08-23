

import * as React from 'react';
import { getDashboardData } from '@/app/server/queries';
import { parseISO, format, startOfWeek, endOfWeek } from 'date-fns';
import { DayView } from '@/components/day-view';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getUserIdAndDate(searchParams: { date?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const selectedDateString = searchParams.date || format(new Date(), 'yyyy-MM-dd');
    const selectedDate = parseISO(selectedDateString);

    return { userId: user.id, selectedDate, selectedDateString };
}

export default async function DayPage({ searchParams }: { searchParams: { date?: string } }) {
  const { userId, selectedDate, selectedDateString } = await getUserIdAndDate(searchParams);
  
  const { lifePrks, areaPrks, habitTasks, commitments } = await getDashboardData(selectedDateString);

  // The weekly progress data will now be calculated on the client inside DayView
  // based on the already fetched data, removing the need for this extra query.

  return (
    <DayView
        lifePrks={lifePrks}
        areaPrks={areaPrks}
        habitTasks={habitTasks}
        commitments={commitments}
        initialSelectedDate={selectedDateString}
    />
  );
}
