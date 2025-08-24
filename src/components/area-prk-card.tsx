
'use client';

import { Plus, Archive, ChevronDown, Pencil, Check, Square, AlertTriangle, Flame } from 'lucide-react';
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
import { differenceInDays, startOfToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { Card } from './ui/card';
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
  onArchive: (id: string) => void;
  onEdit: (areaPrk: AreaPrk) => void;
  onArchiveHabitTask: (id: string) => void;
}

export function AreaPrkCard({
  areaPrk,
  actions,
  onAddHabitTask,
  onEditHabitTask,
  onArchive,
  onEdit,
  onArchiveHabitTask,
}: AreaPrkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // This logic is now purely for display, not interaction
  const completedCount = actions.filter(a => a.completedToday).length;
  const pendingCount = actions.length - completedCount;
  const criticalPending = actions.filter(a => a.is_critical && !a.completedToday).length;
  
  const soonestDueDate = actions
    .filter(a => a.due_date && !a.completedToday)
    .map(a => parseISO(a.due_date!))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  let dueDateInfo = null;
  if (soonestDueDate) {
    const daysUntilDue = differenceInDays(soonestDueDate, startOfToday());
    if (daysUntilDue <= 1) {
      dueDateInfo = `🔥 Vence ${daysUntilDue === 0 ? 'hoy' : 'mañana'}`;
    }
  }
  
  return (
    <Card className="flex flex-col bg-muted/30">
       <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
         <div className="flex w-full items-center gap-2 p-3 group">
            <CollapsibleTrigger className="flex-grow text-left">
              <div className="flex items-center gap-3">
                 <h3 className="font-headline text-sm font-semibold text-card-foreground">{areaPrk.title}</h3>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                  <Progress value={areaPrk.progress} className="h-1.5 flex-grow" />
                  <span className="text-xs font-semibold w-8 text-right">{areaPrk.progress.toFixed(0)}%</span>
              </div>
            </CollapsibleTrigger>
            <div className="flex items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => onEdit(areaPrk)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Área
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(areaPrk.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar Área
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180`} />
            </div>
          </div>

         <CollapsibleContent className="px-3 pb-3">
            <div className="space-y-2 border-t pt-3">
                 {actions.map(action => (
                    <HabitTaskListItem 
                        key={action.id}
                        item={action}
                        onEdit={onEditHabitTask}
                        onArchive={() => onArchiveHabitTask(action.id)}
                        variant="read-only"
                    />
                 ))}
                 <Button variant="outline" size="sm" onClick={() => onAddHabitTask(areaPrk.id)} className="w-full h-8 mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Acción
                </Button>
            </div>
         </CollapsibleContent>
       </Collapsible>
    </Card>
  );
}
