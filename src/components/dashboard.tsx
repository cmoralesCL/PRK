
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './header';
import { LifePrkSection } from './life-prk-section';
import { AddLifePrkDialog } from './add-life-prk-dialog';
import { AddAreaPrkDialog, type AreaPrkFormValues } from './add-area-prk-dialog';
import { HabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addAreaPrk, 
    updateAreaPrk,
    addHabitTask, 
    updateHabitTask,
    addLifePrk, 
    updateLifePrk,
    logHabitTaskCompletion,
    removeHabitTaskCompletion,
    archiveLifePrk,
    archiveAreaPrk,
    archiveHabitTask,
} from '@/app/actions';
import { Button } from './ui/button';
import { parseISO, format } from 'date-fns';
import { Accordion } from '@/components/ui/accordion';
import { CommitmentsCard } from './commitments-card';

interface DashboardProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  commitments: HabitTask[];
  initialSelectedDate: string;
}

export function Dashboard({
  lifePrks,
  areaPrks,
  habitTasks,
  commitments,
  initialSelectedDate,
}: DashboardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [openLifePrkIds, setOpenLifePrkIds] = useState<string[]>(lifePrks.map(lp => lp.id));
  
  useEffect(() => {
    // Inicializar la fecha en el cliente para evitar errores de hidratación
    setSelectedDate(parseISO(initialSelectedDate));
  }, [initialSelectedDate]);

  useEffect(() => {
    // Cuando los lifePrks cambian (por ej. al agregar uno nuevo), lo expandimos por defecto.
    setOpenLifePrkIds(currentOpenIds => {
      const newLifePrkIds = lifePrks.map(lp => lp.id);
      const allIds = new Set([...currentOpenIds, ...newLifePrkIds]);
      return Array.from(allIds);
    });
  }, [lifePrks]);


  // State for dialogs
  const [isLifePrkDialogOpen, setLifePrkDialogOpen] = useState(false);
  const [isAreaPrkDialogOpen, setAreaPrkDialogOpen] = useState(false);
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);

  // State for editing items
  const [editingLifePrk, setEditingLifePrk] = useState<LifePrk | null>(null);
  const [editingAreaPrk, setEditingAreaPrk] = useState<AreaPrk | null>(null);
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  
  // State for context when adding new items
  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeAreaPrk, setActiveAreaPrk] = useState<AreaPrk | null>(null);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(date);
    // startTransition para no bloquear la UI mientras navega
    startTransition(() => {
      router.push(`/?date=${dateString}`);
    });
  }

  // --- Life PRK Handlers ---
  const handleOpenAddLifePrkDialog = () => {
    setEditingLifePrk(null);
    setLifePrkDialogOpen(true);
  };

  const handleOpenEditLifePrkDialog = (lifePrk: LifePrk) => {
    setEditingLifePrk(lifePrk);
    setLifePrkDialogOpen(true);
  };
  
  const handleSaveLifePrk = (values: { title: string; description?: string }) => {
    startTransition(async () => {
        try {
          if (editingLifePrk) {
            await updateLifePrk(editingLifePrk.id, values);
            toast({ title: '¡PRK de Vida Actualizado!', description: `Se ha actualizado "${values.title}".` });
          } else {
            await addLifePrk(values);
            toast({ title: '¡PRK de Vida Agregado!', description: `"${values.title}" es ahora tu estrella guía.` });
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el PRK de Vida.' });
        }
    });
  };

  // --- Area PRK Handlers ---
  const handleOpenAddAreaPrkDialog = (lifePrkId: string) => {
    setActiveLifePrkId(lifePrkId);
    setEditingAreaPrk(null);
    setAreaPrkDialogOpen(true);
  }

  const handleOpenEditAreaPrkDialog = (areaPrk: AreaPrk) => {
    setActiveLifePrkId(areaPrk.life_prk_id);
    setEditingAreaPrk(areaPrk);
    setAreaPrkDialogOpen(true);
  }

  const handleSaveAreaPrk = (values: AreaPrkFormValues) => {
    if (!activeLifePrkId && !editingAreaPrk) return;
     startTransition(async () => {
        try {
          if (editingAreaPrk) {
            await updateAreaPrk(editingAreaPrk.id, values);
            toast({ title: '¡PRK de Área Actualizado!', description: `Se ha actualizado "${values.title}".` });
          } else if (activeLifePrkId) {
            await addAreaPrk({ ...values, life_prk_id: activeLifePrkId });
            toast({ title: '¡PRK de Área Establecido!', description: `Ahora estás siguiendo "${values.title}".` });
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el PRK de Área.' });
        }
    });
  };

  // --- Habit/Task Handlers ---
  const handleOpenAddHabitTaskDialog = (areaPrkId: string) => {
    setActiveAreaPrk(areaPrks.find(ap => ap.id === areaPrkId) || null);
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  };

  const handleOpenEditHabitTaskDialog = (habitTask: HabitTask) => {
    setEditingHabitTask(habitTask);
    setActiveAreaPrk(areaPrks.find(ap => ap.id === habitTask.area_prk_id) || null);
    setHabitTaskDialogOpen(true);
  };

  const handleSaveHabitTask = (values: HabitTaskFormValues) => {
    startTransition(async () => {
        try {
            const habitTaskData: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived'>> = {
                title: values.title,
                type: values.type,
                area_prk_id: values.area_prk_id,
                weight: values.weight,
                is_critical: values.is_critical,
                start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : undefined,
                due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : undefined,
                frequency: values.frequency,
                frequency_days: values.frequency_days,
                measurement_type: values.measurement_type,
                measurement_goal: values.measurement_goal,
            };

            if (editingHabitTask) {
                await updateHabitTask(editingHabitTask.id, habitTaskData);
                toast({ title: '¡Acción Actualizada!', description: `Se ha actualizado "${values.title}".` });
            } else {
                await addHabitTask(habitTaskData);
                toast({ title: '¡Acción Agregada!', description: `Se ha agregado "${values.title}".` });
            }
        } catch (error) {
            console.error("Error al guardar la acción:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción. Revisa los campos e inténtalo de nuevo.' });
        }
    });
  };
  
  const handleToggleHabitTask = (id: string, completed: boolean, date: Date) => {
    const allTasks = [...habitTasks, ...commitments];
    const task = allTasks.find(ht => ht.id === id);
    if (!task) return;

    const completionDate = date.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        if (completed) {
          await logHabitTaskCompletion(id, task.type, completionDate);
          if (task.type === 'task' || task.type === 'project') {
              toast({ title: '¡Tarea Completada!', description: '¡Excelente trabajo!' });
          } else {
              toast({ title: '¡Hábito Registrado!', description: 'Un paso más cerca de tu meta.' });
          }
        } else {
          await removeHabitTaskCompletion(id, task.type, completionDate);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleAddSuggestedTask = (areaPrkId: string, title: string) => {
     startTransition(async () => {
        try {
            const startDate = new Date().toISOString().split('T')[0];
            await addHabitTask({ 
                area_prk_id: areaPrkId, 
                title, 
                type: 'task',
                start_date: startDate,
                weight: 1, // Default weight for suggestions
                is_critical: false,
                measurement_type: 'binary',
            });
            toast({ title: "¡Agregado!", description: `"${title}" ha sido añadido a tus tareas.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la tarea sugerida.' });
        }
    });
  };
  
  // --- Archive Handlers ---
  const handleArchiveLifePrk = (id: string) => {
    startTransition(async () => {
        try {
          await archiveLifePrk(id);
          toast({ title: 'PRK de Vida Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el PRK de Vida.' });
        }
    });
  };

  const handleArchiveAreaPrk = (id: string) => {
    startTransition(async () => {
        try {
          await archiveAreaPrk(id);
          toast({ title: 'PRK de Área Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el PRK de Área.' });
        }
    });
  };

  const handleArchiveHabitTask = (id: string) => {
    startTransition(async () => {
        try {
          await archiveHabitTask(id);
          toast({ title: 'Hábito/Tarea Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el Hábito/Tarea.' });
        }
    });
  };

  if (!selectedDate) {
    // Muestra un estado de carga o skeleton mientras la fecha se inicializa en el cliente
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-headline">Cargando...</div>
        </div>
    );
  }

  return (
    <>
      <Header 
        onAddLifePrk={handleOpenAddLifePrkDialog}
        selectedDate={selectedDate}
        onDateChange={handleDateChange} 
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        <CommitmentsCard
          commitments={commitments}
          selectedDate={selectedDate}
          onToggle={handleToggleHabitTask}
          onEdit={handleOpenEditHabitTaskDialog}
          onArchive={handleArchiveHabitTask}
        />

        {lifePrks.length === 0 && !isPending && (
            <div className="text-center py-24">
                <h2 className="text-2xl font-headline font-semibold">Bienvenido a tu Brújula</h2>
                <p className="mt-2 text-muted-foreground">Define tu primer PRK de Vida para empezar tu viaje.</p>
                <Button className="mt-6" onClick={handleOpenAddLifePrkDialog}>Crear un PRK de Vida</Button>
            </div>
        )}
        {isPending && (
            <div className="text-center py-24">
                 <h2 className="text-2xl font-headline font-semibold">Cargando...</h2>
            </div>
        )}
        {!isPending && lifePrks.length > 0 && (
          <>
            <div className="flex justify-end gap-2 my-4">
                <Button variant="outline" size="sm" onClick={() => setOpenLifePrkIds(lifePrks.map(lp => lp.id))}>
                    Expandir Todo
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpenLifePrkIds([])}>
                    Contraer Todo
                </Button>
            </div>
            <Accordion 
              type="multiple" 
              className="w-full space-y-4" 
              value={openLifePrkIds}
              onValueChange={setOpenLifePrkIds}
            >
              {lifePrks.map((lp) => (
                <LifePrkSection
                  key={lp.id}
                  lifePrk={lp}
                  areaPrks={areaPrks.filter(kp => kp.life_prk_id === lp.id)}
                  habitTasks={habitTasks}
                  onAddAreaPrk={handleOpenAddAreaPrkDialog}
                  onEditAreaPrk={handleOpenEditAreaPrkDialog}
                  onAddHabitTask={handleOpenAddHabitTaskDialog}
                  onEditHabitTask={handleOpenEditHabitTaskDialog}
                  onToggleHabitTask={handleToggleHabitTask}
                  onGetAiSuggestions={(kp) => { setActiveAreaPrk(kp); setAiSuggestOpen(true); }}
                  onArchive={handleArchiveLifePrk}
                  onEdit={handleOpenEditLifePrkDialog}
                  onArchiveAreaPrk={handleArchiveAreaPrk}
                  onArchiveHabitTask={handleArchiveHabitTask}
                  selectedDate={selectedDate}
                />
              ))}
            </Accordion>
          </>
        )}
      </main>

      <AddLifePrkDialog 
        isOpen={isLifePrkDialogOpen} 
        onOpenChange={setLifePrkDialogOpen} 
        onSave={handleSaveLifePrk}
        lifePrk={editingLifePrk} 
      />
      <AddAreaPrkDialog 
        isOpen={isAreaPrkDialogOpen} 
        onOpenChange={setAreaPrkDialogOpen} 
        onSave={handleSaveAreaPrk}
        areaPrk={editingAreaPrk}
      />
      <HabitTaskDialog 
        isOpen={isHabitTaskDialogOpen} 
        onOpenChange={setHabitTaskDialogOpen} 
        onSave={handleSaveHabitTask}
        habitTask={editingHabitTask}
        defaultAreaPrkId={activeAreaPrk?.id}
        defaultDate={selectedDate}
        areaPrks={areaPrks}
       />
      <AiSuggestionDialog 
        isOpen={isAiSuggestOpen} 
        onOpenChange={setAiSuggestOpen} 
        onAddSuggestion={(title) => activeAreaPrk && handleAddSuggestedTask(activeAreaPrk.id, title)}
        areaPrk={activeAreaPrk} 
      />
    </>
  );
}
