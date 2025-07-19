
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ListTodo } from 'lucide-react';
import type { HabitTask, CommitmentPeriod } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';

interface CommitmentsCardProps {
  commitments: HabitTask[];
  selectedDate: Date;
  onToggle: (id: string, completed: boolean, date: Date) => void;
  onEdit: (task: HabitTask) => void;
  onArchive: (id: string) => void;
}

const periodLabels: Record<CommitmentPeriod, string> = {
  weekly: 'Semanales',
  monthly: 'Mensuales',
  quarterly: 'Trimestrales',
  semi_annually: 'Semestrales',
  annually: 'Anuales',
};

export function CommitmentsCard({ commitments, selectedDate, onToggle, onEdit, onArchive }: CommitmentsCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (commitments.length === 0) {
    return null;
  }

  // Determine the highest-level commitment type present for the title
  const getCardTitle = () => {
    const periods = new Set(commitments.map(c => c.commitment_period).filter((p): p is CommitmentPeriod => !!p));
    if (periods.size === 0) return "Compromisos";
    
    const periodOrder: CommitmentPeriod[] = ['annually', 'semi_annually', 'quarterly', 'monthly', 'weekly'];
    const presentPeriods = periodOrder.filter(p => periods.has(p));
    
    if (presentPeriods.length === 0) return "Compromisos";

    // Show the labels for all present commitment types
    return "Compromisos: " + presentPeriods.map(p => periodLabels[p]).join(' / ');
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
                  {getCardTitle()}
                </CardTitle>
                <CardDescription>Tareas importantes sin día fijo. ¡No las olvides!</CardDescription>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardHeader>
          </div>
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
