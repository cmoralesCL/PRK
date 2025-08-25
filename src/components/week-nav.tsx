
'use client';

import { format, addDays, subDays, startOfWeek, isToday, isSameDay, getDay, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DailyProgressSnapshot } from '@/lib/types';
import { Progress } from './ui/progress';

interface WeekNavProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  dailyProgressData: Pick<DailyProgressSnapshot, 'snapshot_date' | 'progress'>[];
}

export function WeekNav({ selectedDate, onDateChange, dailyProgressData = [] }: WeekNavProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => {
    onDateChange(subDays(selectedDate, 7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };
  
  const weekRangeLabel = `${format(weekStart, 'd')}–${format(weekEnd, 'd MMM', { locale: es })}`;

  const progressMap = new Map(dailyProgressData.map(p => [p.snapshot_date, p.progress]));

  return (
    <div className="bg-card p-2 rounded-xl">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-headline font-bold">
          Mi Día
        </h3>
        <div className="flex items-center gap-2">
           <span className="text-sm font-semibold text-primary">{weekRangeLabel}</span>
           <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayProgress = progressMap.get(format(day, 'yyyy-MM-dd'));
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div key={day.toString()} className="text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                    {format(day, 'eee', { locale: es })}
                </span>
                <button
                    onClick={() => onDateChange(day)}
                    className={cn(
                        "mt-2 w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background h-20",
                        isSelected
                        ? "bg-gradient-to-br from-primary to-cyan-400 text-primary-foreground shadow-lg"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                    >
                    <span className="text-2xl font-bold">
                        {format(day, 'd')}
                    </span>
                    <Progress 
                        value={dayProgress} 
                        className="h-1.5 mt-2 w-4/5" 
                        indicatorClassName={isSelected ? 'bg-white/80' : 'bg-primary'}
                    />
                </button>
            </div>
          )
        })}
      </div>
    </div>
  );
}
