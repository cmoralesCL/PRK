'use client';

import * as React from 'react';
import { Target, Plus, Archive, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AreaPrkCard } from './area-prk-card';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  onAddAreaPrk: (lifePrkId: string) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onToggleHabitTask: (id: string, completed: boolean) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
  onArchive: (id: string) => void;
  onArchiveAreaPrk: (id: string) => void;
  onArchiveHabitTask: (id: string) => void;
}

export function LifePrkSection({
  lifePrk,
  areaPrks,
  habitTasks,
  onAddAreaPrk,
  onAddHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
  onArchive,
  onArchiveAreaPrk,
  onArchiveHabitTask,
}: LifePrkSectionProps) {

  const lifePrkProgress = lifePrk.progress ?? 0;

  return (
    <section className="py-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="mb-4 sm:mb-0">
                <h2 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <Target className="h-8 w-8 text-primary" />
                    {lifePrk.title}
                </h2>
                <p className="mt-1 text-muted-foreground max-w-2xl">{lifePrk.description}</p>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onAddAreaPrk(lifePrk.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar PRK de Área
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onArchive(lifePrk.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar PRK de Vida
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>Progreso General</span>
                <span>{lifePrkProgress.toFixed(0)}%</span>
            </div>
            <Progress value={lifePrkProgress} className="h-2" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areaPrks.map((kp) => (
          <AreaPrkCard
            key={kp.id}
            areaPrk={kp}
            habitTasks={habitTasks.filter((ht) => ht.areaPrkId === kp.id)}
            onAddHabitTask={onAddHabitTask}
            onToggleHabitTask={onToggleHabitTask}
            onGetAiSuggestions={onGetAiSuggestions}
            onArchive={onArchiveAreaPrk}
            onArchiveHabitTask={onArchiveHabitTask}
          />
        ))}
        {areaPrks.length === 0 && (
           <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-card rounded-lg border border-dashed">
                <p className="text-muted-foreground">Aún no hay PRK de Área para esta visión.</p>
                <Button variant="link" onClick={() => onAddAreaPrk(lifePrk.id)}>¡Agrega el primero!</Button>
            </div>
        )}
      </div>
    </section>
  );
}
