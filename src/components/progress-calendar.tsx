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
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, CheckSquare, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import type { CalendarDataPoint, HabitTask } from '@/lib/types';
import { getCalendarData, logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from './header';
import { useToast } from '@/hooks/use-toast';


interface ProgressCalendarProps {
  initialData: CalendarDataPoint[];
  initialDate: string;
}

export function ProgressCalendar({ initialData, initialDate }: ProgressCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => parseISO(initialDate));
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [data, setData] = useState<CalendarDataPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchNewData = (date: Date) => {
    startTransition(async () => {
      const newData = await getCalendarData(date);
      setData(newData);
    });
  };

  const handleToggleHabitTask = (id: string, completed: boolean, date: Date, type: 'habit' | 'task') => {
    const completionDate = date.toISOString().split('T')[0];
    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id, type, completionDate);
        } else {
          await removeHabitTaskCompletion(id, type, completionDate);
        }
        fetchNewData(currentDate); // Refetch data to update the view
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  }

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
    return new Map(data.map(d => [format(parseISO(d.date), 'yyyy-MM-dd'), { progress: d.progress, tasks: d.tasks }]));
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
      <TooltipProvider>
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
                const dayData = dataMap.get(format(day, 'yyyy-MM-dd'));
                const progress = dayData?.progress ?? 0;
                const tasks = dayData?.tasks ?? [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "border rounded-lg p-2 h-48 flex flex-col justify-start transition-colors",
                      isCurrentMonth || view === 'weekly'
                        ? "bg-background hover:bg-muted/50"
                        : "bg-muted/30 text-muted-foreground",
                      isToday && "border-primary ring-2 ring-primary"
                    )}
                  >
                    <span className={cn("font-semibold self-start", isToday && "text-primary")}>
                        {format(day, 'd')}
                    </span>
                    <div className="flex flex-col items-center gap-1.5 mt-1 w-full">
                      <span className="text-xs font-mono">{progress.toFixed(0)}%</span>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <ScrollArea className="flex-grow mt-2 -mx-2 px-2">
                      <div className="space-y-1.5">
                        {tasks.map(task => {
                           const Icon = task.type === 'habit' ? Repeat : CheckSquare;
                           return(
                            <Tooltip key={task.id} delayDuration={300}>
                               <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 p-1 rounded-md bg-secondary/50">
                                      <Checkbox
                                        id={`cal-${task.id}-${format(day, 'yyyy-MM-dd')}`}
                                        checked={task.completedToday}
                                        onCheckedChange={(checked) => handleToggleHabitTask(task.id, !!checked, day, task.type)}
                                        className="h-3.5 w-3.5"
                                      />
                                      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <p className="text-xs text-secondary-foreground truncate flex-grow">{task.title}</p>
                                  </div>
                                </TooltipTrigger>
                               <TooltipContent>
                                <p>{task.title}</p>
                              </TooltipContent>
                            </Tooltip>
                           )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </>
  );
}
