
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ListTodo } from 'lucide-react';
import type { Orbit, Phase, Pulse } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';
import { Separator } from './ui/separator';

interface CommitmentsCardProps {
  title?: string;
  description?: string;
  commitments: Pulse[];
  phases: Phase[];
  orbits: Orbit[];
  selectedDate: Date;
  onToggle: (id: string, completed: boolean, date: Date, progressValue?: number) => void;
  onUndo?: (id: string, date: Date) => void;
  onEdit: (task: Pulse) => void;
  onArchive: (id: string) => void;
}


export function CommitmentsCard({ 
    title = "Compromisos",
    description = "Tareas importantes sin día fijo. ¡No las olvides!",
    commitments, 
    phases,
    orbits,
    selectedDate, 
    onToggle, 
    onUndo, 
    onEdit, 
    onArchive 
}: CommitmentsCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const weeklyCommitments = commitments.filter(c => c.frequency?.startsWith('SEMANAL'));
  const monthlyCommitments = commitments.filter(c => c.frequency?.startsWith('MENSUAL'));
  // Add other periods as needed
  
  const phasesMap = new Map(phases.map(p => [p.id, p]));
  const orbitsMap = new Map(orbits.map(o => [o.id, o]));

  if (commitments.length === 0) {
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">No hay compromisos para este período.</p>
            </CardContent>
        </Card>
    );
  }
  
  const renderCommitmentList = (tasks: Pulse[]) => {
    if (tasks.length === 0) {
        return null;
    }
    return (
         <div className="space-y-2">
            {tasks.map((commitment) => {
              const taskPhases = commitment.phase_ids.map(id => phasesMap.get(id)).filter(Boolean) as Phase[];
              const taskOrbits = Array.from(new Set(taskPhases.map(p => orbitsMap.get(p.life_prk_id)))).filter(Boolean) as Orbit[];
              
              return (
              <HabitTaskListItem
                key={commitment.id}
                item={commitment}
                phases={taskPhases}
                orbits={taskOrbits}
                onToggle={onToggle}
                onUndo={onUndo}
                onEdit={onEdit}
                onArchive={() => onArchive(commitment.id)}
                selectedDate={selectedDate}
                variant="dashboard"
              />
            )})}
          </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card className="mb-6 shadow-md transition-shadow hover:shadow-lg">
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardHeader>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {weeklyCommitments.length > 0 && (
                <div>
                    <h3 className="text-md font-semibold mb-3">Compromisos Semanales</h3>
                    {renderCommitmentList(weeklyCommitments)}
                </div>
            )}
            
            {monthlyCommitments.length > 0 && weeklyCommitments.length > 0 && <Separator />}

            {monthlyCommitments.length > 0 && (
                <div>
                    <h3 className="text-md font-semibold mb-3">Compromisos Mensuales</h3>
                    {renderCommitmentList(monthlyCommitments)}
                </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
