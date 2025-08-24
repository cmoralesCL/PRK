
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
import { Separator } from './ui/separator';
import { differenceInDays, startOfToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


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
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = areaPrk.progress ?? 0;

  const summary = React.useMemo(() => {
    const completed = actions.filter(a => a.completedToday).length;
    const pending = actions.length - completed;
    const atRisk = actions.filter(a => a.is_critical && !a.completedToday).length;
    return { completed, pending, atRisk, total: actions.length };
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
  
  const pendingActions = actions.filter(a => !a.completedToday);

  return (
    <Card className="flex flex-col">
       <CardHeader className="p-4">
         <div className="flex justify-between items-start gap-2">
            <div className="flex-grow">
                <CardTitle className="font-headline text-base text-card-foreground">{areaPrk.title}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
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
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
         </div>
         <div className="flex items-center gap-3 pt-3">
             <Progress value={progress} className="h-2 w-full" />
             <span className="text-xs font-semibold w-10 text-right">{Math.round(progress)}%</span>
        </div>
         {upcomingTask && (
            <div className={cn(
                "flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full mt-2 w-fit",
                upcomingTask.days < 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
            )}>
                <Flame className="h-3 w-3" />
                <span>Vence {upcomingTask.days === 0 ? 'hoy' : upcomingTask.days === 1 ? 'mañana' : `en ${upcomingTask.days} días`}</span>
            </div>
        )}
       </CardHeader>
       <CardContent className="p-4 pt-0 flex-grow">
          <Separator className="mb-3" />
          <div className="space-y-2">
              {pendingActions.slice(0, 2).map((item) => (
                <HabitTaskListItem 
                  key={item.id} 
                  item={item} 
                  onEdit={onEditHabitTask} 
                  onArchive={() => onArchiveHabitTask(item.id)}
                  selectedDate={selectedDate} 
                />
              ))}
              
              {actions.length === 0 && (
                 <p className="text-xs text-muted-foreground text-center py-4">No hay acciones definidas.</p>
              )}

              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleContent className="space-y-2">
                     {pendingActions.slice(2).map((item) => (
                        <HabitTaskListItem 
                          key={item.id} 
                          item={item} 
                          onEdit={onEditHabitTask} 
                          onArchive={() => onArchiveHabitTask(item.id)}
                          selectedDate={selectedDate} 
                        />
                      ))}
                  </CollapsibleContent>
                   {pendingActions.length > 2 && (
                    <CollapsibleTrigger asChild>
                        <Button variant="link" size="sm" className="w-full mt-2">
                          {isExpanded ? 'Mostrar menos' : `Mostrar ${pendingActions.length - 2} más...`}
                        </Button>
                    </CollapsibleTrigger>
                  )}
              </Collapsible>

          </div>
       </CardContent>
       <CardFooter className="p-4 pt-0">
          <Button variant="outline" size="sm" onClick={() => onAddHabitTask(areaPrk.id)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Acción
          </Button>
       </CardFooter>
    </Card>
  );
}
