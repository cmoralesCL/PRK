
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
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onArchive: (id: string) => void;
  onEdit: (areaPrk: AreaPrk) => void;
  onArchiveHabitTask: (id: string) => void;
  selectedDate: Date;
}

export function AreaPrkCard({
  areaPrk,
  onAddHabitTask,
  onEditHabitTask,
  onArchive,
  onEdit,
  onArchiveHabitTask,
  selectedDate,
}: AreaPrkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="flex flex-col bg-muted/40">
       <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
         <div className="flex w-full items-start justify-between gap-2 p-3 group">
            <CollapsibleTrigger className="flex-grow text-left">
              <div className="flex items-center gap-3">
                 <h3 className="font-headline text-sm font-semibold text-card-foreground">{areaPrk.title}</h3>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                  <Progress value={0} className="h-1.5 w-full" />
                  <span className="text-xs font-semibold w-8 text-right">0%</span>
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
                 <Button variant="outline" size="sm" onClick={() => onAddHabitTask(areaPrk.id)} className="w-full h-8">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Acción
                </Button>
            </div>
         </CollapsibleContent>
       </Collapsible>
    </Card>
  );
}
