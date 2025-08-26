
'use client';

import { Plus, Archive, ChevronDown, Pencil, CheckSquare, Repeat, Target, CheckCircle, Circle, Zap } from 'lucide-react';
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
import React from 'react';
import { Card } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { THEMES } from '@/lib/themes';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { PulseListItem } from './pulse-list-item';
import { ProgressCircle } from './ui/progress-circle';

interface PhaseCardProps {
  phase: Phase;
  pulses: Pulse[];
  onAddPulse: (phaseId: string) => void;
  onEditPulse: (pulse: Pulse) => void;
  onArchive: (id: string) => void;
  onEdit: (phase: Phase) => void;
  onArchivePulse: (id: string) => void;
  colorTheme: ColorTheme;
}

export function AreaPrkCard({
  phase,
  pulses,
  onAddPulse,
  onEditPulse,
  onArchive,
  onEdit,
  onArchivePulse,
  colorTheme
}: PhaseCardProps) {
  const theme = THEMES[colorTheme];
  const phaseProgress = phase.progress ?? 0;

  return (
    <div className="pl-4">
      <Collapsible defaultOpen className="w-full">
        <CollapsibleTrigger asChild>
          <div className="flex w-full items-center gap-2 py-2 group cursor-pointer border-b last:border-b-0">
            <div className="flex items-start gap-3 flex-grow text-left">
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 mt-1" />
                <div className="p-1.5 rounded-full mt-0.5" style={{ background: theme.gradient, color: 'white' }}>
                    <Target className="h-4 w-4" />
                </div>
                <div className='flex-grow'>
                    <h3 className="font-semibold text-sm text-card-foreground leading-tight">{phase.title}</h3>
                    {phase.due_date && (
                        <Badge variant="outline" className="mt-1 text-xs">
                            {format(parseISO(phase.due_date), "d 'de' LLL, yyyy", { locale: es })}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <ProgressCircle progress={phaseProgress} className="h-12 w-12" />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pl-12 py-2">
            <div className="space-y-2">
                {pulses.map(pulse => (
                    <PulseListItem 
                        key={pulse.id}
                        pulse={pulse}
                        colorTheme={colorTheme}
                        onEdit={() => onEditPulse(pulse)}
                        onArchive={() => onArchivePulse(pulse.id)}
                    />
                ))}
                <Button variant="ghost" size="sm" onClick={() => onAddPulse(phase.id)} className="w-full h-8 mt-2 text-muted-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Pulso
                </Button>
            </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
