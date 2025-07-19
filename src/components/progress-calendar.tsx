
'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HabitTaskItem } from '@/components/habit-task-item';
import { cn } from '@/lib/utils';
import type { DailyProgressSnapshot, HabitTask, WeeklyProgressSnapshot } from '@/lib/types';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface ProgressCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  dailyProgressData: DailyProgressSnapshot[];
  habitTasksData: Record<string, HabitTask[]>;
  weeklyProgressData: WeeklyProgressSnapshot[];
  onDayClick: (date: Date) => void;
}

export function ProgressCalendar({ 
  currentMonth, 
  onMonthChange, 
  dailyProgressData, 
  habitTasksData, 
  weeklyProgressData,
  onDayClick,
}: ProgressCalendarProps) {
  const [view, setView] = useState<'month' | 'week'>('month');

  const changePeriod = (offset: number) => {
    const newDate = view === 'month' 
      ? (offset > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1))
      : (offset > 0 ? addWeeks(currentMonth, 1) : subWeeks(currentMonth, 1));
    onMonthChange(newDate);
  };

  const monthStart = startOfMonth(currentMonth);
  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });

  const days = view === 'month'
    ? eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const headerLabel = view === 'month' 
    ? format(currentMonth, 'LLLL yyyy', { locale: es }) 
    : `Semana del ${format(weekStart, 'd \'de\' LLLL', { locale: es })}`;

  const weeksInView: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeksInView.push(days.slice(i, i + 7));
  }


  return (
    <TooltipProvider>
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

        <div className="grid grid-cols-calendar-week-sm md:grid-cols-calendar-week-md gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
          {weekDays.map(day => <div key={day} className="hidden md:block">{day}</div>)}
          {weekDays.map(day => <div key={day + '-abbr'} className="block md:hidden">{day.substring(0,3)}</div>)}
          <div className="hidden md:block">Semana</div>
          <div className="block md:hidden">Sem</div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {weeksInView.map((week, weekIdx) => {
            const weekStartForProgress = format(week[0], 'yyyy-MM-dd');
            const weekProgress = weeklyProgressData.find(wp => wp.id === weekStartForProgress);

            return (
              <div key={weekIdx} className="grid grid-cols-calendar-week-sm md:grid-cols-calendar-week-md gap-2 items-stretch">
                {week.map(day => {
                  const dayString = format(day, 'yyyy-MM-dd');
                  const progressInfo = dailyProgressData.find(p => p.snapshot_date === dayString);
                  const tasks = habitTasksData[dayString] || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => onDayClick(day)}
                      className={cn(
                        "h-40 border rounded-lg p-2 flex flex-col cursor-pointer transition-colors hover:bg-accent/50",
                        !isCurrentMonth && view === 'month' && "bg-muted/30 text-muted-foreground",
                        isToday(day) && "border-primary border-2"
                      )}
                    >
                      <div className={cn("font-semibold")}>
                        {format(day, 'd')}
                      </div>
                      { (isCurrentMonth || view === 'week') && (
                        <div className="flex-grow overflow-y-auto mt-1 space-y-1 pr-1">
                           {progressInfo && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Progress value={progressInfo?.progress ?? 0} className="h-1.5 w-full" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {Math.round(progressInfo.progress)}%
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Progreso del día</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          {tasks.slice(0, 4).map(task => (
                            <HabitTaskItem key={task.id} item={task} selectedDate={day} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Weekly Progress Indicator */}
                <div className="h-40 border rounded-lg p-2 flex flex-col items-center justify-center bg-muted/20">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center">
                           <div className="text-xl font-bold font-headline">{Math.round(weekProgress?.progress ?? 0)}%</div>
                           <div className="text-xs text-muted-foreground">Progreso Semanal</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Promedio de la semana</p>
                      </TooltipContent>
                    </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
