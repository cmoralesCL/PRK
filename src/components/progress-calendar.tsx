
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HabitTaskItem } from '@/components/habit-task-item';
import { DayDetailDialog } from './day-detail-dialog';
import { cn } from '@/lib/utils';
import type { DailyProgressSnapshot, HabitTask } from '@/lib/types';

interface ProgressCalendarProps {
  initialMonth: Date;
  dailyProgressData: DailyProgressSnapshot[];
  habitTasksData: Record<string, HabitTask[]>;
}

export function ProgressCalendar({ initialMonth, dailyProgressData, habitTasksData }: ProgressCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialMonth));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const router = useRouter();

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDetailOpen(true);
  };

  const changeMonth = (offset: number) => {
    const newMonth = offset > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    router.push(`/calendar?month=${format(newMonth, 'yyyy-MM')}`);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <>
      <div className="p-4 sm:p-6 bg-card rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: es })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
          {weekDays.map(day => <div key={day}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            const progressInfo = dailyProgressData.find(p => p.snapshot_date === dayString);
            const tasks = habitTasksData[dayString] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-40 border rounded-lg p-2 flex flex-col cursor-pointer transition-colors hover:bg-accent/50",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isToday(day) && "bg-accent/80 border-primary"
                )}
              >
                <div className={cn("font-semibold", isToday(day) && "text-primary")}>
                  {format(day, 'd')}
                </div>
                {isCurrentMonth && (
                  <div className="flex-grow overflow-y-auto mt-1 space-y-1 pr-1">
                     <Progress value={progressInfo?.progress ?? 0} className="h-1.5" />
                    {tasks.slice(0, 4).map(task => (
                      <HabitTaskItem key={task.id} item={task} selectedDate={day} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <DayDetailDialog 
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
        day={selectedDay}
        tasks={selectedDay ? habitTasksData[format(selectedDay, 'yyyy-MM-dd')] || [] : []}
      />
    </>
  );
}
