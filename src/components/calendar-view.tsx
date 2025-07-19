
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { Header } from '@/components/header';
import { ProgressCalendar } from '@/components/progress-calendar';
import type { DailyProgressSnapshot, HabitTask } from '@/lib/types';

interface CalendarViewProps {
    initialMonth: Date;
    dailyProgressData: DailyProgressSnapshot[];
    habitTasksData: Record<string, HabitTask[]>;
}

export function CalendarView({ initialMonth, dailyProgressData, habitTasksData }: CalendarViewProps) {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(initialMonth);

    const handleMonthChange = (newMonth: Date) => {
        setCurrentMonth(newMonth);
        router.push(`/calendar?month=${format(newMonth, 'yyyy-MM')}`);
    }

    return (
        <>
            <Header 
                onAddLifePrk={() => {}} 
                selectedDate={new Date()} 
                onDateChange={() => {}} 
                hideAddButton={true} 
                hideDatePicker={true} 
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProgressCalendar
                  initialMonth={currentMonth}
                  onMonthChange={handleMonthChange}
                  dailyProgressData={dailyProgressData}
                  habitTasksData={habitTasksData}
                />
            </main>
        </>
    );
}
