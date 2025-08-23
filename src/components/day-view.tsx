'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AddHabitTaskDialog, HabitTaskFormValues } from './add-habit-task-dialog';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addHabitTask, 
    updateHabitTask,
} from '@/app/actions';
import { Button } from './ui/button';
import { parseISO, format } from 'date-fns';
import { CommitmentsCard } from './commitments-card';
import { WeekNav } from './week-nav';
import { Plus } from 'lucide-react';
import { HabitTaskListItem } from './habit-task-list-item';

interface DayViewProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  commitments: HabitTask[];
  initialSelectedDate: string;
}

export function DayView({
  lifePrks,
  areaPrks,
  habitTasks,
  commitments,
  initialSelectedDate,
}: DayViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setSelectedDate(parseISO(initialSelectedDate));
  }, [initialSelectedDate]);

  // State for dialogs
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [defaultHabitTaskValues, setDefaultHabitTaskValues] = useState<Partial<HabitTaskFormValues> | undefined>(undefined);

  // State for editing items
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  
  // State for context when adding new items
  const [activeAreaPrk, setActiveAreaPrk] = useState<AreaPrk | null>(null);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    startTransition(() => {
      router.push(`/day?date=${dateString}`);
    });
  }

  const handleOpenAddHabitTaskDialog = (areaPrkId?: string) => {
    setActiveAreaPrk(areaPrks.find(ap => ap.id === areaPrkId) || null);
    setDefaultHabitTaskValues(undefined);
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  };
  
    const handleOpenEditHabitTaskDialog = (habitTask: HabitTask) => {
    setEditingHabitTask(habitTask);
    setDefaultHabitTaskValues(undefined);
    setActiveAreaPrk(areaPrks.find(ap => ap.id === habitTask.area_prk_id) || null);
    setHabitTaskDialogOpen(true);
  };

  const handleSaveHabitTask = (values: Partial<HabitTask>) => {
    startTransition(async () => {
        try {
            if (editingHabitTask) {
                await updateHabitTask(editingHabitTask.id, values);
                toast({ title: '¡Acción Actualizada!', description: `Se ha actualizado "${values.title}".` });
            } else {
                await addHabitTask(values);
                toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
            }
        } catch (error) {
            console.error("Error al guardar la acción:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción. Revisa los campos e inténtalo de nuevo.' });
        }
    });
  };

  if (!selectedDate) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-headline">Cargando...</div>
        </div>
    );
  }

  return (
    <>
      <main className="container mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <WeekNav selectedDate={selectedDate} onDateChange={handleDateChange} />

        <div className="mt-6">
            <h2 className="text-2xl font-headline font-bold">Tareas del Día</h2>
            <div className="mt-4 space-y-2">
                {habitTasks.length > 0 ? (
                    habitTasks.map(task => (
                      <HabitTaskListItem 
                        key={task.id}
                        item={task}
                        selectedDate={selectedDate}
                        onEdit={handleOpenEditHabitTaskDialog}
                        // Add toggle and archive handlers if needed
                      />
                    ))
                ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No hay tareas programadas para hoy.</p>
                        <Button variant="link" size="sm" onClick={() => handleOpenAddHabitTaskDialog()}>¡Agrega la primera!</Button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8">
            <h2 className="text-2xl font-headline font-bold">Compromisos del Período</h2>
            <div className="mt-4">
                <CommitmentsCard 
                    commitments={commitments}
                    selectedDate={selectedDate}
                    onToggle={() => {}} // Placeholder
                    onEdit={handleOpenEditHabitTaskDialog}
                    onArchive={() => {}} // Placeholder
                />
            </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6">
        <Button onClick={() => handleOpenAddHabitTaskDialog()} size="lg" className="rounded-full shadow-lg h-12 w-12 p-0 sm:w-auto sm:px-6 sm:h-11">
            <Plus className="h-6 w-6 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Acción</span>
        </Button>
      </div>

      <AddHabitTaskDialog 
        isOpen={isHabitTaskDialogOpen} 
        onOpenChange={setHabitTaskDialogOpen} 
        onSave={handleSaveHabitTask}
        habitTask={editingHabitTask}
        defaultAreaPrkId={activeAreaPrk?.id}
        defaultDate={selectedDate}
        areaPrks={areaPrks}
        defaultValues={defaultHabitTaskValues}
       />
    </>
  );
}
