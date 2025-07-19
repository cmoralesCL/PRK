
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ListTodo, Plus } from 'lucide-react';
import type { HabitTask } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { logHabitTaskCompletion, removeHabitTaskCompletion, archiveHabitTask } from '@/app/actions';
import { AddHabitTaskDialog, HabitTaskFormValues } from './add-habit-task-dialog';

interface CommitmentsSidebarProps {
  commitments: HabitTask[];
  selectedDate: Date;
}

export function CommitmentsSidebar({ commitments, selectedDate }: CommitmentsSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, completed: boolean, date: Date, progressValue?: number) => {
     const task = commitments.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id, task.type, completionDate, progressValue);
        } else {
          await removeHabitTaskCompletion(id, task.type, completionDate);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleEdit = (task: HabitTask) => {
    // TODO: Implement edit functionality
  };

  const handleArchive = (id: string) => {
    startTransition(async () => {
        try {
          await archiveHabitTask(id, selectedDate.toISOString());
          toast({ title: 'Hábito/Tarea Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el Hábito/Tarea.' });
        }
    });
  };

  const weeklyCommitments = commitments.filter(c => c.frequency === 'weekly');
  const monthlyCommitments = commitments.filter(c => c.frequency === 'monthly');
  
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
                onToggle={handleToggle}
                onEdit={handleEdit}
                onArchive={handleArchive}
                selectedDate={selectedDate}
                variant="dashboard"
              />
            ))}
          </div>
    )
  }

  return (
      <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                Compromisos
            </CardTitle>
            <CardDescription>Metas sin día fijo.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
        <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
            <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly" className="mt-4">
            {renderCommitmentList(weeklyCommitments)}
            </TabsContent>
            <TabsContent value="monthly" className="mt-4">
                {renderCommitmentList(monthlyCommitments)}
            </TabsContent>
            <TabsContent value="quarterly" className="mt-4">
            {renderCommitmentList([])}
            </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
  );
}
