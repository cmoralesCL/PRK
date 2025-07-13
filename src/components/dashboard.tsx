'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Header } from './header';
import { LifePrkSection } from './life-prk-section';
import { AddLifePrkDialog } from './add-life-prk-dialog';
import { AddAreaPrkDialog } from './add-area-prk-dialog';
import { AddHabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addAreaPrk, addHabitTask, addLifePrk, toggleHabitTask } from '@/app/actions';
import { Button } from './ui/button';

interface DashboardProps {
  initialLifePrks: LifePrk[];
  initialAreaPrks: AreaPrk[];
  initialHabitTasks: HabitTask[];
}

export function Dashboard({
  initialLifePrks,
  initialAreaPrks,
  initialHabitTasks,
}: DashboardProps) {
  // We manage the state optimistically, but the source of truth is the server.
  const [lifePrks, setLifePrks] = useState<LifePrk[]>(initialLifePrks);
  const [areaPrks, setAreaPrks] = useState<AreaPrk[]>(initialAreaPrks);
  const [habitTasks, setHabitTasks] = useState<HabitTask[]>(initialHabitTasks);
  const { toast } = useToast();

  const [isAddLifePrkOpen, setAddLifePrkOpen] = useState(false);
  const [isAddAreaPrkOpen, setAddAreaPrkOpen] = useState(false);
  const [isAddHabitTaskOpen, setAddHabitTaskOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);

  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeAreaPrkId, setActiveAreaPrkId] = useState<string | null>(null);
  const [activeAreaPrk, setActiveAreaPrk] = useState<AreaPrk | null>(null);

  const handleAddLifePrk = async (values: { title: string; description?: string }) => {
    try {
      const newLifePrk = await addLifePrk(values);
      setLifePrks(prev => [...prev, newLifePrk]);
      toast({ title: '¡PRK de Vida Agregado!', description: `"${values.title}" es ahora tu estrella guía.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el PRK de Vida.' });
    }
  };
  
  const handleAddAreaPrk = async (values: { title: string; targetValue: number; unit: string }) => {
    if (!activeLifePrkId) return;
    try {
      const newAreaPrk = await addAreaPrk({ ...values, lifePrkId: activeLifePrkId });
      setAreaPrks(prev => [...prev, newAreaPrk]);
      toast({ title: '¡PRK de Área Establecido!', description: `Ahora estás siguiendo "${values.title}".` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el PRK de Área.' });
    }
  };

  const handleAddHabitTask = async (values: HabitTaskFormValues) => {
    if (!activeAreaPrkId) return;
    try {
      const newHabitTask = await addHabitTask({ ...values, areaPrkId: activeAreaPrkId });
      setHabitTasks(prev => [...prev, newHabitTask]);
      toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la acción.' });
    }
  };
  
  const handleToggleHabitTask = async (id: string, completed: boolean) => {
    const task = habitTasks.find(ht => ht.id === id);
    if (!task) return;

    // Optimistic UI update
    const originalTasks = [...habitTasks];
    const originalAreaPrks = [...areaPrks];

    setHabitTasks(prev => prev.map(ht => ht.id === id ? { ...ht, completed } : ht));
    const valueChange = completed ? task.value : -task.value;
    setAreaPrks(prev => prev.map(ap => ap.id === task.areaPrkId ? { ...ap, currentValue: Math.max(0, ap.currentValue + valueChange) } : ap));

    try {
      await toggleHabitTask(id, completed, task.areaPrkId, task.value);
      if (completed) {
        toast({ title: '¡Excelente trabajo!', description: 'Un paso más cerca de tu meta.' });
      }
    } catch (error) {
      // Revert on error
      setHabitTasks(originalTasks);
      setAreaPrks(originalAreaPrks);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la tarea.' });
    }
  };

  const handleAddSuggestedTask = async (areaPrkId: string, title: string) => {
     try {
      const newHabitTask = await addHabitTask({ 
          areaPrkId, 
          title, 
          type: 'task', 
          value: 1, // Las sugerencias de IA aportan 1 por defecto
      });
      setHabitTasks(prev => [...prev, newHabitTask]);
      toast({ title: "¡Agregado!", description: `"${title}" ha sido añadido a tus tareas.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la tarea sugerida.' });
    }
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
