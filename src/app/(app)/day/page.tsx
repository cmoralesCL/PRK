

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

  // Fetch progress data for the entire week to display in the WeekNav
  const supabase = createClient();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const { data: dailyProgressDataForWeek, error } = await supabase
    .from('daily_progress_snapshots_new')
    .select('snapshot_date, progress')
    .eq('user_id', userId)
    .gte('snapshot_date', format(weekStart, 'yyyy-MM-dd'))
    .lte('snapshot_date', format(weekEnd, 'yyyy-MM-dd'));

  if (error) {
    console.error("Error fetching weekly progress data:", error);
  }

  return (
    <DayView
        lifePrks={lifePrks}
        areaPrks={areaPrks}
        habitTasks={habitTasks}
        commitments={commitments}
        initialSelectedDate={selectedDateString}
        dailyProgressDataForWeek={dailyProgressDataForWeek || []}
    />
  );
}
