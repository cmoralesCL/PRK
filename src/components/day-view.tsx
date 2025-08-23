'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifePrkSection } from './life-prk-section';
import { AddAreaPrkDialog, type AreaPrkFormValues } from './add-area-prk-dialog';
import { AddHabitTaskDialog, HabitTaskFormValues } from './add-habit-task-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, AreaPrk, HabitTask, HabitFrequency } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addAreaPrk, 
    updateAreaPrk,
    addHabitTask, 
    updateHabitTask,
    archiveLifePrk,
    archiveAreaPrk,
    archiveHabitTask,
} from '@/app/actions';
import { Button } from './ui/button';
import { parseISO, format } from 'date-fns';
import { Accordion } from '@/components/ui/accordion';
import { useDialog } from '@/hooks/use-dialog';
import { CommitmentsCard } from './commitments-card';
import { WeekNav } from './week-nav';
import { Plus } from 'lucide-react';

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
  const { setLifePrkToEdit } = useDialog();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setSelectedDate(parseISO(initialSelectedDate));
  }, [initialSelectedDate]);

  // State for dialogs
  const [isAreaPrkDialogOpen, setAreaPrkDialogOpen] = useState(false);
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [defaultHabitTaskValues, setDefaultHabitTaskValues] = useState<Partial<HabitTaskFormValues> | undefined>(undefined);

  // State for editing items
  const [editingAreaPrk, setEditingAreaPrk] = useState<AreaPrk | null>(null);
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  
  // State for context when adding new items
  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
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
            <div className="mt-4 space-y-4">
                {habitTasks.length > 0 ? (
                    // Aquí podrías mapear y mostrar las tareas, similar a como lo hacen otros componentes
                    // Por simplicidad, por ahora solo mostraremos un contador.
                    <p>{habitTasks.length} tareas para hoy.</p>
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
                    onToggle={() => {}} // Se debería implementar la lógica de toggle
                    onEdit={() => {}} // Se debería implementar la lógica de edición
                    onArchive={() => {}} // Se debería implementar la lógica de archivo
                />
            </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6">
        <Button onClick={() => handleOpenAddHabitTaskDialog()} size="lg" className="rounded-full shadow-lg">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Acción
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
