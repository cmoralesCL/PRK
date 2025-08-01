
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifePrkSection } from './life-prk-section';
import { AddAreaPrkDialog, type AreaPrkFormValues } from './add-area-prk-dialog';
import { AddHabitTaskDialog, HabitTaskFormValues } from './add-habit-task-dialog';
import { AiSuggestionDialog } from './ai-suggestion-dialog';
import type { LifePrk, AreaPrk, HabitTask, HabitFrequency } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addAreaPrk, 
    updateAreaPrk,
    addHabitTask, 
    updateHabitTask,
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
import { useDialog } from '@/hooks/use-dialog';
import { Header } from './header';
import { CommitmentsSidebar } from './commitments-sidebar';
import { cn } from '@/lib/utils';

interface PanelProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  habitTasks: HabitTask[];
  commitments: HabitTask[];
  initialSelectedDate: string;
}

export function Panel({
  lifePrks,
  areaPrks,
  habitTasks,
  commitments,
  initialSelectedDate,
}: PanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { setLifePrkToEdit } = useDialog();


  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [openLifePrkIds, setOpenLifePrkIds] = useState<string[]>(lifePrks.map(lp => lp.id));
  
  useEffect(() => {
    setSelectedDate(parseISO(initialSelectedDate));
  }, [initialSelectedDate]);

  useEffect(() => {
    setOpenLifePrkIds(currentOpenIds => {
      const newLifePrkIds = lifePrks.map(lp => lp.id);
      const allIds = new Set([...currentOpenIds, ...newLifePrkIds]);
      return Array.from(allIds);
    });
  }, [lifePrks]);


  // State for dialogs
  const [isAreaPrkDialogOpen, setAreaPrkDialogOpen] = useState(false);
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [isAiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [defaultHabitTaskValues, setDefaultHabitTaskValues] = useState<Partial<HabitTaskFormValues> | undefined>(undefined);

  // State for editing items
  const [editingAreaPrk, setEditingAreaPrk] = useState<AreaPrk | null>(null);
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  
  // State for context when adding new items
  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeAreaPrk, setActiveAreaPrk] = useState<AreaPrk | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    startTransition(() => {
      router.push(`/panel?date=${dateString}`);
    });
  }

  // --- Life PRK Handlers ---
  const handleOpenEditLifePrkDialog = (lifePrk: LifePrk) => {
    setLifePrkToEdit(lifePrk);
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
    setDefaultHabitTaskValues(undefined);
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  };

  const handleOpenEditHabitTaskDialog = (habitTask: HabitTask) => {
    setEditingHabitTask(habitTask);
    setDefaultHabitTaskValues(undefined);
    setActiveAreaPrk(areaPrks.find(ap => ap.id === habitTask.area_prk_id) || null);
    setHabitTaskDialogOpen(true);
  };

  const handleOpenAddCommitmentDialog = (frequency: HabitFrequency) => {
    setEditingHabitTask(null);
    setDefaultHabitTaskValues({
        type: 'habit',
        frequency: frequency,
    });
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

  if (!selectedDate) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-headline">Cargando...</div>
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header 
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
              {lifePrks.length === 0 && !isPending && (
                  <div className="text-center py-24">
                      <h2 className="text-2xl font-headline font-semibold">Bienvenido a tu Brújula</h2>
                      <p className="mt-2 text-muted-foreground">Define tu primer PRK de Vida para empezar tu viaje.</p>
                      <Button className="mt-6" onClick={() => setLifePrkToEdit(null)}>Crear un PRK de Vida</Button>
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
                        habitTasks={habitTasks.filter(ht => areaPrks.some(ap => ap.life_prk_id === lp.id && ap.id === ht.area_prk_id))}
                        onAddAreaPrk={handleOpenAddAreaPrkDialog}
                        onEditAreaPrk={handleOpenEditAreaPrkDialog}
                        onAddHabitTask={handleOpenAddHabitTaskDialog}
                        onEditHabitTask={handleOpenEditHabitTaskDialog}
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
             <aside className={cn(
                "hidden lg:flex bg-card/50 border-l transition-all duration-300 ease-in-out", 
                isSidebarOpen ? 'w-96 p-4' : 'w-16 p-2 items-center justify-center'
            )}>
                <CommitmentsSidebar
                    commitments={commitments}
                    selectedDate={selectedDate}
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                    onAddCommitment={handleOpenAddCommitmentDialog}
                    onEditCommitment={handleOpenEditHabitTaskDialog}
                />
            </aside>
        </div>
      </div>
      <AddAreaPrkDialog 
        isOpen={isAreaPrkDialogOpen} 
        onOpenChange={setAreaPrkDialogOpen} 
        onSave={handleSaveAreaPrk}
        areaPrk={editingAreaPrk}
      />
      <AddHabitTaskDialog 
        isOpen={isHabitTaskDialogOpen} 
        onOpenChange={setHabitTaskDialogOpen} 
        onSave={handleSaveHabitTask}
        habitTask={editingHabitTask}
        defaultAreaPrkId={activeAreaPrk?.id}
        defaultDate={selectedDate}
        areaPrks={areaPrks}
        defaultValues={defaultHabitTaskValues}
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
