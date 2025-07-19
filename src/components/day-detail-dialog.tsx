
'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HabitTaskListItem } from './habit-task-list-item';
import type { HabitTask } from '@/lib/types';
import { logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface DayDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  day: Date | null;
  tasks: HabitTask[];
  onAddTask: (date: Date) => void;
  onEditTask: (task: HabitTask, date: Date) => void;
  onArchiveTask: (id: string, date: Date) => void;
}

export function DayDetailDialog({ isOpen, onOpenChange, day, tasks, onAddTask, onEditTask, onArchiveTask }: DayDetailDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  if (!day) return null;

  const handleToggleHabitTask = (id: string, completed: boolean) => {
    const task = tasks.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = day.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id, task.type, completionDate);
        } else {
          await removeHabitTaskCompletion(id, task.type, completionDate);
        }
        toast({ title: completed ? '¡Acción completada!' : 'Completado deshecho.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleEdit = (task: HabitTask) => {
    onEditTask(task, day);
  }

  const handleArchive = (id: string) => {
    onArchiveTask(id, day);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Tareas del {format(day, "d 'de' LLLL", { locale: es })}
          </DialogTitle>
          <DialogDescription>
            Este es tu plan para hoy. ¡A por ello!
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 pr-4 -mx-2">
            <div className="space-y-2 p-2">
                {tasks.length > 0 ? tasks.map((task) => (
                    <HabitTaskListItem 
                        key={task.id} 
                        item={task} 
                        onToggle={(id, completed) => handleToggleHabitTask(id, completed)}
                        onEdit={handleEdit}
                        onArchive={handleArchive}
                        selectedDate={day}
                        variant="dialog"
                    />
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay tareas programadas para este día.</p>
                )}
            </div>
        </ScrollArea>
        <DialogFooter>
            <Button onClick={() => onAddTask(day)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Acción
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
