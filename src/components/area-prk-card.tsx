
'use client';

import { Plus, Archive, ChevronDown, Pencil, Check, Square, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import type { Phase, Pulse, ColorTheme } from '@/lib/types';
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


interface PhaseCardProps {
  phase: Phase;
  actions: Pulse[];
  onAddPulse: (phaseId: string) => void;
  onEditPulse: (pulse: Pulse) => void;
  onArchive: (id: string) => void;
  onEdit: (phase: Phase) => void;
  onArchivePulse: (id: string) => void;
  colorTheme: ColorTheme;
}

export function PhaseCard({
  phase,
  actions,
  onAddPulse,
  onEditPulse,
  onArchive,
  onEdit,
  onArchivePulse,
  colorTheme
}: PhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
            <CollapsibleTrigger asChild>
                <div className="flex-grow text-left cursor-pointer">
                  <div className="flex items-center gap-3">
                     <h3 className="font-headline text-sm font-semibold text-card-foreground">{phase.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 pt-1.5">
                      <Progress value={phase.progress} className="h-1.5 flex-grow" colorTheme={colorTheme} />
                      <span className="text-xs font-semibold w-8 text-right">{phase.progress.toFixed(0)}%</span>
                  </div>
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
                        <DropdownMenuItem onClick={() => onEdit(phase)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Fase
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(phase.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar Fase
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
            </div>
          </div>

         <CollapsibleContent className="px-3 pb-3">
            <div className="space-y-2 border-t pt-3">
                 {actions.map(action => (
                    <HabitTaskListItem 
                        key={action.id}
                        item={action}
                        onEdit={onEditPulse}
                        onArchive={() => onArchivePulse(action.id)}
                        variant="read-only"
                    />
                 ))}
                 <Button variant="outline" size="sm" onClick={() => onAddPulse(phase.id)} className="w-full h-8 mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Pulso
                </Button>
            </div>
         </CollapsibleContent>
       </Collapsible>
    </Card>
  );
}
