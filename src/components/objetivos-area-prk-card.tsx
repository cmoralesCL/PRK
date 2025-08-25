
'use client';

import { Plus, Archive, ChevronDown, Pencil, CheckSquare, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Phase, Pulse, ColorTheme } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { HabitTaskListItem } from './habit-task-list-item';


interface ObjetivosAreaPrkCardProps {
  phase: Phase;
  pulses: Pulse[];
  onAddPulse: (phaseId: string) => void;
  onEditPulse: (pulse: Pulse) => void;
  onArchive: (id: string) => void;
  onEdit: (phase: Phase) => void;
  onArchivePulse: (id: string) => void;
  colorTheme: ColorTheme;
}

export function ObjetivosAreaPrkCard({
  phase,
  pulses,
  onAddPulse,
  onEditPulse,
  onArchive,
  onEdit,
  onArchivePulse,
  colorTheme
}: ObjetivosAreaPrkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

         <CollapsibleContent>
           <CardContent className="px-3 pb-3">
            <div className="space-y-2 border-t pt-3">
                 {pulses.map(pulse => (
                    <HabitTaskListItem 
                        key={pulse.id}
                        item={pulse}
                        selectedDate={new Date()} // Date doesn't matter for read-only view
                        variant="read-only"
                        onEdit={() => onEditPulse(pulse)}
                        onArchive={() => onArchivePulse(pulse.id)}
                    />
                 ))}
                 <Button variant="outline" size="sm" onClick={() => onAddPulse(phase.id)} className="w-full h-8 mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Pulso
                </Button>
            </div>
           </CardContent>
         </CollapsibleContent>
       </Collapsible>
    </Card>
  );
}
