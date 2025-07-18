'use client';

import { useState, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { CalendarDataPoint, HabitTask } from '@/lib/types';
import { logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { Progress } from './ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import { HabitTaskDialog, type HabitTaskFormValues } from './habit-task-dialog';
import { getCalendarData } from '@/app/actions';

interface DayDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dayData: CalendarDataPoint;
  onDataChange: () => void;
}

export function DayDetailDialog({ isOpen, onOpenChange, dayData: initialDayData, onDataChange }: DayDetailDialogProps) {
  const [dayData, setDayData] = useState(initialDayData);
  const [isToggling, startToggleTransition] = useTransition();
  const { toast } = useToast();
  const selectedDate = useMemo(() => new Date(dayData.date), [dayData.date]);
  
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);

  // Update local state if initial data changes
  useState(() => {
    setDayData(initialDayData);
  }, [initialDayData]);

  const refreshData = async () => {
    const newCalendarData = await getCalendarData(selectedDate);
    const updatedDayData = newCalendarData.find(d => new Date(d.date).toDateString() === selectedDate.toDateString());
    if (updatedDayData) {
        setDayData(updatedDayData);
    }
    onDataChange();
  }


  const handleToggle = (id: string, completed: boolean, date: Date) => {
    const task = dayData.tasks.find(t => t.id === id);
    if (!task) return;
    
    startToggleTransition(async () => {
        try {
            if (completed) {
                await logHabitTaskCompletion(id, task.type, date.toISOString().split('T')[0]);
            } else {
                await removeHabitTaskCompletion(id, task.type, date.toISOString().split('T')[0]);
            }
            await refreshData();
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la tarea.' });
        }
    });
  };

  const handleOpenAddDialog = () => {
    setHabitTaskDialogOpen(true);
  }

  const handleDialogClose = (open: boolean) => {
    if(!open) {
        onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">
              {format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}
            </DialogTitle>
            <DialogDescription>
              Progreso del día: {dayData.progress.toFixed(0)}%
            </DialogDescription>
            <Progress value={dayData.progress} className="h-2" />
          </DialogHeader>
          
          <div className="py-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Acciones del Día</h3>
              <ScrollArea className="h-64 pr-4 border-b">
                  <div className="space-y-2">
                  {isToggling ? (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                  ) : dayData.tasks.length > 0 ? (
                      dayData.tasks.map((task) => (
                          <HabitTaskListItem 
                              key={task.id} 
                              item={task} 
                              onToggle={handleToggle}
                              selectedDate={selectedDate}
                              variant="calendar" 
                          />
                      ))
                  ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No hay acciones para este día.</p>
                  )}
                  </div>
              </ScrollArea>
          </div>

          <div className="space-y-2">
              <Button onClick={handleOpenAddDialog} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Hábito o Tarea
              </Button>
          </div>

        </DialogContent>
      </Dialog>

      <HabitTaskDialog 
        isOpen={isHabitTaskDialogOpen}
        onOpenChange={setHabitTaskDialogOpen}
        onSave={async () => {
            setHabitTaskDialogOpen(false);
            await refreshData();
        }}
        habitTask={null}
        defaultDate={selectedDate}
      />
    </>
  );
}
