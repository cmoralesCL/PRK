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

  const handleAddLifePrk = (values: { title: string; description?: string }) => {
    const newLifePrk: LifePrk = {
      id: `life-${Date.now()}`,
      ...values,
      description: values.description || '',
    };
    setLifePrks([...lifePrks, newLifePrk]);
    toast({ title: '¡PRK de Vida Agregado!', description: `"${values.title}" es ahora tu estrella guía.` });
  };
  
  const handleAddAreaPrk = (values: { title: string; targetValue: number; unit: string }) => {
    if (!activeLifePrkId) return;
    const newAreaPrk: AreaPrk = {
      id: `area-${Date.now()}`,
      lifePrkId: activeLifePrkId,
      currentValue: 0,
      ...values,
    };
    setAreaPrks([...areaPrks, newAreaPrk]);
    toast({ title: '¡PRK de Área Establecido!', description: `Ahora estás siguiendo "${values.title}".` });
  };

  const handleAddHabitTask = (values: HabitTaskFormValues) => {
    if (!activeAreaPrkId) return;
    const newHabitTask: HabitTask = {
      id: `task-${Date.now()}`,
      areaPrkId: activeAreaPrkId,
      completed: false,
      ...values,
    };
    setHabitTasks([...habitTasks, newHabitTask]);
    
    // Si la nueva tarea está completada, actualizamos el PRK de Área
    if(newHabitTask.completed) {
        setAreaPrks(areaPrks.map(kp => 
            kp.id === activeAreaPrkId ? { ...kp, currentValue: kp.currentValue + newHabitTask.value } : kp
        ));
    }

    toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
  };
  
  const handleToggleHabitTask = (id: string, completed: boolean) => {
    let toggledTask: HabitTask | undefined;

    setHabitTasks(prevHabitTasks => {
        const newHabitTasks = prevHabitTasks.map(ht => {
            if (ht.id === id) {
                toggledTask = { ...ht, completed };
                return toggledTask;
            }
            return ht;
        });

        if (toggledTask) {
            const task = toggledTask;
            const valueChange = completed ? task.value : -task.value;

            setAreaPrks(prevAreaPrks => 
                prevAreaPrks.map(kp => {
                    if (kp.id === task.areaPrkId) {
                        const newCurrentValue = Math.max(0, kp.currentValue + valueChange);
                        return { ...kp, currentValue: newCurrentValue };
                    }
                    return kp;
                })
            );
        }
        
        return newHabitTasks;
    });

    if (completed) {
        toast({ title: '¡Excelente trabajo!', description: 'Un paso más cerca de tu meta.' });
    }
  };

  const handleAddSuggestedTask = (areaPrkId: string, title: string) => {
    const newHabitTask: HabitTask = {
      id: `task-${Date.now()}`,
      areaPrkId: areaPrkId,
      title,
      type: 'task',
      completed: false,
      value: 1, // Las sugerencias de IA aportan 1 por defecto
    };
    setHabitTasks(prev => [...prev, newHabitTask]);
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
