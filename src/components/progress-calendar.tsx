
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, getDay, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HabitTaskItem } from '@/components/habit-task-item';
import { DayDetailDialog } from './day-detail-dialog';
import { cn } from '@/lib/utils';
import type { DailyProgressSnapshot, HabitTask } from '@/lib/types';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"


interface ProgressCalendarProps {
  initialMonth: Date;
  onMonthChange: (date: Date) => void;
  dailyProgressData: DailyProgressSnapshot[];
  habitTasksData: Record<string, HabitTask[]>;
}

export function ProgressCalendar({ initialMonth, onMonthChange, dailyProgressData, habitTasksData }: ProgressCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDetailOpen(true);
  };

  const changePeriod = (offset: number) => {
    const newDate = view === 'month' 
      ? (offset > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
      : (offset > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    setCurrentDate(newDate);
    onMonthChange(newDate);
  };

  const monthStart = startOfMonth(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const days = view === 'month'
    ? eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const headerLabel = view === 'month' 
    ? format(currentDate, 'LLLL yyyy', { locale: es }) 
    : `Semana del ${format(weekStart, 'd \'de\' LLLL', { locale: es })}`;


  return (
    <>
      <div className="p-4 sm:p-6 bg-card rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
           <h2 className="text-2xl font-bold font-headline capitalize text-center sm:text-left">
            {headerLabel}
          </h2>
          <div className="flex items-center gap-2">
             <ToggleGroup type="single" value={view} onValueChange={(value: 'month' | 'week') => value && setView(value)}>
              <ToggleGroupItem value="month" aria-label="Vista mensual">
                Mes
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Vista semanal">
                Semana
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="icon" onClick={() => changePeriod(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => changePeriod(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
          {weekDays.map(day => <div key={day} className="hidden md:block">{day}</div>)}
          {weekDays.map(day => <div key={day + '-abbr'} className="block md:hidden">{day.substring(0,3)}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            const progressInfo = dailyProgressData.find(p => p.snapshot_date === dayString);
            const tasks = habitTasksData[dayString] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-40 border rounded-lg p-2 flex flex-col cursor-pointer transition-colors hover:bg-accent/50",
                  !isCurrentMonth && view === 'month' && "bg-muted/30 text-muted-foreground",
                  isToday(day) && "bg-accent/80 border-primary"
                )}
              >
                <div className={cn("font-semibold", isToday(day) && "text-primary")}>
                  {format(day, 'd')}
                </div>
                { (isCurrentMonth || view === 'week') && (
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
