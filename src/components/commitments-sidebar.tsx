
'use client';

import { useTransition, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ListTodo, PanelRightClose, PanelRightOpen, Plus } from 'lucide-react';
import type { HabitTask } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { logHabitTaskCompletion, removeHabitTaskCompletion, archiveHabitTask } from '@/app/actions';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';


interface CommitmentsSidebarProps {
  commitments: HabitTask[];
  selectedDate: Date;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddCommitment: (frequency: 'weekly' | 'monthly') => void;
  onEditCommitment: (task: HabitTask) => void;
}

export function CommitmentsSidebar({ commitments, selectedDate, isOpen, setIsOpen, onAddCommitment, onEditCommitment }: CommitmentsSidebarProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');

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
    onEditCommitment(task);
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

  if (!isOpen) {
    return (
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <PanelRightOpen className="h-6 w-6" />
        </Button>
    )
  }

  return (
      <Card className="h-full w-full flex flex-col transition-all duration-300 ease-in-out">
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="w-full">
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Compromisos
              </CardTitle>
              <CardDescription>Metas sin día fijo.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="flex-shrink-0">
                <PanelRightClose className="h-5 w-5" />
            </Button>
        </CardHeader>
        <CardContent className="flex-grow">
        <Tabs 
          defaultValue="weekly" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value as 'weekly' | 'monthly' | 'quarterly')}
        >
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
         <CardFooter>
            <Button className="w-full" onClick={() => onAddCommitment(activeTab as 'weekly' | 'monthly')}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Compromiso
            </Button>
        </CardFooter>
      </Card>
  );
}
