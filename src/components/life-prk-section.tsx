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
import { Card } from '@/components/ui/card';

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  actions: HabitTask[];
  onAddAreaPrk: (lifePrkId: string) => void;
  onEditAreaPrk: (areaPrk: AreaPrk) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onArchive: (id: string) => void;
  onEdit: (lifePrk: LifePrk) => void;
  onArchiveAreaPrk: (id: string) => void;
  onArchiveHabitTask: (id: string) => void;
  selectedDate: Date;
  onHeaderClick?: () => void;
  isStandaloneView?: boolean;
}

export function LifePrkSection({
  lifePrk,
  areaPrks,
  actions,
  onAddAreaPrk,
  onEditAreaPrk,
  onAddHabitTask,
  onEditHabitTask,
  onArchive,
  onEdit,
  onArchiveAreaPrk,
  onArchiveHabitTask,
  selectedDate,
  onHeaderClick,
  isStandaloneView = false,
}: LifePrkSectionProps) {

  const lifePrkProgress = lifePrk.progress ?? 0;
  
  const areaPrkList = (
    <div className="pt-4 px-0 space-y-3">
        {areaPrks.length > 0 ? (
           areaPrks.map((kp) => (
            <AreaPrkCard
                key={kp.id}
                areaPrk={kp}
                actions={actions.filter((ht) => ht.area_prk_id === kp.id)}
                onAddHabitTask={onAddHabitTask}
                onEditHabitTask={onEditHabitTask}
                onArchive={onArchiveAreaPrk}
                onEdit={onEditAreaPrk}
                onArchiveHabitTask={onArchiveHabitTask}
                selectedDate={selectedDate}
            />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-muted-foreground text-sm">Aún no hay PRK de Área para esta visión.</p>
                  <Button variant="link" size="sm" onClick={() => onAddAreaPrk(lifePrk.id)}>¡Agrega el primero!</Button>
              </div>
          )}
    </div>
  );

  if (isStandaloneView) {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                    <h2 className="text-xl md:text-2xl font-bold font-headline flex items-center gap-3">
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                            <Target className="h-5 w-5" />
                        </div>
                        {lifePrk.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{lifePrk.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                    <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); onAddAreaPrk(lifePrk.id); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir PRK de Área
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
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
                                Archivar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
             <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Progreso General</span>
                <Progress value={lifePrkProgress} className="h-2 w-full" />
                <span className="text-sm font-bold text-foreground">{lifePrkProgress.toFixed(0)}%</span>
            </div>
        </Card>
        {areaPrkList}
      </div>
    );
  }


  return (
    <AccordionItem value={lifePrk.id} className="border-b-0">
       <div className="py-2 bg-card rounded-lg shadow-sm px-3">
        <AccordionTrigger className="p-0 hover:no-underline w-full group">
          <div className='w-full'>
            <div className="flex justify-between items-center gap-2 p-2 w-full">
              <div className="flex items-center gap-3 flex-grow" onClick={(e) => {
                  if (onHeaderClick) {
                    e.preventDefault();
                    onHeaderClick();
                  }
              }}>
                <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                    <Target className="h-4 w-4" />
                </div>
                <div className='flex-grow'>
                    <h2 className="text-base font-bold font-headline">
                        {lifePrk.title}
                    </h2>
                    {lifePrk.description && (
                       <p className="text-xs text-muted-foreground max-w-md">{lifePrk.description}</p>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-8" onClick={(e) => { e.stopPropagation(); onAddAreaPrk(lifePrk.id); }}>
                      <Plus className="mr-1 h-4 w-4" />
                      Área
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
            <div className="px-2 mt-1 flex items-center gap-2 w-full">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Progreso</span>
                <Progress value={lifePrkProgress} className="h-1.5 w-full" />
                <span className="text-xs font-bold text-foreground w-8 text-right">{lifePrkProgress.toFixed(0)}%</span>
            </div>
          </div>
        </AccordionTrigger>
        
      <AccordionContent className="pt-2 px-2">
        {areaPrkList}
      </AccordionContent>
      </div>
    </AccordionItem>
  );
}
