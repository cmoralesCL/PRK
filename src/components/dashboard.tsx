'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Header } from './header';
import { LifePrkSection } from './life-prk-section';
import { AddLifePrkDialog } from './add-life-prk-dialog';
import { AddAreaPrkDialog } from './add-area-prk-dialog';
import { HabitTaskDialog, type HabitTaskFormValues } from './habit-task-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addAreaPrk, 
    addHabitTask, 
    updateHabitTask,
    addLifePrk, 
    logHabitTaskCompletion,
    removeHabitTaskCompletion,
    archiveLifePrk,
    archiveAreaPrk,
    archiveHabitTask
} from '@/app/actions';
import { Button } from './ui/button';
import { parseISO } from 'date-fns';

interface DashboardProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  initialSelectedDate: string;
}

export function Dashboard({
  lifePrks,
  areaPrks,
  habitTasks,
  initialSelectedDate,
}: DashboardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    // Inicializar la fecha en el cliente para evitar errores de hidratación
    setSelectedDate(parseISO(initialSelectedDate));
  }, [initialSelectedDate]);


  const [isAddLifePrkOpen, setAddLifePrkOpen] = useState(false);
  const [isAddAreaPrkOpen, setAddAreaPrkOpen] = useState(false);
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);

  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeAreaPrkId, setActiveAreaPrkId] = useState<string | null>(null);
  const [activeAreaPrk, setActiveAreaPrk] = useState<AreaPrk | null>(null);
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(date);
    // startTransition para no bloquear la UI mientras navega
    startTransition(() => {
      router.push(`/?date=${dateString}`);
    });
  }

  const handleAddLifePrk = (values: { title: string; description?: string }) => {
    startTransition(async () => {
        try {
          await addLifePrk(values);
          toast({ title: '¡PRK de Vida Agregado!', description: `"${values.title}" es ahora tu estrella guía.` });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el PRK de Vida.' });
        }
    });
  };
  
  const handleAddAreaPrk = (values: { title: string; unit: string }) => {
    if (!activeLifePrkId) return;
     startTransition(async () => {
        try {
          await addAreaPrk({ ...values, lifePrkId: activeLifePrkId });
          toast({ title: '¡PRK de Área Establecido!', description: `Ahora estás siguiendo "${values.title}".` });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el PRK de Área.' });
        }
    });
  };

  const handleOpenAddHabitTaskDialog = (areaPrkId: string) => {
    setActiveAreaPrkId(areaPrkId);
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  };

  const handleOpenEditHabitTaskDialog = (habitTask: HabitTask) => {
    setEditingHabitTask(habitTask);
    setHabitTaskDialogOpen(true);
  };

  const handleSaveHabitTask = (values: HabitTaskFormValues) => {
    startTransition(async () => {
        try {
            const habitTaskData: Partial<HabitTask> = {
                title: values.title,
                type: values.type,
                startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : undefined,
                dueDate: values.dueDate ? values.dueDate.toISOString().split('T')[0] : undefined,
                frequency: values.frequency,
                frequencyDays: values.frequencyDays
            };
            
            if (editingHabitTask) {
                await updateHabitTask(editingHabitTask.id, habitTaskData);
                toast({ title: '¡Acción Actualizada!', description: `Se ha actualizado "${values.title}".` });
            } else if(activeAreaPrkId) {
                await addHabitTask({ ...habitTaskData, areaPrkId: activeAreaPrkId });
                toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
            }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción.' });
        }
    });
  };
  
  const handleToggleHabitTask = (id: string, completed: boolean, date: Date) => {
    const task = habitTasks.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id, task.type, completionDate);
          if (task.type === 'task') {
              toast({ title: '¡Tarea Completada!', description: '¡Excelente trabajo!' });
          } else {
              toast({ title: '¡Hábito Registrado!', description: 'Un paso más cerca de tu meta.' });
          }
        } else {
          await removeHabitTaskCompletion(id, task.type, completionDate);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleAddSuggestedTask = (areaPrkId: string, title: string) => {
     startTransition(async () => {
        try {
            await addHabitTask({ 
                areaPrkId, 
                title, 
                type: 'task',
                startDate: new Date().toISOString().split('T')[0]
            });
            toast({ title: "¡Agregado!", description: `"${title}" ha sido añadido a tus tareas.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la tarea sugerida.' });
        }
    });
  };
  
  const handleArchiveLifePrk = (id: string) => {
    startTransition(async () => {
        try {
          await archiveLifePrk(id);
          toast({ title: 'PRK de Vida Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el PRK de Vida.' });
        }
    });
  };

  const handleArchiveAreaPrk = (id: string) => {
    startTransition(async () => {
        try {
          await archiveAreaPrk(id);
          toast({ title: 'PRK de Área Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el PRK de Área.' });
        }
    });
  };

  const handleArchiveHabitTask = (id: string) => {
    startTransition(async () => {
        try {
          await archiveHabitTask(id);
          toast({ title: 'Hábito/Tarea Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el Hábito/Tarea.' });
        }
    });
  };

  if (!selectedDate) {
    // Muestra un estado de carga o skeleton mientras la fecha se inicializa en el cliente
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-headline">Cargando...</div>
        </div>
    );
  }

  return (
    <>
      <Header 
        onAddLifePrk={() => setAddLifePrkOpen(true)}
        selectedDate={selectedDate}
        onDateChange={handleDateChange} 
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {lifePrks.length === 0 && !isPending && (
            <div className="text-center py-24">
                <h2 className="text-2xl font-headline font-semibold">Bienvenido a tu Brújula</h2>
                <p className="mt-2 text-muted-foreground">Define tu primer PRK de Vida para empezar tu viaje.</p>
                <Button className="mt-6" onClick={() => setAddLifePrkOpen(true)}>Crear un PRK de Vida</Button>
            </div>
        )}
        {isPending && (
            <div className="text-center py-24">
                 <h2 className="text-2xl font-headline font-semibold">Cargando...</h2>
            </div>
        )}
        {!isPending && lifePrks.map((lp, index) => (
          <div key={lp.id}>
            <LifePrkSection
              lifePrk={lp}
              areaPrks={areaPrks.filter(kp => kp.lifePrkId === lp.id)}
              habitTasks={habitTasks}
              onAddAreaPrk={(id) => { setActiveLifePrkId(id); setAddAreaPrkOpen(true); }}
              onAddHabitTask={handleOpenAddHabitTaskDialog}
              onEditHabitTask={handleOpenEditHabitTaskDialog}
              onToggleHabitTask={handleToggleHabitTask}
              onGetAiSuggestions={(kp) => { setActiveAreaPrk(kp); setAiSuggestOpen(true); }}
              onArchive={handleArchiveLifePrk}
              onArchiveAreaPrk={handleArchiveAreaPrk}
              onArchiveHabitTask={handleArchiveHabitTask}
              selectedDate={selectedDate}
            />
            {index < lifePrks.length - 1 && <Separator className="my-0" />}
          </div>
        ))}
      </main>

      <AddLifePrkDialog isOpen={isAddLifePrkOpen} onOpenChange={setAddLifePrkOpen} onAdd={handleAddLifePrk} />
      <AddAreaPrkDialog isOpen={isAddAreaPrkOpen} onOpenChange={setAddAreaPrkOpen} onAdd={handleAddAreaPrk} />
      <HabitTaskDialog 
        isOpen={isHabitTaskDialogOpen} 
        onOpenChange={setHabitTaskDialogOpen} 
        onSave={handleSaveHabitTask}
        habitTask={editingHabitTask}
       />
      <AiSuggestionDialog 
        isOpen={isAiSuggestOpen} 
        onOpenChange={setAiSuggestOpen} 
        onAddSuggestion={(title) => activeAreaPrk && handleAddSuggestedTask(activeAreaPrk.id, title)}
        areaPrk={activeAreaPrk} 
      />
    </>
  );
}
