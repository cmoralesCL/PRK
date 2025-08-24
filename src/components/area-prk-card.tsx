
'use client';

import { Gauge, Plus, Sparkles, Archive, ChevronDown, Pencil, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import type { AreaPrk, HabitTask } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState } from 'react';
import { Separator } from './ui/separator';

interface AreaPrkCardProps {
  areaPrk: AreaPrk;
  actions: HabitTask[];
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
  onArchive: (id: string) => void;
  onEdit: (areaPrk: AreaPrk) => void;
  onArchiveHabitTask: (id: string) => void;
  selectedDate: Date;
}

export function AreaPrkCard({
  areaPrk,
  actions,
  onAddHabitTask,
  onEditHabitTask,
  onGetAiSuggestions,
  onArchive,
  onEdit,
  onArchiveHabitTask,
  selectedDate,
}: AreaPrkCardProps) {
  const progress = areaPrk.progress ?? 0;
  const completedActionsCount = actions.filter(a => a.completedToday).length;
  const totalActionsCount = actions.length;

  return (
    <AccordionItem value={areaPrk.id} className="border bg-card/70 shadow-sm rounded-lg transition-shadow hover:shadow-md">
      <AccordionTrigger className="p-4 hover:no-underline">
        <div className="w-full flex flex-col gap-2 text-left">
          <div className="flex justify-between items-start w-full">
            <h3 className="font-headline text-base flex items-center gap-2 text-card-foreground">
              <div className="flex-shrink-0 bg-accent/10 text-accent p-1.5 rounded-full">
                <Gauge className="h-4 w-4" />
              </div>
              {areaPrk.title}
            </h3>
            <div className="flex items-center -mr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit(areaPrk)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Área
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onGetAiSuggestions(areaPrk)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sugerir Acciones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(areaPrk.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archivar Área
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
               <ChevronDown className="h-4 w-4 ml-1 shrink-0 transition-transform duration-200" />
            </div>
          </div>
          <div className="space-y-1 pr-8">
             <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progreso</span>
                <span>({completedActionsCount}/{totalActionsCount} acciones)</span>
              </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 pt-0">
          <Separator className="my-4" />
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Acciones</h4>
             <Button variant="secondary" size="sm" onClick={() => onAddHabitTask(areaPrk.id)} className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Acción
            </Button>
          </div>
          <div className="space-y-2">
              {actions.length > 0 ? (
                actions.map((item) => (
                  <HabitTaskListItem 
                    key={item.id} 
                    item={item} 
                    onEdit={onEditHabitTask} 
                    onArchive={() => onArchiveHabitTask(item.id)}
                    selectedDate={selectedDate} 
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No hay acciones definidas para esta área.</p>
              )}
          </div>
      </AccordionContent>
    </AccordionItem>
  );
}
