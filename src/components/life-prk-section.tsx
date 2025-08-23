

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
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';


interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  onAddAreaPrk: (lifePrkId: string) => void;
  onEditAreaPrk: (areaPrk: AreaPrk) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
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
  onGetAiSuggestions,
  onArchive,
  onEdit,
  onArchiveAreaPrk,
  onArchiveHabitTask,
  selectedDate
}: LifePrkSectionProps) {

  const lifePrkProgress = lifePrk.progress ?? 0;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleToggleHabitTask = (id: string, completed: boolean, date: Date, progressValue?: number) => {
    const task = habitTasks.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id, task.type, completionDate, progressValue);
        } else {
          await removeHabitTaskCompletion(id, task.type, completionDate);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleUndoHabitTask = (id: string, date: Date) => {
    const task = habitTasks.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];
    startTransition(async () => {
        try {
            await removeHabitTaskCompletion(id, task.type, completionDate);
            toast({ title: "Registro deshecho" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo deshacer la acción.' });
        }
    });
  };


  return (
    <AccordionItem value={lifePrk.id} className="border-b-0">
       <div className="py-3 bg-card rounded-lg shadow-sm px-4">
        <AccordionTrigger asChild className="p-0 hover:no-underline flex-grow cursor-pointer group w-full">
            <div className="flex justify-between items-start gap-2 p-2">
                <div className="flex-grow">
                    <div className="mb-2 sm:mb-0">
                        <h2 className="text-xl md:text-2xl font-bold font-headline flex items-center gap-3">
                             <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                                <Target className="h-5 w-5" />
                            </div>
                            {lifePrk.title}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{lifePrk.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 self-center">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onAddAreaPrk(lifePrk.id); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">PRK de Área</span>
                        <span className="inline sm:hidden">Área</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
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
        
        <div className="px-2">
            <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Progreso General</span>
                    <span>{lifePrkProgress.toFixed(0)}%</span>
                </div>
                <Progress value={lifePrkProgress} className="h-2" />
            </div>
        </div>

      <AccordionContent className="pt-4 px-2">
        {areaPrks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {areaPrks.map((kp) => (
              <AreaPrkCard
                  key={kp.id}
                  areaPrk={kp}
                  habitTasks={habitTasks.filter((ht) => ht.area_prk_id === kp.id)}
                  onAddHabitTask={onAddHabitTask}
                  onEditHabitTask={onEditHabitTask}
                  onToggleHabitTask={handleToggleHabitTask}
                  onUndoHabitTask={handleUndoHabitTask}
                  onGetAiSuggestions={onGetAiSuggestions}
                  onArchive={onArchiveAreaPrk}
                  onEdit={onEditAreaPrk}
                  onArchiveHabitTask={onArchiveHabitTask}
                  selectedDate={selectedDate}
              />
              ))}
          </div>
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-muted-foreground text-sm">Aún no hay PRK de Área para esta visión.</p>
                  <Button variant="link" size="sm" onClick={() => onAddAreaPrk(lifePrk.id)}>¡Agrega el primero!</Button>
              </div>
          )}
      </AccordionContent>
      </div>
    </AccordionItem>
  );
}
