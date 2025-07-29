'use client';

import { useState, useTransition } from 'react';
import { SimpleTask } from '@/lib/simple-tasks-types';
import { addSimpleTask, deleteSimpleTask, updateSimpleTaskCompletion } from '@/app/actions';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SimpleTaskListProps {
  initialTasks: SimpleTask[];
}

export function SimpleTaskList({ initialTasks }: SimpleTaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "El título de la tarea no puede estar vacío.",
        });
        return;
    }
    startTransition(async () => {
      try {
        await addSimpleTask(newTaskTitle);
        // We don't need to manually update state, revalidation will fetch the new list.
        setNewTaskTitle('');
        toast({ title: '¡Tarea agregada!' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo agregar la tarea.',
        });
      }
    });
  };

  const handleToggleTask = (id: string, isCompleted: boolean) => {
    startTransition(async () => {
      try {
        await updateSimpleTaskCompletion(id, isCompleted);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo actualizar la tarea.',
        });
      }
    });
  };

  const handleDeleteTask = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSimpleTask(id);
        toast({ title: 'Tarea eliminada' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar la tarea.',
        });
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mis Tareas</CardTitle>
        <CardDescription>
          Una lista simple para tus pendientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="¿Qué necesitas hacer?"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            disabled={isPending}
          />
          <Button onClick={handleAddTask} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">Agregar</span>
          </Button>
        </div>

        <div className="space-y-3">
          {initialTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                task.is_completed ? "bg-muted/50" : "bg-card"
              )}
            >
              <Checkbox
                id={`task-${task.id}`}
                checked={task.is_completed}
                onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                className="h-5 w-5"
                disabled={isPending}
              />
              <Label
                htmlFor={`task-${task.id}`}
                className={cn(
                  "flex-grow text-sm font-medium",
                  task.is_completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteTask(task.id)}
                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
           {initialTasks.length === 0 && !isPending && (
            <p className="text-center text-muted-foreground py-8">
              ¡Todo listo! No tienes tareas pendientes.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
