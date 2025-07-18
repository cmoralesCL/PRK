'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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
import type { AreaPrk, CalendarDataPoint } from '@/lib/types';
import { logHabitTaskCompletion, removeHabitTaskCompletion, addHabitTask } from '@/app/actions';
import { Progress } from './ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import { HabitTaskDialog, type HabitTaskFormValues } from './habit-task-dialog';
import { getCalendarData } from '@/app/actions';

interface DayDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dayData: CalendarDataPoint;
  onDataChange: () => void;
  areaPrks: AreaPrk[];
}

export function DayDetailDialog({ isOpen, onOpenChange, dayData, onDataChange, areaPrks }: DayDetailDialogProps) {
  const [currentDayData, setCurrentDayData] = useState(dayData);
  const [isToggling, startToggleTransition] = useTransition();
  const { toast } = useToast();
  const selectedDate = useMemo(() => new Date(dayData.date), [dayData.date]);
  
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentDayData(dayData);
  }, [dayData]);


  const refreshData = async () => {
    const newCalendarData = await getCalendarData(selectedDate);
    const updatedDayData = newCalendarData.find(d => new Date(d.date).toDateString() === selectedDate.toDateString());
    if (updatedDayData) {
        setCurrentDayData(updatedDayData);
    }
    onDataChange();
  }


  const handleToggle = (id: string, completed: boolean) => {
    const task = currentDayData.tasks.find(t => t.id === id);
    if (!task) return;
    
    startToggleTransition(async () => {
        try {
            if (completed) {
                await logHabitTaskCompletion(id, task.type, selectedDate.toISOString().split('T')[0]);
            } else {
                await removeHabitTaskCompletion(id, task.type, selectedDate.toISOString().split('T')[0]);
            }
            // Optimistically update UI
            const updatedTasks = currentDayData.tasks.map(t => 
              t.id === id ? { ...t, completedToday: completed } : t
            );
            setCurrentDayData(prev => ({ ...prev, tasks: updatedTasks }));
            // Then refresh from server
            await refreshData();
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la tarea.' });
        }
    });
  };

  const handleOpenAddDialog = () => {
    setHabitTaskDialogOpen(true);
  }

  const handleSaveHabitTask = (values: HabitTaskFormValues, areaPrkId: string) => {
    startToggleTransition(async () => {
        try {
            const habitTaskData = {
                title: values.title,
                type: values.type,
                areaPrkId: areaPrkId,
                startDate: (values.startDate ?? selectedDate).toISOString().split('T')[0],
                dueDate: values.dueDate ? values.dueDate.toISOString().split('T')[0] : undefined,
                frequency: values.frequency,
                frequencyDays: values.frequencyDays,
            };
            await addHabitTask(habitTaskData);
            toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
            await refreshData();
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción.' });
        }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">
              {format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}
            </DialogTitle>
            <DialogDescription>
              Progreso del día: {currentDayData.progress.toFixed(0)}%
            </DialogDescription>
            <Progress value={currentDayData.progress} />
          </DialogHeader>
          
          <div className="py-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Acciones del Día</h3>
              <ScrollArea className="h-64 pr-4 border-b">
                  <div className="space-y-2">
                  {isToggling ? (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                  ) : currentDayData.tasks.length > 0 ? (
                      currentDayData.tasks.map((task) => (
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
        onSave={(values, areaPrkId) => {
            setHabitTaskDialogOpen(false);
            handleSaveHabitTask(values, areaPrkId);
        }}
        habitTask={null}
        defaultDate={selectedDate}
        areaPrks={areaPrks}
      />
    </>
  );
}
