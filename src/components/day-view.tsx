
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AddHabitTaskDialog, HabitTaskFormValues } from './add-habit-task-dialog';
import type { LifePrk, AreaPrk, HabitTask, DailyProgressSnapshot } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addHabitTask, 
    updateHabitTask,
    logHabitTaskCompletion,
    removeHabitTaskCompletion,
    archiveHabitTask,
} from '@/app/actions';
import { Button } from './ui/button';
import { parseISO, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { CommitmentsCard } from './commitments-card';
import { WeekNav } from './week-nav';
import { Plus, GripVertical } from 'lucide-react';
import { HabitTaskListItem } from './habit-task-list-item';
import { getDashboardData } from '@/app/server/queries';
import { ProgressCircle } from './ui/progress-circle';

interface DayViewProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  commitments: HabitTask[];
  initialSelectedDate: string;
  dailyProgressDataForWeek: DailyProgressSnapshot[];
}

export function DayView({
  lifePrks,
  areaPrks,
  habitTasks: initialHabitTasks,
  commitments,
  initialSelectedDate,
  dailyProgressDataForWeek,
}: DayViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [habitTasks, setHabitTasks] = useState(initialHabitTasks);
  
  // State for drag and drop
  const [draggedItem, setDraggedItem] = useState<HabitTask | null>(null);

  useEffect(() => {
    setSelectedDate(parseISO(initialSelectedDate));
    setHabitTasks(initialHabitTasks);
  }, [initialSelectedDate, initialHabitTasks]);

  // State for dialogs
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [defaultHabitTaskValues, setDefaultHabitTaskValues] = useState<Partial<HabitTaskFormValues> | undefined>(undefined);

  // State for editing items
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  
  // State for context when adding new items
  const [activeAreaPrkIds, setActiveAreaPrkIds] = useState<string[]>([]);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    startTransition(() => {
      router.push(`/day?date=${dateString}`);
    });
  }

  const handleOpenAddHabitTaskDialog = (areaPrkId?: string) => {
    setActiveAreaPrkIds(areaPrkId ? [areaPrkId] : []);
    setDefaultHabitTaskValues(undefined);
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  };
  
  const handleOpenEditHabitTaskDialog = (habitTask: HabitTask) => {
    setEditingHabitTask(habitTask);
    setDefaultHabitTaskValues(undefined);
    setActiveAreaPrkIds(habitTask.area_prk_ids);
    setHabitTaskDialogOpen(true);
  };

  const handleSaveHabitTask = (values: Partial<HabitTask>) => {
    startTransition(async () => {
        try {
            if (editingHabitTask) {
                await updateHabitTask(editingHabitTask.id, values);
                toast({ title: '¡Acción Actualizada!', description: `Se ha actualizado "${values.title}".` });
            } else {
                await addHabitTask(values);
                toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
            }
        } catch (error) {
            console.error("Error al guardar la acción:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción. Revisa los campos e inténtalo de nuevo.' });
        }
    });
  };

  const handleToggleHabitTask = (id: string, completed: boolean, date: Date, progressValue?: number) => {
    const allTasks = [...habitTasks, ...commitments];
    const task = allTasks.find(ht => ht.id === id);
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

  const handleUndoHabitTask = (id: string, date: Date) => {
     const allTasks = [...habitTasks, ...commitments];
    const task = allTasks.find(ht => ht.id === id);
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
  };

  const handleArchiveHabitTask = (id: string) => {
    if (!selectedDate) return;
    startTransition(async () => {
        try {
          await archiveHabitTask(id, selectedDate.toISOString());
          toast({ title: 'Hábito/Tarea Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el Hábito/Tarea.' });
        }
    });
  };
  
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: HabitTask) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: HabitTask) => {
    if (!draggedItem) return;

    const currentIndex = habitTasks.findIndex(item => item.id === draggedItem.id);
    const targetIndex = habitTasks.findIndex(item => item.id === targetItem.id);

    if (currentIndex !== -1 && targetIndex !== -1) {
      const newTasks = [...habitTasks];
      const [removed] = newTasks.splice(currentIndex, 1);
      newTasks.splice(targetIndex, 0, removed);
      setHabitTasks(newTasks);
    }
    setDraggedItem(null);
  };

  const dailyProgress = useMemo(() => {
    if (habitTasks.length === 0) return 0;

    let totalWeight = 0;
    let weightedCompleted = 0;

    habitTasks.forEach(task => {
        totalWeight += task.weight;
        if(task.completedToday) {
            weightedCompleted += task.weight;
        }
    });

    return totalWeight > 0 ? (weightedCompleted / totalWeight) * 100 : 0;
  }, [habitTasks]);

  if (!selectedDate) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-headline">Cargando...</div>
        </div>
    );
  }

  return (
    <>
      <main className="container mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <WeekNav selectedDate={selectedDate} onDateChange={handleDateChange} dailyProgressData={dailyProgressDataForWeek} />

        <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-headline font-bold">Tareas del Día</h2>
              <ProgressCircle progress={dailyProgress} />
            </div>
            <div className="mt-4 space-y-2">
                {habitTasks.length > 0 ? (
                    habitTasks.map((task, index) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, task)}
                        className={`transition-all duration-300 ${draggedItem?.id === task.id ? "opacity-50" : ""}`}
                      >
                        <HabitTaskListItem 
                          item={task}
                          selectedDate={selectedDate}
                          onEdit={handleOpenEditHabitTaskDialog}
                          onToggle={handleToggleHabitTask}
                          onUndo={handleUndoHabitTask}
                          onArchive={handleArchiveHabitTask}
                          isDraggable
                        />
                      </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground font-semibold text-lg">¡Día despejado!</p>
                        <p className="text-muted-foreground mt-1">¿Qué te gustaría lograr hoy?</p>
                        <Button variant="link" size="sm" onClick={() => handleOpenAddHabitTaskDialog()}>¡Agrega una nueva acción!</Button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8">
            <h2 className="text-2xl font-headline font-bold">Compromisos del Período</h2>
            <div className="mt-4">
                <CommitmentsCard 
                    commitments={commitments}
                    selectedDate={selectedDate}
                    onToggle={handleToggleHabitTask}
                    onUndo={handleUndoHabitTask}
                    onEdit={handleOpenEditHabitTaskDialog}
                    onArchive={handleArchiveHabitTask}
                />
            </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-20">
        <Button onClick={() => handleOpenAddHabitTaskDialog()} size="lg" className="rounded-full shadow-lg h-12 w-12 p-0 sm:w-auto sm:px-6 sm:h-11">
            <Plus className="h-6 w-6 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Acción</span>
        </Button>
      </div>

      <AddHabitTaskDialog 
        isOpen={isHabitTaskDialogOpen} 
        onOpenChange={setHabitTaskDialogOpen} 
        onSave={handleSaveHabitTask}
        habitTask={editingHabitTask}
        defaultAreaPrkIds={activeAreaPrkIds}
        defaultDate={selectedDate}
        areaPrks={areaPrks}
        defaultValues={defaultHabitTaskValues}
       />
    </>
  );
}

    