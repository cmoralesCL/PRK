

import * as React from 'react';
import { getDashboardData } from '@/app/server/queries';
import { parseISO, format } from 'date-fns';
import { DayView } from '@/components/day-view';
import type { DailyProgressSnapshot } from '@/lib/types';
// import { getQuoteOfTheDay } from '@/ai/flows/get-quote-of-the-day';

export const dynamic = 'force-dynamic';

export default async function DayPage({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDateString = searchParams.date || format(new Date(), 'yyyy-MM-dd');
  
  const { orbits, phases, pulses, commitments, weeklyProgress, monthlyProgress } = await getDashboardData(selectedDateString);
  // const quoteData = await getQuoteOfTheDay();

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
        // quote={quoteData}
    />
  );
}
