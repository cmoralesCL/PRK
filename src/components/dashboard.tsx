'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Header } from './header';
import { LifePrkSection } from './life-prk-section';
import { AddLifePrkDialog } from './add-life-prk-dialog';
import { AddKeyPrkDialog } from './add-key-prk-dialog';
import { AddHabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';
import { UpdateKeyPrkDialog } from './update-key-prk-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, KeyPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  initialLifePrks: LifePrk[];
  initialKeyPrks: KeyPrk[];
  initialHabitTasks: HabitTask[];
}

export function Dashboard({
  initialLifePrks,
  initialKeyPrks,
  initialHabitTasks,
}: DashboardProps) {
  const [lifePrks, setLifePrks] = useState<LifePrk[]>(initialLifePrks);
  const [keyPrks, setKeyPrks] = useState<KeyPrk[]>(initialKeyPrks);
  const [habitTasks, setHabitTasks] = useState<HabitTask[]>(initialHabitTasks);
  const { toast } = useToast();

  const [isAddLifePrkOpen, setAddLifePrkOpen] = useState(false);
  const [isAddKeyPrkOpen, setAddKeyPrkOpen] = useState(false);
  const [isAddHabitTaskOpen, setAddHabitTaskOpen] = useState(false);
  const [isUpdatePrkOpen, setUpdatePrkOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);

  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeKeyPrkId, setActiveKeyPrkId] = useState<string | null>(null);
  const [activeKeyPrk, setActiveKeyPrk] = useState<KeyPrk | null>(null);

  const handleAddLifePrk = (values: { title: string; description?: string }) => {
    const newLifePrk: LifePrk = {
      id: `life-${Date.now()}`,
      ...values,
      description: values.description || '',
    };
    setLifePrks([...lifePrks, newLifePrk]);
    toast({ title: '¡PRK de Vida Agregado!', description: `"${values.title}" es ahora tu estrella guía.` });
  };
  
  const handleAddKeyPrk = (values: { title: string; targetValue: number; unit: string }) => {
    if (!activeLifePrkId) return;
    const newKeyPrk: KeyPrk = {
      id: `key-${Date.now()}`,
      lifePrkId: activeLifePrkId,
      currentValue: 0,
      ...values,
    };
    setKeyPrks([...keyPrks, newKeyPrk]);
    toast({ title: '¡PRK Clave Establecido!', description: `Ahora estás siguiendo "${values.title}".` });
  };

  const handleAddHabitTask = (values: HabitTaskFormValues) => {
    if (!activeKeyPrkId) return;
    const newHabitTask: HabitTask = {
      id: `task-${Date.now()}`,
      keyPrkId: activeKeyPrkId,
      completed: false,
      ...values,
    };
    setHabitTasks([...habitTasks, newHabitTask]);
    toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
  };
  
  const handleToggleHabitTask = (id: string, completed: boolean) => {
    setHabitTasks(habitTasks.map(ht => (ht.id === id ? { ...ht, completed } : ht)));
    if (completed) {
        toast({ title: '¡Excelente trabajo!', description: 'Un paso más cerca de tu meta.' });
    }
  };
  
  const handleUpdateKeyPrk = (values: { currentValue: number }) => {
    if (!activeKeyPrk) return;
    setKeyPrks(keyPrks.map(kp => (kp.id === activeKeyPrk.id ? { ...kp, ...values } : kp)));
    toast({ title: '¡Progreso Registrado!', description: `Progreso para "${activeKeyPrk.title}" actualizado.` });
  };

  const handleAddSuggestedTask = (keyPrkId: string, title: string) => {
    const newHabitTask: HabitTask = {
      id: `task-${Date.now()}`,
      keyPrkId: keyPrkId,
      title,
      type: 'task',
      completed: false,
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
              keyPrks={keyPrks.filter(kp => kp.lifePrkId === lp.id)}
              habitTasks={habitTasks}
              onAddKeyPrk={(id) => { setActiveLifePrkId(id); setAddKeyPrkOpen(true); }}
              onUpdateProgress={(kp) => { setActiveKeyPrk(kp); setUpdatePrkOpen(true); }}
              onAddHabitTask={(id) => { setActiveKeyPrkId(id); setAddHabitTaskOpen(true); }}
              onToggleHabitTask={handleToggleHabitTask}
              onGetAiSuggestions={(kp) => { setActiveKeyPrk(kp); setAiSuggestOpen(true); }}
              onAddSuggestedTask={handleAddSuggestedTask}
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
      <AddKeyPrkDialog isOpen={isAddKeyPrkOpen} onOpenChange={setAddKeyPrkOpen} onAdd={handleAddKeyPrk} />
      <AddHabitTaskDialog isOpen={isAddHabitTaskOpen} onOpenChange={setAddHabitTaskOpen} onAdd={handleAddHabitTask} />
      <UpdateKeyPrkDialog isOpen={isUpdatePrkOpen} onOpenChange={setUpdatePrkOpen} onUpdate={handleUpdateKeyPrk} keyPrk={activeKeyPrk} />
      <AiSuggestionDialog 
        isOpen={isAiSuggestOpen} 
        onOpenChange={setAiSuggestOpen} 
        onAddSuggestion={(title) => activeKeyPrk && handleAddSuggestedTask(activeKeyPrk.id, title)}
        keyPrk={activeKeyPrk} 
      />
    </>
  );
}
