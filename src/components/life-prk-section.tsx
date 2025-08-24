
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  allHabitTasks: HabitTask[];
  onAddAreaPrk: (lifePrkId: string) => void;
  onEditAreaPrk: (areaPrk: AreaPrk) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onArchive: (id: string) => void;
  onEdit: (lifePrk: LifePrk) => void;
  onArchiveAreaPrk: (id: string) => void;
  onArchiveHabitTask: (id: string) => void;
}

export function LifePrkSection({
  lifePrk,
  areaPrks,
  allHabitTasks,
  onAddAreaPrk,
  onEditAreaPrk,
  onAddHabitTask,
  onEditHabitTask,
  onArchive,
  onEdit,
  onArchiveAreaPrk,
  onArchiveHabitTask,
}: LifePrkSectionProps) {

  const lifePrkProgress = lifePrk.progress ?? 0;

  return (
    <AccordionItem value={lifePrk.id} className="border-b-0">
       <div className="bg-card rounded-lg shadow-sm border">
        <div className="flex items-center p-3 group">
            <AccordionTrigger className="p-0 hover:no-underline flex-grow w-full">
            <div className='w-full space-y-2'>
                <div className="flex justify-between items-start gap-2 w-full">
                    <div className="flex items-start gap-3 flex-grow">
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-1.5 rounded-full mt-0.5">
                            <Target className="h-4 w-4" />
                        </div>
                        <div className='flex-grow text-left'>
                            <h2 className="text-base font-bold font-headline leading-tight">
                                {lifePrk.title}
                            </h2>
                            {lifePrk.description && (
                            <p className="text-xs text-muted-foreground font-normal max-w-md">{lifePrk.description}</p>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="pl-9 pr-2 flex items-center gap-2 w-full">
                    <Progress value={lifePrkProgress} className="h-1.5 w-full" />
                    <span className="text-xs font-bold text-foreground w-8 text-right">{lifePrkProgress.toFixed(0)}%</span>
                </div>
            </div>
            </AccordionTrigger>
             <div className="flex items-center gap-1 flex-shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onAddAreaPrk(lifePrk.id)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Área
                  </Button>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(lifePrk)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar PRK de Vida
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onArchive(lifePrk.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archivar PRK de Vida
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                   <AccordionTrigger className="p-0" asChild>
                    <button>
                      <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </button>
                  </AccordionTrigger>
              </div>
        </div>
        
      <AccordionContent className="pb-2 px-2">
        <div className="pt-2 space-y-3">
            {areaPrks.length > 0 ? (
            areaPrks.map((kp) => (
                <AreaPrkCard
                    key={kp.id}
                    areaPrk={kp}
                    actions={allHabitTasks.filter(ht => ht.area_prk_id === kp.id)}
                    onAddHabitTask={onAddHabitTask}
                    onEditHabitTask={onEditHabitTask}
                    onArchive={onArchiveAreaPrk}
                    onEdit={onEditAreaPrk}
                    onArchiveHabitTask={onArchiveHabitTask}
                />
                ))
            ) : (
                <div className="text-center py-6 bg-muted/40 rounded-lg border border-dashed mx-2">
                    <p className="text-muted-foreground text-xs">Aún no hay PRK de Área para esta visión.</p>
                    <Button variant="link" size="sm" onClick={() => onAddAreaPrk(lifePrk.id)}>¡Agrega el primero!</Button>
                </div>
            )}
        </div>
      </AccordionContent>
      </div>
    </AccordionItem>
  );
}
