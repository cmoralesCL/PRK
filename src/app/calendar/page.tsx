
'use client';

import { useState } from 'react';
import { getCalendarData } from '@/app/actions';
import { CalendarView } from '@/components/calendar-view';
import { CommitmentsSidebar } from '@/components/commitments-sidebar';
import { format } from 'date-fns';
import type { DailyProgressSnapshot, HabitTask, AreaPrk, WeeklyProgressSnapshot } from '@/lib/types';


interface CalendarPageClientProps {
    initialData: {
        dailyProgress: DailyProgressSnapshot[];
        habitTasks: Record<string, HabitTask[]>;
        areaPrks: AreaPrk[];
        weeklyProgress: WeeklyProgressSnapshot[];
        commitments: HabitTask[];
    };
    initialMonthString: string;
    selectedDate: Date;
}

function CalendarPageClient({ initialData, initialMonthString, selectedDate }: CalendarPageClientProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex flex-1">
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CalendarView
                    initialMonthString={initialMonthString}
                    dailyProgressData={initialData.dailyProgress}
                    habitTasksData={initialData.habitTasks}
                    areaPrks={initialData.areaPrks || []}
                    weeklyProgressData={initialData.weeklyProgress || []}
                />
            </main>
            <aside className={cn("hidden lg:block bg-card/50 border-l p-4 transition-all duration-300 ease-in-out", isSidebarOpen ? 'w-96' : 'w-20')}>
                <CommitmentsSidebar
                    commitments={initialData.commitments || []}
                    selectedDate={selectedDate}
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                />
            </aside>
        </div>
    );
}


export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const selectedDate = searchParams.month ? new Date(searchParams.month) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const initialData = await getCalendarData(selectedDate);
  const initialMonthString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <CalendarPageClient 
        initialData={initialData}
        initialMonthString={initialMonthString}
        selectedDate={selectedDate}
    />
  );
}
