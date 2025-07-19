'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ListTodo } from 'lucide-react';
import type { HabitTask } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';

interface WeeklyCommitmentsCardProps {
  commitments: HabitTask[];
  selectedDate: Date;
  onToggle: (id: string, completed: boolean, date: Date) => void;
  onEdit: (task: HabitTask) => void;
  onArchive: (id: string) => void;
}

export function WeeklyCommitmentsCard({ commitments, selectedDate, onToggle, onEdit, onArchive }: WeeklyCommitmentsCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (commitments.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card className="mb-6 shadow-md transition-shadow hover:shadow-lg">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                Compromisos de la Semana
              </CardTitle>
              <CardDescription>Tareas importantes sin día fijo. ¡No las olvides!</CardDescription>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {commitments.map((commitment) => (
              <HabitTaskListItem
                key={commitment.id}
                item={commitment}
                onToggle={onToggle}
                onEdit={onEdit}
                onArchive={onArchive}
                selectedDate={selectedDate}
                variant="dashboard"
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
