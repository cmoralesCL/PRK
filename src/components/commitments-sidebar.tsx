

'use client';

import { useTransition, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ListTodo, PanelRightClose, PanelRightOpen, Plus } from 'lucide-react';
import type { HabitTask, HabitFrequency, ProgressLog } from '@/lib/types';
import { HabitTaskListItem } from './habit-task-list-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { logHabitTaskCompletion, removeHabitTaskCompletion, archiveHabitTask } from '@/app/actions';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


type CommitmentTab = 'weekly' | 'monthly' | 'quarterly';
const tabToFrequencyMap: Record<CommitmentTab, HabitFrequency> = {
    weekly: 'SEMANAL_ACUMULATIVO',
    monthly: 'MENSUAL_ACUMULATIVO',
    quarterly: 'TRIMESTRAL_ACUMULATIVO'
};

interface CommitmentsSidebarProps {
  commitments: HabitTask[];
  selectedDate: Date;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddCommitment: (frequency: HabitFrequency) => void;
  onEditCommitment: (task: HabitTask) => void;
}

export function CommitmentsSidebar({ commitments, selectedDate, isOpen, setIsOpen, onAddCommitment, onEditCommitment }: CommitmentsSidebarProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<CommitmentTab>('weekly');

  const handleToggle = (id: string, completed: boolean, date: Date, progressValue?: number) => {
     const task = commitments.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        await logHabitTaskCompletion(id, task.type, completionDate, progressValue);
        toast({ title: "¡Progreso registrado!" });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleUndo = (id: string, date: Date) => {
     const task = commitments.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];
    startTransition(async () => {
        try {
            await removeHabitTaskCompletion(id, task.type, completionDate);
            toast({ title: "Registro deshecho" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo deshacer la acción.' });
        }
    });
  }

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

  const weeklyCommitments = commitments.filter(c => c.frequency?.startsWith('SEMANAL_ACUMULATIVO'));
  const monthlyCommitments = commitments.filter(c => c.frequency?.startsWith('MENSUAL_ACUMULATIVO'));
  const quarterlyCommitments = commitments.filter(c => c.frequency?.startsWith('TRIMESTRAL_ACUMULATIVO'));
  
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
                onUndo={handleUndo}
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
          onValueChange={(value) => setActiveTab(value as CommitmentTab)}
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
              {renderCommitmentList(quarterlyCommitments)}
            </TabsContent>
        </Tabs>
        </CardContent>
         <CardFooter>
            <Button className="w-full" onClick={() => onAddCommitment(tabToFrequencyMap[activeTab])}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Compromiso
            </Button>
        </CardFooter>
      </Card>
  );
}
