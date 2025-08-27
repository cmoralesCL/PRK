'use client';

import * as React from 'react';
import { Target, Plus, Archive, MoreVertical, Pencil, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaPrkCard } from './area-prk-card';
import type { Orbit, Phase, Pulse } from '@/lib/types';
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
import { ProgressCircle } from './ui/progress-circle';
import { Badge } from './ui/badge';

interface OrbitSectionProps {
  orbit: Orbit;
  phases: Phase[];
  allPulses: Pulse[];
  onAddPhase: (orbitId: string) => void;
  onEditPhase: (phase: Phase) => void;
  onAddPulse: (phaseId: string) => void;
  onEditPulse: (pulse: Pulse) => void;
  onArchive: (id: string) => void;
  onEdit: (orbit: Orbit) => void;
  onArchivePhase: (id: string) => void;
  onArchivePulse: (id: string) => void;
}

export function LifePrkSection({
  orbit,
  phases,
  allPulses = [],
  onAddPhase,
  onEditPhase,
  onAddPulse,
  onEditPulse,
  onArchive,
  onEdit,
  onArchivePhase,
  onArchivePulse,
}: OrbitSectionProps) {

  const orbitProgress = orbit.progress ?? 0;
  const colorTheme = orbit.color_theme || 'mint';
  const theme = THEMES[colorTheme];
  
  const pulseCount = phases.reduce((acc, phase) => {
    return acc + allPulses.filter(p => p.phase_ids.includes(phase.id)).length;
  }, 0);

  return (
    <AccordionItem value={orbit.id} className="border-b-0">
      <div className="bg-card rounded-lg shadow-sm border">
        <div className="p-3 flex items-center justify-between gap-4 w-full">
            <AccordionTrigger className="p-0 hover:no-underline flex-grow">
                <div className="flex items-start gap-3 text-left">
                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 mt-1" />
                    <div className="flex-shrink-0 text-white p-2 rounded-full mt-0.5" style={{ background: theme.gradient }}>
                        <Target className="h-5 w-5" />
                    </div>
                    <div className='flex-grow'>
                        <h2 className="text-md font-semibold leading-tight text-foreground">
                            {orbit.title}
                        </h2>
                        {orbit.description && (
                            <p className="text-sm text-muted-foreground font-normal">{orbit.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{phases.length} Fases</Badge>
                            <Badge variant="secondary">{pulseCount} Pulsos</Badge>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 flex-shrink-0">
                <ProgressCircle progress={orbitProgress} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(orbit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Órbita
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(orbit.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar Órbita
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        
      <AccordionContent className="pb-2 px-3">
        <div className="pt-2 space-y-2 border-t mt-2">
            {phases.length > 0 ? (
            phases.map((kp) => (
                <AreaPrkCard
                    key={kp.id}
                    phase={kp}
                    pulses={allPulses.filter(ht => Array.isArray(ht.phase_ids) && ht.phase_ids.includes(kp.id))}
                    onAddPulse={onAddPulse}
                    onEditPulse={onEditPulse}
                    onArchive={onArchivePhase}
                    onEdit={onEditPhase}
                    onArchivePulse={onArchivePulse}
                    colorTheme={colorTheme}
                />
                ))
            ) : (
                <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed mx-2">
                    <p className="text-muted-foreground text-sm">Aún no hay Fases para esta Órbita.</p>
                    <Button variant="link" size="sm" onClick={() => onAddPhase(orbit.id)}>¡Agrega la primera!</Button>
                </div>
            )}
             <div className="px-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onAddPhase(orbit.id)} className="w-full h-8 mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Fase
                </Button>
            </div>
        </div>
      </AccordionContent>
      </div>
    </AccordionItem>
  );
}
