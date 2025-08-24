
'use client';

import { Gauge, Plus, Sparkles, Archive, ChevronDown, Pencil, Check, Square, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Separator } from './ui/separator';
import { differenceInDays, startOfToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import React from 'react';


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

  const summary = React.useMemo(() => {
    const completed = actions.filter(a => a.completedToday).length;
    const pending = actions.length - completed;
    const atRisk = actions.filter(a => a.is_critical && !a.completedToday).length;
    return { completed, pending, atRisk };
  }, [actions]);

  const upcomingTask = React.useMemo(() => {
    const today = startOfToday();
    let soonestTask: { task: HabitTask; days: number } | null = null;

    for (const task of actions) {
        if (!task.completedToday && task.due_date) {
            const dueDate = parseISO(task.due_date);
            const daysUntilDue = differenceInDays(dueDate, today);

            if (daysUntilDue >= 0 && (soonestTask === null || daysUntilDue < soonestTask.days)) {
                soonestTask = { task, days: daysUntilDue };
            }
        }
    }
    return soonestTask;
  }, [actions]);


  return (
    <AccordionItem value={areaPrk.id} className="border bg-card shadow-sm rounded-lg transition-shadow hover:shadow-md">
      <AccordionTrigger className="p-3 hover:no-underline group">
        <div className="w-full flex flex-col gap-3 text-left">
            {/* Top Row: Title, Summary, Menu */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-grow pr-2">
                    <div className="flex-shrink-0 bg-accent/10 text-accent p-1.5 rounded-full">
                        <Gauge className="h-4 w-4" />
                    </div>
                    <h3 className="font-headline text-base text-card-foreground flex-grow">{areaPrk.title}</h3>
                </div>
                 <div className="flex items-center flex-shrink-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mr-2">
                        <div className="flex items-center gap-1" title="Completadas">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>{summary.completed}</span>
                        </div>
                         <div className="flex items-center gap-1" title="Pendientes">
                            <Square className="h-3 w-3" />
                            <span>{summary.pending}</span>
                        </div>
                         <div className="flex items-center gap-1" title="Críticas no completadas">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>{summary.atRisk}</span>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
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
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 ml-1" />
                </div>
            </div>
            {/* Bottom Row: Progress Bar and Due Date */}
            <div className="flex items-center gap-3 pl-8">
                 <Progress value={progress} className="h-2 w-full" />
                 <span className="text-xs font-semibold w-10 text-right">{Math.round(progress)}%</span>
                  {upcomingTask && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full",
                        upcomingTask.days < 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    )}>
                        <Flame className="h-3 w-3" />
                        <span>Vence {upcomingTask.days === 0 ? 'hoy' : upcomingTask.days === 1 ? 'mañana' : `en ${upcomingTask.days} días`}</span>
                    </div>
                )}
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 pt-0">
          <Separator className="my-2" />
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
