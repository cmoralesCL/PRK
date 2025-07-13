'use client';

import { useState, useTransition } from 'react';
import { Separator } from '@/components/ui/separator';
import { Header } from './header';
import { LifePrkSection } from './life-prk-section';
import { AddLifePrkDialog } from './add-life-prk-dialog';
import { AddAreaPrkDialog } from './add-area-prk-dialog';
import { AddHabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addAreaPrk, 
    addHabitTask, 
    addLifePrk, 
    logHabitTaskCompletion,
    removeHabitTaskCompletion,
    archiveLifePrk,
    archiveAreaPrk,
    archiveHabitTask
} from '@/app/actions';
import { Button } from './ui/button';

interface DashboardProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
}

export function Dashboard({
  lifePrks,
  areaPrks,
  habitTasks,
}: DashboardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isAddLifePrkOpen, setAddLifePrkOpen] = useState(false);
  const [isAddAreaPrkOpen, setAddAreaPrkOpen] = useState(false);
  const [isAddHabitTaskOpen, setAddHabitTaskOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);

  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeAreaPrkId, setActiveAreaPrkId] = useState<string | null>(null);
  const [activeAreaPrk, setActiveAreaPrk] = useState<AreaPrk | null>(null);

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

  const handleAddHabitTask = (values: HabitTaskFormValues) => {
    if (!activeAreaPrkId) return;
    startTransition(async () => {
        try {
          const habitTaskData: Partial<HabitTask> = {
              areaPrkId: activeAreaPrkId,
              title: values.title,
              type: values.type,
              startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : undefined,
              frequency: values.frequency,
              frequencyDays: values.frequencyDays
          };
          await addHabitTask(habitTaskData);
          toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la acción.' });
        }
    });
  };
  
  const handleToggleHabitTask = (id: string, completed: boolean) => {
    const task = habitTasks.find(ht => ht.id === id);
    if (!task) return;

    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id);
          if (task.type === 'task') {
              toast({ title: '¡Tarea Completada!', description: '¡Excelente trabajo!' });
          } else {
              toast({ title: '¡Hábito Registrado!', description: 'Un paso más cerca de tu meta.' });
          }
        } else {
          await removeHabitTaskCompletion(id, task.type);
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

  return (
    <>
      <Header onAddLifePrk={() => setAddLifePrkOpen(true)} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {lifePrks.map((lp, index) => (
          <div key={lp.id}>
            <LifePrkSection
              lifePrk={lp}
              areaPrks={areaPrks.filter(kp => kp.lifePrkId === lp.id)}
              habitTasks={habitTasks}
              onAddAreaPrk={(id) => { setActiveLifePrkId(id); setAddAreaPrkOpen(true); }}
              onAddHabitTask={(id) => { setActiveAreaPrkId(id); setAddHabitTaskOpen(true); }}
              onToggleHabitTask={handleToggleHabitTask}
              onGetAiSuggestions={(kp) => { setActiveAreaPrk(kp); setAiSuggestOpen(true); }}
              onArchive={handleArchiveLifePrk}
              onArchiveAreaPrk={handleArchiveAreaPrk}
              onArchiveHabitTask={handleArchiveHabitTask}
            />
            {index < lifePrks.length - 1 && <Separator />}
          </div>
        ))}
        {lifePrks.length === 0 && (
            <div className="text-center py-24">
                <h2 className="text-2xl font-headline font-semibold">Bienvenido a tu Brújula</h2>
                <p className="mt-2 text-muted-foreground">Define tu primer PRK de Vida para empezar tu viaje.</p>
                <Button className="mt-6" onClick={() => setAddLifePrkOpen(true)}>Crear un PRK de Vida</Button>
            </div>
        )}
      </main>

      <AddLifePrkDialog isOpen={isAddLifePrkOpen} onOpenChange={setAddLifePrkOpen} onAdd={handleAddLifePrk} />
      <AddAreaPrkDialog isOpen={isAddAreaPrkOpen} onOpenChange={setAddAreaPrkOpen} onAdd={handleAddAreaPrk} />
      <AddHabitTaskDialog isOpen={isAddHabitTaskOpen} onOpenChange={setAddHabitTaskOpen} onAdd={handleAddHabitTask} />
      <AiSuggestionDialog 
        isOpen={isAiSuggestOpen} 
        onOpenChange={setAiSuggestOpen} 
        onAddSuggestion={(title) => activeAreaPrk && handleAddSuggestedTask(activeAreaPrk.id, title)}
        areaPrk={activeAreaPrk} 
      />
    </>
  );
}
