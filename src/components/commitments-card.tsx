
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ListTodo } from 'lucide-react';
import type { HabitTask } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CommitmentsCardProps {
  commitments: HabitTask[];
  selectedDate: Date;
  onToggle: (id: string, completed: boolean, date: Date, progressValue?: number) => void;
  onEdit: (task: HabitTask) => void;
  onArchive: (id: string) => void;
}


export function CommitmentsCard({ commitments, selectedDate, onToggle, onEdit, onArchive }: CommitmentsCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const weeklyCommitments = commitments.filter(c => c.frequency === 'weekly');
  const monthlyCommitments = commitments.filter(c => c.frequency === 'monthly');
  // Add other periods as needed

  if (commitments.length === 0) {
    return null;
  }
  
  const renderCommitmentList = (tasks: HabitTask[]) => {
    if (tasks.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No hay compromisos para este período.</p>;
    }
    return (
         <div className="space-y-2">
            {tasks.map((commitment) => (
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
                  Compromisos
                </CardTitle>
                <CardDescription>Tareas importantes sin día fijo. ¡No las olvides!</CardDescription>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardHeader>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensual</TabsTrigger>
                {/* <TabsTrigger value="quarterly">Trimestral</TabsTrigger> */}
              </TabsList>
              <TabsContent value="weekly">
                {renderCommitmentList(weeklyCommitments)}
              </TabsContent>
              <TabsContent value="monthly">
                 {renderCommitmentList(monthlyCommitments)}
              </TabsContent>
              {/* <TabsContent value="quarterly">
                {renderCommitmentList([])}
              </TabsContent> */}
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
