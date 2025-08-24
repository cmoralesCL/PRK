
'use client';

import * as React from 'react';
import { Target, Plus, Archive, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PhaseCard } from './area-prk-card';
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

interface OrbitSectionProps {
  orbit: Orbit;
  phases: Phase[];
  allPulses?: Pulse[];
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

  return (
    <AccordionItem value={orbit.id} className="border-b-0">
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
                                {orbit.title}
                            </h2>
                            {orbit.description && (
                                <p className="text-xs text-muted-foreground font-normal max-w-md">{orbit.description}</p>
                            )}
                        </div>
                    </div>
                </AccordionTrigger>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onAddPhase(orbit.id)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Fase
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
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
             <div className="flex items-center gap-2 w-full mt-2">
                <Progress value={orbitProgress} className="h-1.5 w-full" colorTheme={colorTheme} />
                <span className="text-xs font-bold text-foreground w-8 text-right">{orbitProgress.toFixed(0)}%</span>
            </div>
        </div>
        
      <AccordionContent className="pb-2 px-2">
        <div className="pt-2 space-y-2 border-t mt-2">
            {phases.length > 0 ? (
            phases.map((kp) => (
                <PhaseCard
                    key={kp.id}
                    phase={kp}
                    actions={allPulses.filter(ht => Array.isArray(ht.phase_ids) && ht.phase_ids.includes(kp.id))}
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
                    <p className="text-muted-foreground text-xs">Aún no hay Fases para esta Órbita.</p>
                    <Button variant="link" size="sm" onClick={() => onAddPhase(orbit.id)}>¡Agrega la primera!</Button>
                </div>
            )}
        </div>
      </AccordionContent>
      </div>
    </AccordionItem>
  );
}
