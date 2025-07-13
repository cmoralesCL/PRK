'use client';

import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaPrkCard } from './area-prk-card';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  onAddAreaPrk: (lifePrkId: string) => void;
  onUpdateProgress: (areaPrk: AreaPrk) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onToggleHabitTask: (id: string, completed: boolean) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
  onAddSuggestedTask: (areaPrkId: string, title: string) => void;
}

export function LifePrkSection({
  lifePrk,
  areaPrks,
  habitTasks,
  onAddAreaPrk,
  onUpdateProgress,
  onAddHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
}: LifePrkSectionProps) {
  return (
    <section className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            {lifePrk.title}
          </h2>
          <p className="mt-1 text-muted-foreground max-w-2xl">{lifePrk.description}</p>
        </div>
        <Button variant="outline" onClick={() => onAddAreaPrk(lifePrk.id)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar PRK de Área
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {areaPrks.map((kp) => (
          <AreaPrkCard
            key={kp.id}
            areaPrk={kp}
            habitTasks={habitTasks.filter((ht) => ht.areaPrkId === kp.id)}
            onUpdateProgress={onUpdateProgress}
            onAddHabitTask={onAddHabitTask}
            onToggleHabitTask={onToggleHabitTask}
            onGetAiSuggestions={onGetAiSuggestions}
          />
        ))}
      </div>
    </section>
  );
}
