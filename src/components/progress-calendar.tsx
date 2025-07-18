'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CalendarDataPoint } from '@/lib/types';
import { getCalendarData } from '@/app/actions';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from './header';


interface ProgressCalendarProps {
  initialData: CalendarDataPoint[];
  initialDate: Date;
}

export function ProgressCalendar({ initialData, initialDate }: ProgressCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [data, setData] = useState<CalendarDataPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const fetchNewData = (date: Date) => {
    startTransition(async () => {
      const newData = await getCalendarData(date);
      setData(newData);
    });
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    fetchNewData(newDate);
  }

  const handlePrev = () => {
    const newDate = view === 'monthly' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1);
    handleDateChange(newDate);
  };
  
  const handleNext = () => {
    const newDate = view === 'monthly' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1);
    handleDateChange(newDate);
  };

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const startDate = view === 'monthly' ? startOfWeek(monthStart, { weekStartsOn: 1 }) : weekStart;
    const endDate = view === 'monthly' ? endOfWeek(monthEnd, { weekStartsOn: 1 }) : weekEnd;
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate, view]);

  const dataMap = useMemo(() => {
    return new Map(data.map(d => [format(d.date, 'yyyy-MM-dd'), d.progress]));
  }, [data]);
  
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <>
      <Header
        onAddLifePrk={() => {}}
        selectedDate={new Date()}
        onDateChange={() => {}}
        hideDatePicker
        hideAddButton
      />
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="font-headline text-2xl">Calendario de Progreso</CardTitle>
                  <p className="text-muted-foreground">Una vista general de tu consistencia.</p>
              </div>
              <Tabs defaultValue="monthly" onValueChange={(value) => setView(value as 'monthly' | 'weekly')}>
                <TabsList>
                  <TabsTrigger value="monthly">Mensual</TabsTrigger>
                  <TabsTrigger value="weekly">Semanal</TabsTrigger>
                </TabsList>
              </Tabs>
          </div>
          <div className="flex items-center justify-center gap-4 pt-4 relative">
            <Button variant="outline" size="icon" onClick={handlePrev} disabled={isPending}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold text-center w-64">
              {format(currentDate, view === 'monthly' ? 'MMMM yyyy' : "'Semana del' d MMMM", { locale: es })}
            </h3>
            <Button variant="outline" size="icon" onClick={handleNext} disabled={isPending}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {isPending && <Loader2 className="h-5 w-5 animate-spin absolute right-0" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
            {weekDays.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {days.map(day => {
              const progress = dataMap.get(format(day, 'yyyy-MM-dd')) ?? 0;
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border rounded-lg p-2 h-28 flex flex-col justify-between transition-colors",
                    isCurrentMonth || view === 'weekly'
                      ? "bg-background hover:bg-muted/50"
                      : "bg-muted/30 text-muted-foreground",
                    isToday && "border-primary ring-2 ring-primary"
                  )}
                >
                  <span className={cn("font-semibold", isToday && "text-primary")}>
                      {format(day, 'd')}
                  </span>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-mono">{progress.toFixed(0)}%</span>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
