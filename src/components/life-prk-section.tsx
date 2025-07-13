'use client';

import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KeyPrkCard } from './key-prk-card';
import type { LifePrk, KeyPrk, HabitTask } from '@/lib/types';

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  keyPrks: KeyPrk[];
  habitTasks: HabitTask[];
  onAddKeyPrk: (lifePrkId: string) => void;
  onUpdateProgress: (keyPrk: KeyPrk) => void;
  onAddHabitTask: (keyPrkId: string) => void;
  onToggleHabitTask: (id: string, completed: boolean) => void;
  onGetAiSuggestions: (keyPrk: KeyPrk) => void;
  onAddSuggestedTask: (keyPrkId: string, title: string) => void;
}

export function LifePrkSection({
  lifePrk,
  keyPrks,
  habitTasks,
  onAddKeyPrk,
  onUpdateProgress,
  onAddHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
  onAddSuggestedTask,
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
        <Button variant="outline" onClick={() => onAddKeyPrk(lifePrk.id)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Key PRK
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {keyPrks.map((kp) => (
          <KeyPrkCard
            key={kp.id}
            keyPrk={kp}
            habitTasks={habitTasks.filter((ht) => ht.keyPrkId === kp.id)}
            onUpdateProgress={onUpdateProgress}
            onAddHabitTask={onAddHabitTask}
            onToggleHabitTask={onToggleHabitTask}
            onGetAiSuggestions={onGetAiSuggestions}
            onAddSuggestedTask={onAddSuggestedTask}
          />
        ))}
      </div>
    </section>
  );
}
