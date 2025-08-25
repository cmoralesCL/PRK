

import * as React from 'react';
import { getDashboardData } from '@/app/server/queries';
import { parseISO, format } from 'date-fns';
import { DayView } from '@/components/day-view';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { DailyProgressSnapshot } from '@/lib/types';

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
  
  // Fetch all dashboard data for the selected date. This now includes weekly and monthly progress.
  const { orbits, phases, pulses, commitments, weeklyProgress, monthlyProgress } = await getDashboardData(selectedDateString);

  // Derive the daily progress for the week from the main dashboard data for consistency.
  const totalWeight = pulses.reduce((sum, task) => {
    if (task.measurement_type === 'quantitative' && task.measurement_goal?.target_count) {
        return sum + task.weight;
    }
    return sum + task.weight;
  }, 0);

  const weightedCompleted = pulses.reduce((sum, task) => {
    if (task.measurement_type === 'quantitative' && task.measurement_goal?.target_count) {
        const progressPercentage = (task.current_progress_value ?? 0) / task.measurement_goal.target_count;
        return sum + (Math.min(progressPercentage, 1) * task.weight);
    }
    if (task.completedToday) {
        return sum + (1 * task.weight);
    }
    return sum;
  }, 0);

  const dailyProgress = totalWeight > 0 ? (weightedCompleted / totalWeight) * 100 : 0;

  // This is a simplified approach for the DayPage. A full week fetch might be needed if nav becomes complex.
  // For now, we only need the progress for the *selected* day to be accurate.
  const dailyProgressDataForWeek: DailyProgressSnapshot[] = [{
      snapshot_date: selectedDateString,
      progress: dailyProgress,
  }];


  return (
    <DayView
        orbits={orbits}
        phases={phases}
        pulses={pulses}
        commitments={commitments}
        initialSelectedDate={selectedDateString}
        dailyProgressDataForWeek={dailyProgressDataForWeek}
        weeklyProgress={weeklyProgress}
        monthlyProgress={monthlyProgress}
    />
  );
}
