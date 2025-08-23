'use client';

import { format, addDays, subDays, startOfWeek, isToday, isSameDay, getDay } from 'fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
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
    'bg-blue-100 text-blue-900',       // Lunes
    'bg-cyan-100 text-cyan-900',       // Martes
    'bg-teal-100 text-teal-900',       // Miércoles
    'bg-green-100 text-green-900',     // Jueves
    'bg-purple-100 text-purple-900',     // Viernes
    'bg-orange-100 text-orange-900',   // Sábado (Pastel)
    'bg-red-100 text-red-900'          // Domingo
  ];
  const dayHoverColors = [
    'hover:bg-blue-200/70',
    'hover:bg-cyan-200/70',
    'hover:bg-teal-200/70',
    'hover:bg-green-200/70',
    'hover:bg-purple-200/70',
    'hover:bg-orange-200/70',
    'hover:bg-red-200/70',
  ];
  const daySelectedColors = [
      'bg-blue-500 text-white',
      'bg-cyan-500 text-white',
      'bg-teal-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-orange-500 text-white',
      'bg-red-500 text-white'
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
          const colorIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Domingo es 0, lo mapeamos al final del array

          return (
            <button
              key={day.toString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                isSameDay(day, selectedDate)
                  ? `${daySelectedColors[colorIndex]} shadow-md scale-105`
                  : cn(
                      dayColors[colorIndex],
                      dayHoverColors[colorIndex],
                      "hover:scale-105 hover:shadow-md"
                  ),
              )}
            >
              {isToday(day) && (
                <Star className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              )}
              <span className={cn(
                "text-xs uppercase font-medium", 
                isSameDay(day, selectedDate) ? "text-white/80" : "opacity-70 group-hover:opacity-100"
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
