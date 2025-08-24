
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifePrkSection } from './life-prk-section';
import { AddAreaPrkDialog, type AreaPrkFormValues } from './add-area-prk-dialog';
import { AddHabitTaskDialog, HabitTaskFormValues } from './add-habit-task-dialog';
import type { LifePrk, AreaPrk, HabitTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addAreaPrk, 
    updateAreaPrk,
    addHabitTask, 
    updateHabitTask,
    archiveLifePrk,
    archiveAreaPrk,
    archiveHabitTask,
} from '@/app/actions';
import { Button } from './ui/button';
import { Accordion } from '@/components/ui/accordion';
import { useDialog } from '@/hooks/use-dialog';

interface PanelProps {
  lifePrks: LifePrk[];
  areaPrks: AreaPrk[];
  allHabitTasks: HabitTask[];
}

export function Panel({
  lifePrks,
  areaPrks,
  allHabitTasks,
}: PanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { setLifePrkToEdit } = useDialog();

  const [openLifePrkIds, setOpenLifePrkIds] = useState<string[]>(lifePrks.map(lp => lp.id));

  useEffect(() => {
    setOpenLifePrkIds(currentOpenIds => {
      const newLifePrkIds = lifePrks.map(lp => lp.id);
      const allIds = new Set([...currentOpenIds, ...newLifePrkIds]);
      return Array.from(allIds);
    });
  }, [lifePrks]);

  const [isAreaPrkDialogOpen, setAreaPrkDialogOpen] = useState(false);
  const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
  const [editingAreaPrk, setEditingAreaPrk] = useState<AreaPrk | null>(null);
  const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
  const [activeLifePrkId, setActiveLifePrkId] = useState<string | null>(null);
  const [activeAreaPrkId, setActiveAreaPrkId] = useState<string | null>(null);

  const handleOpenEditLifePrkDialog = (lifePrk: LifePrk) => {
    setLifePrkToEdit(lifePrk);
  };

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

  const handleOpenAddHabitTaskDialog = (areaPrkId: string) => {
    setActiveAreaPrkId(areaPrkId);
    setEditingHabitTask(null);
    setHabitTaskDialogOpen(true);
  };

  const handleOpenEditHabitTaskDialog = (habitTask: HabitTask) => {
    setEditingHabitTask(habitTask);
    setActiveAreaPrkId(habitTask.area_prk_id);
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
          // The date doesn't matter for a date-agnostic view, but the action requires one.
          await archiveHabitTask(id, new Date().toISOString());
          toast({ title: 'Acción Archivada' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar la Acción.' });
        }
    });
  };
  
  return (
    <>
      <main className="flex-1 container mx-auto px-2 sm:px-4 lg:px-6 py-4 overflow-y-auto">
        <div className="mb-4">
            <h1 className="text-2xl font-bold font-headline">Panel Estratégico</h1>
            <p className="text-sm text-muted-foreground">Una vista completa de todos tus objetivos y acciones.</p>
        </div>

        {lifePrks.length === 0 && !isPending && (
            <div className="text-center py-24">
                <h2 className="text-xl font-headline font-semibold">Bienvenido a tu Brújula</h2>
                <p className="mt-2 text-sm text-muted-foreground">Define tu primer PRK de Vida para empezar tu viaje.</p>
                <Button className="mt-6" onClick={() => setLifePrkToEdit(null)}>Crear un PRK de Vida</Button>
            </div>
        )}
        {isPending && (
            <div className="text-center py-24">
                  <h2 className="text-xl font-headline font-semibold">Cargando...</h2>
            </div>
        )}
        {!isPending && lifePrks.length > 0 && (
          <>
            <div className="flex justify-end gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => setOpenLifePrkIds(lifePrks.map(lp => lp.id))}>
                    Expandir Todo
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpenLifePrkIds([])}>
                    Contraer Todo
                </Button>
            </div>
            <Accordion 
              type="multiple" 
              className="w-full space-y-3" 
              value={openLifePrkIds}
              onValueChange={setOpenLifePrkIds}
            >
              {lifePrks.map((lp) => (
                <LifePrkSection
                  key={lp.id}
                  lifePrk={lp}
                  areaPrks={areaPrks.filter(kp => kp.life_prk_id === lp.id)}
                  allHabitTasks={allHabitTasks}
                  onAddAreaPrk={handleOpenAddAreaPrkDialog}
                  onEditAreaPrk={handleOpenEditAreaPrkDialog}
                  onAddHabitTask={handleOpenAddHabitTaskDialog}
                  onEditHabitTask={handleOpenEditHabitTaskDialog}
                  onArchive={handleArchiveLifePrk}
                  onEdit={handleOpenEditLifePrkDialog}
                  onArchiveAreaPrk={handleArchiveAreaPrk}
                  onArchiveHabitTask={handleArchiveHabitTask}
                />
              ))}
            </Accordion>
          </>
        )}
      </main>
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
        defaultAreaPrkId={activeAreaPrkId || undefined}
        defaultDate={new Date()}
        areaPrks={areaPrks}
        />
    </>
  );
}
