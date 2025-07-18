'use client';

import { useState, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { AreaPrk, CalendarDataPoint, HabitTask, LifePrk } from '@/lib/types';
import { getDashboardData } from '@/app/server/queries';
import { addHabitTask, logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { Progress } from './ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';


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

  const [allAreaPrks, setAllAreaPrks] = useState<AreaPrk[]>([]);
  const [selectedAreaPrk, setSelectedAreaPrk] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useState(() => {
    async function fetchAreaPrks() {
        const { areaPrks } = await getDashboardData(new Date().toISOString().split('T')[0]);
        setAllAreaPrks(areaPrks);
        if(areaPrks.length > 0) {
            setSelectedAreaPrk(areaPrks[0].id);
        }
    }
    fetchAreaPrks();
  });

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

  const handleAddTask = () => {
    if(!newTaskTitle.trim() || !selectedAreaPrk) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un PRK de Área y escribe un título.' });
        return;
    }
    startTransition(async () => {
        try {
            await addHabitTask({
                areaPrkId: selectedAreaPrk,
                title: newTaskTitle,
                type: 'task',
                startDate: selectedDate.toISOString().split('T')[0]
            });
            setNewTaskTitle('');
            onDataChange();
             toast({ title: '¡Tarea Agregada!'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la tarea.' });
        }
    });
  }

  return (
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
            <h3 className="text-sm font-semibold text-muted-foreground">Agregar Nueva Tarea</h3>
             <Select value={selectedAreaPrk} onValueChange={setSelectedAreaPrk}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un PRK de Área" />
                </SelectTrigger>
                <SelectContent>
                    {allAreaPrks.map(ap => (
                        <SelectItem key={ap.id} value={ap.id}>{ap.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex gap-2">
                <Input 
                    placeholder="Título de la nueva tarea" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask} disabled={isPending || !newTaskTitle.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
