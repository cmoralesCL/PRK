'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
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
import { addHabitTask, logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { Progress } from './ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import { HabitTaskDialog, type HabitTaskFormValues } from './habit-task-dialog';

interface DayDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dayData: CalendarDataPoint;
  onDataChange: () => void;
}

export function DayDetailDialog({ isOpen, onOpenChange, dayData, onDataChange }: DayDetailDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const selectedDate = useMemo(() => new Date(dayData.date), [dayData.date]);
  
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);


  const handleToggle = (id: string, completed: boolean, date: Date) => {
    const task = dayData.tasks.find(t => t.id === id);
    if (!task) return;
    
    startTransition(async () => {
        try {
            if (completed) {
                await logHabitTaskCompletion(id, task.type, date.toISOString().split('T')[0]);
            } else {
                await removeHabitTaskCompletion(id, task.type, date.toISOString().split('T')[0]);
            }
            onDataChange();
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la tarea.' });
        }
    });
  };

  const handleSaveHabitTask = (values: HabitTaskFormValues, areaPrkId: string) => {
    startTransition(async () => {
        try {
            const habitTaskData: Partial<HabitTask> = {
                areaPrkId: areaPrkId,
                title: values.title,
                type: values.type,
                startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : undefined,
                dueDate: values.dueDate ? values.dueDate.toISOString().split('T')[0] : undefined,
                frequency: values.frequency,
                frequencyDays: values.frequencyDays,
            };

            await addHabitTask(habitTaskData);
            toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
            onDataChange();
            
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción.' });
        }
    });
  };

  const handleOpenAddDialog = () => {
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                  {isPending ? (
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
        onSave={handleSaveHabitTask}
        habitTask={editingHabitTask}
        defaultDate={selectedDate}
      />
    </>
  );
}
