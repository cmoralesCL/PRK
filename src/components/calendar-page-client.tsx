
'use client';

import { useState } from 'react';
import { CalendarView } from '@/components/calendar-view';
import { CommitmentsSidebar } from '@/components/commitments-sidebar';
import type { DailyProgressSnapshot, HabitTask, AreaPrk, WeeklyProgressSnapshot } from '@/lib/types';
import { cn } from '@/lib/utils';

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

export function CalendarPageClient({ initialData, initialMonthString, selectedDate }: CalendarPageClientProps) {
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
