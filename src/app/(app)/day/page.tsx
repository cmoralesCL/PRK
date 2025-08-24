

import * as React from 'react';
import { getDashboardData, getCalendarData } from '@/app/server/queries';
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
  
  const { orbits, phases, pulses, commitments } = await getDashboardData(selectedDateString);

  // Fetch the progress for the entire week to display in the WeekNav component.
  const calendarDataForWeek = await getCalendarData(selectedDate);
  const dailyProgressDataForWeek = calendarDataForWeek.dailyProgress;

  return (
    <DayView
        orbits={orbits}
        phases={phases}
        pulses={pulses}
        commitments={commitments}
        initialSelectedDate={selectedDateString}
        dailyProgressDataForWeek={dailyProgressDataForWeek}
    />
  );
}
