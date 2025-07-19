
'use client';

import * as React from 'react';
import { Target, Plus, Archive, MoreVertical, ChevronDown, Pencil } from 'lucide-react';
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
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils';

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  onAddAreaPrk: (lifePrkId: string) => void;
  onEditAreaPrk: (areaPrk: AreaPrk) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onToggleHabitTask: (id: string, completed: boolean, selectedDate: Date, progressValue?: number) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
  onArchive: (id: string) => void;
  onEdit: (lifePrk: LifePrk) => void;
  onArchiveAreaPrk: (id: string) => void;
  onArchiveHabitTask: (id: string) => void;
  selectedDate: Date;
}

export function LifePrkSection({
  lifePrk,
  areaPrks,
  habitTasks,
  onAddAreaPrk,
  onEditAreaPrk,
  onAddHabitTask,
  onEditHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
  onArchive,
  onEdit,
  onArchiveAreaPrk,
  onArchiveHabitTask,
  selectedDate
}: LifePrkSectionProps) {

  const lifePrkProgress = lifePrk.progress ?? 0;

  return (
    <AccordionItem value={lifePrk.id} className="border-b-0">
       <div className="py-4 bg-card rounded-lg shadow-sm px-6">
        <AccordionTrigger asChild className="p-0 hover:no-underline flex-grow cursor-pointer group w-full">
            <div className="flex justify-between items-start gap-4 p-2">
                <div className="flex-grow">
                    <div className="mb-4 sm:mb-0">
                        <h2 className="text-3xl font-bold font-headline flex items-center gap-3">
                            <Target className="h-8 w-8 text-primary" />
                            {lifePrk.title}
                        </h2>
                        <p className="mt-1 text-muted-foreground max-w-2xl">{lifePrk.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-center">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); onAddAreaPrk(lifePrk.id); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Agregar PRK de Área</span>
                        <span className="inline sm:hidden">PRK Área</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lifePrk); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar PRK de Vida
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(lifePrk.id); }}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archivar PRK de Vida
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                     <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </div>
        </AccordionTrigger>
        
        <div className="px-4">
            <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>Progreso General</span>
                    <span>{lifePrkProgress.toFixed(0)}%</span>
                </div>
                <Progress value={lifePrkProgress} className="h-2" />
            </div>
        </div>

      <AccordionContent className="pt-6 px-4">
        {areaPrks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areaPrks.map((kp) => (
              <AreaPrkCard
                  key={kp.id}
                  areaPrk={kp}
                  habitTasks={habitTasks.filter((ht) => ht.area_prk_id === kp.id)}
                  onAddHabitTask={onAddHabitTask}
                  onEditHabitTask={onEditHabitTask}
                  onToggleHabitTask={onToggleHabitTask}
                  onGetAiSuggestions={onGetAiSuggestions}
                  onArchive={onArchiveAreaPrk}
                  onEdit={onEditAreaPrk}
                  onArchiveHabitTask={onArchiveHabitTask}
                  selectedDate={selectedDate}
              />
              ))}
          </div>
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-muted-foreground">Aún no hay PRK de Área para esta visión.</p>
                  <Button variant="link" onClick={() => onAddAreaPrk(lifePrk.id)}>¡Agrega el primero!</Button>
              </div>
          )}
      </AccordionContent>
      </div>
    </AccordionItem>
  );
}
