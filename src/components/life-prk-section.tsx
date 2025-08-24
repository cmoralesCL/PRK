
'use client';

import * as React from 'react';
import { Target, Plus, Archive, MoreVertical, Pencil } from 'lucide-react';
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
import { THEMES } from '@/lib/themes';

interface LifePrkSectionProps {
  lifePrk: LifePrk;
  areaPrks: AreaPrk[];
  allHabitTasks?: HabitTask[];
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
  allHabitTasks = [],
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
  const colorTheme = lifePrk.color_theme || 'mint';
  const theme = THEMES[colorTheme];

  return (
    <AccordionItem value={lifePrk.id} className="border-b-0">
      <div className="bg-card rounded-lg shadow-sm border">
        <div className="p-3">
            <div className="flex items-start justify-between gap-2 w-full">
                <AccordionTrigger className="p-0 hover:no-underline flex-grow">
                    <div className="flex items-start gap-3 flex-grow text-left">
                        <div className="flex-shrink-0 text-white p-1.5 rounded-full mt-0.5" style={{ background: theme.gradient }}>
                            <Target className="h-4 w-4" />
                        </div>
                        <div className='flex-grow'>
                            <h2 className="text-sm font-semibold leading-tight text-foreground">
                                {lifePrk.title}
                            </h2>
                            {lifePrk.description && (
                                <p className="text-xs text-muted-foreground font-normal max-w-md">{lifePrk.description}</p>
                            )}
                        </div>
                    </div>
                </AccordionTrigger>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                </div>
            </div>
             <div className="flex items-center gap-2 w-full mt-2">
                <Progress value={lifePrkProgress} className="h-1.5 w-full" colorTheme={colorTheme} />
                <span className="text-xs font-bold text-foreground w-8 text-right">{lifePrkProgress.toFixed(0)}%</span>
            </div>
        </div>
        
      <AccordionContent className="pb-2 px-2">
        <div className="pt-2 space-y-2 border-t mt-2">
            {areaPrks.length > 0 ? (
            areaPrks.map((kp) => (
                <AreaPrkCard
                    key={kp.id}
                    areaPrk={kp}
                    actions={allHabitTasks.filter(ht => ht.area_prk_ids.includes(kp.id))}
                    onAddHabitTask={onAddHabitTask}
                    onEditHabitTask={onEditHabitTask}
                    onArchive={onArchiveAreaPrk}
                    onEdit={onEditAreaPrk}
                    onArchiveHabitTask={onArchiveHabitTask}
                    colorTheme={colorTheme}
                />
                ))
            ) : (
                <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed mx-2">
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
