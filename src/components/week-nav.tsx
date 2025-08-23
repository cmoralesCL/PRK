'use client';

import { format, addDays, subDays, startOfWeek, isToday, isSameDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WeekNavProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeekNav({ selectedDate, onDateChange }: WeekNavProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Lunes
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => {
    onDateChange(subDays(selectedDate, 7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };

  const dayColors = [
    'bg-blue-50 text-blue-800',       // Lunes
    'bg-cyan-50 text-cyan-800',   // Martes
    'bg-teal-50 text-teal-800',   // Miércoles
    'bg-green-50 text-green-800', // Jueves
    'bg-amber-50 text-amber-800',     // Viernes
    'bg-orange-50 text-orange-800',   // Sábado
    'bg-red-50 text-red-800'  // Domingo
  ];
  const dayHoverColors = [
    'hover:bg-blue-100',
    'hover:bg-cyan-100',
    'hover:bg-teal-100',
    'hover:bg-green-100',
    'hover:bg-amber-100',
    'hover:bg-orange-100',
    'hover:bg-red-100',
  ];
  const daySelectedColors = [
      'bg-blue-500',
      'bg-cyan-500',
      'bg-teal-500',
      'bg-green-500',
      'bg-amber-500',
      'bg-orange-500',
      'bg-red-500'
  ]

  return (
    <div className="bg-card p-2 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-lg font-headline font-semibold capitalize">
          {format(selectedDate, 'LLLL yyyy', { locale: es })}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayIndex = getDay(day);
          const colorIndex = dayIndex === 0 ? 6 : dayIndex - 1;

          return (
            <button
              key={day.toString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 group",
                isSameDay(day, selectedDate)
                  ? `${daySelectedColors[colorIndex]} text-primary-foreground shadow-md`
                  : cn(
                      dayColors[colorIndex],
                      dayHoverColors[colorIndex],
                      "text-foreground/80"
                  ),
                isToday(day) && !isSameDay(day, selectedDate) && "border-2 border-primary/50"
              )}
            >
              <span className={cn(
                "text-xs uppercase font-medium", 
                isSameDay(day, selectedDate) ? "text-primary-foreground/80" : "opacity-70 group-hover:opacity-100"
              )}>
                {format(day, 'eee', { locale: es })}
              </span>
              <span className="text-lg font-bold mt-1">
                {format(day, 'd')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  );
}
