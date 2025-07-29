
'use client';

import { useState, useTransition, useEffect } from 'react';
import { SimpleTask } from '@/lib/simple-tasks-types';
import { addSimpleTask, deleteSimpleTask, updateSimpleTaskCompletion, updateSimpleTask, getRegisteredUsers, shareTaskWithUser, unshareTaskWithUser } from '@/app/actions';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Trash2, Plus, Loader2, Calendar as CalendarIcon, Pencil, Save, XCircle, Share2, User, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DatePicker } from './ui/date-picker';
import { format, differenceInDays, startOfToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';


interface SimpleTaskListProps {
  initialTasks: SimpleTask[];
}

export function SimpleTaskList({ initialTasks }: SimpleTaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDueDate, setEditedDueDate] = useState<Date | undefined>();

  // State for sharing dialog
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<SimpleTask | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<{ id: string, email: string }[]>([]);

  useEffect(() => {
    if (isShareDialogOpen && registeredUsers.length === 0) {
        startTransition(async () => {
            const users = await getRegisteredUsers();
            setRegisteredUsers(users);
        });
    }
  }, [isShareDialogOpen, registeredUsers.length]);

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
        const dueDateString = dueDate ? format(dueDate, 'yyyy-MM-dd') : null;
        await addSimpleTask(newTaskTitle, dueDateString);
        setNewTaskTitle('');
        setDueDate(undefined);
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

  const handleEditClick = (task: SimpleTask) => {
    setEditingTaskId(task.id);
    setEditedTitle(task.title);
    setEditedDueDate(task.due_date ? parseISO(task.due_date) : undefined);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editedTitle.trim()) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "El título de la tarea no puede estar vacío.",
        });
        return;
    }
    startTransition(async () => {
      try {
        const dueDateString = editedDueDate ? format(editedDueDate, 'yyyy-MM-dd') : null;
        await updateSimpleTask(id, editedTitle, dueDateString);
        setEditingTaskId(null);
        toast({ title: '¡Tarea actualizada!' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo actualizar la tarea.',
        });
      }
    });
  };

  const openShareDialog = (task: SimpleTask) => {
    setSharingTask(task);
    setShareDialogOpen(true);
  };

  const handleShare = (userIdToShareWith: string) => {
    if (!sharingTask) return;
    startTransition(async () => {
        try {
            await shareTaskWithUser(sharingTask.id, userIdToShareWith);
            toast({ title: "Tarea compartida!"});
            // No need to close dialog, user might share with more people
        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo compartir la tarea.' });
        }
    });
  };
  
  const handleUnshare = (userIdToUnshare: string) => {
    if (!sharingTask) return;
     startTransition(async () => {
        try {
            await unshareTaskWithUser(sharingTask.id, userIdToUnshare);
            toast({ title: "Acceso revocado"});
        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo revocar el acceso.' });
        }
    });
  };


  const DueDateInfo = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return null;

    const today = startOfToday();
    const dueDateObj = parseISO(dueDate);
    const daysLeft = differenceInDays(dueDateObj, today);

    let text = '';
    let textColor = '';

    if (daysLeft < 0) {
        text = `Venció hace ${Math.abs(daysLeft)} días`;
        textColor = 'text-destructive';
    } else if (daysLeft === 0) {
        text = 'Vence hoy';
        textColor = 'text-orange-600';
    } else if (daysLeft === 1) {
        text = 'Vence mañana';
        textColor = 'text-yellow-600';
    } else if (daysLeft <= 7) {
        text = `Vence en ${daysLeft} días`;
         textColor = 'text-yellow-700';
    } else {
        text = `Vence el ${format(dueDateObj, 'd MMM', { locale: es })}`;
    }
    
    return (
        <div className="flex items-center gap-2 mt-1 pl-1">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
             <span className={cn("text-xs font-medium", textColor || 'text-muted-foreground')}>{text}</span>
        </div>
    );
  };


  return (
    <>
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mis Tareas</CardTitle>
        <CardDescription>
          Una lista simple para tus pendientes, con fechas de finalización opcionales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="¿Qué necesitas hacer?"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            disabled={isPending}
            className="flex-grow"
          />
          <div className="flex gap-2">
            <DatePicker date={dueDate} setDate={setDueDate} />
            <Button onClick={handleAddTask} disabled={isPending} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline ml-2">Agregar</span>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {initialTasks.map((task) => {
            const isOwner = !task.owner_email; // If owner_email is null, current user is the owner
            return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg border transition-colors",
                task.is_completed ? "bg-muted/50" : "bg-card",
                editingTaskId === task.id && "bg-secondary/50"
              )}
            >
              <Checkbox
                id={`task-${task.id}`}
                checked={task.is_completed}
                onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                className="h-5 w-5 mt-1"
                disabled={isPending || editingTaskId === task.id}
              />
              <div className="flex-grow">
                 {editingTaskId === task.id ? (
                    <div className="space-y-2">
                        <Input 
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="h-9"
                            disabled={isPending}
                        />
                        <DatePicker date={editedDueDate} setDate={setEditedDueDate} />
                    </div>
                 ) : (
                    <>
                        <Label
                            htmlFor={`task-${task.id}`}
                            className={cn(
                            "text-sm font-medium",
                            task.is_completed && "line-through text-muted-foreground"
                            )}
                        >
                            {task.title}
                        </Label>
                        <DueDateInfo dueDate={task.due_date} />
                        {!isOwner && (
                            <Badge variant="outline" className="mt-2">Compartida por {task.owner_email}</Badge>
                        )}
                    </>
                 )}
              </div>
              <div className="flex gap-1">
                {editingTaskId === task.id ? (
                    <>
                        <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(task.id)} className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700" disabled={isPending}>
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 text-muted-foreground hover:bg-gray-200" disabled={isPending}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        {isOwner && (
                            <>
                            <Button variant="ghost" size="icon" onClick={() => openShareDialog(task)} className="h-8 w-8 text-muted-foreground hover:bg-blue-100 hover:text-blue-600" disabled={isPending}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleEditClick(task)} className="h-8 w-8 text-muted-foreground hover:bg-blue-100 hover:text-blue-600" disabled={isPending}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTask(task.id)}
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                disabled={isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </>
                        )}
                    </>
                )}
              </div>
            </div>
          )})}
           {initialTasks.length === 0 && !isPending && (
            <p className="text-center text-muted-foreground py-8">
              ¡Todo listo! No tienes tareas pendientes.
            </p>
          )}
        </div>
      </CardContent>
    </Card>

    <Dialog open={isShareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Compartir Tarea</DialogTitle>
                <DialogDescription>
                    Comparte "{sharingTask?.title}" con otros usuarios.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-72">
                <div className="space-y-2 pr-4">
                    {isPending && registeredUsers.length === 0 && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />}
                    {registeredUsers.map(user => {
                        const isSharedWith = sharingTask?.shared_with?.some(su => su.user_id === user.id);
                        return (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{user.email}</span>
                                </div>
                                {isSharedWith ? (
                                    <Button variant="outline" size="sm" onClick={() => handleUnshare(user.id)} disabled={isPending}>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Dejar de compartir
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={() => handleShare(user.id)} disabled={isPending}>
                                        <User className="mr-2 h-4 w-4" />
                                        Compartir
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
             <DialogFooter>
                <Button variant="secondary" onClick={() => setShareDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
