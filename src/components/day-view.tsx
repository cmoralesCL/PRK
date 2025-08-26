'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AddPulseDialog, PulseFormValues } from './add-habit-task-dialog';
import type { Orbit, Phase, Pulse, DailyProgressSnapshot } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
    addPulse, 
    updatePulse,
    logPulseCompletion,
    removePulseCompletion,
    archivePulse,
    updatePulseOrder,
} from '@/app/actions';
import { Button } from './ui/button';
import { parseISO, format } from 'date-fns';
import { CommitmentsCard } from './commitments-card';
import { WeekNav } from './week-nav';
import { GripVertical } from 'lucide-react';
import { HabitTaskListItem } from './habit-task-list-item';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import Link from 'next/link';
import type { QuoteOfTheDayOutput } from '@/ai/flows/get-quote-of-the-day';
import { AppHeader } from './app-header';

interface QuoteCardProps {
    quote: QuoteOfTheDayOutput;
}

function QuoteCard({ quote }: QuoteCardProps) {
    return (
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-cyan-400 text-primary-foreground shadow-lg">
            <p className="text-sm font-medium">Frase del Día</p>
            <blockquote className="mt-1 text-lg font-semibold italic">
                "{quote.quote}"
            </blockquote>
             <p className="text-right text-sm opacity-80 mt-2">- {quote.author}</p>
        </div>
    )
}


interface DayViewProps {
  userEmail?: string | null;
  orbits: Orbit[];
  phases: Phase[];
  pulses: Pulse[];
  commitments: Pulse[];
  initialSelectedDate: string;
  dailyProgressDataForWeek: DailyProgressSnapshot[];
  weeklyProgress: number;
  monthlyProgress: number;
  quote: QuoteOfTheDayOutput;
}

export function DayView({
  userEmail,
  orbits,
  phases,
  pulses: initialPulses,
  commitments,
  initialSelectedDate,
  dailyProgressDataForWeek,
  weeklyProgress,
  monthlyProgress,
  quote,
}: DayViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [pulses, setPulses] = useState(initialPulses);
  
  // State for drag and drop
  const [draggedItem, setDraggedItem] = useState<Pulse | null>(null);

  useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDate(parseISO(initialSelectedDate));
    }
    setPulses(initialPulses);
  }, [initialSelectedDate, initialPulses]);

  // State for dialogs
  const [isPulseDialogOpen, setPulseDialogOpen] = useState(false);
  const [defaultPulseValues, setDefaultPulseValues] = useState<Partial<PulseFormValues> | undefined>(undefined);

  // State for editing items
  const [editingPulse, setEditingPulse] = useState<Pulse | null>(null);
  
  // State for context when adding new items
  const [activePhaseIds, setActivePhaseIds] = useState<string[]>([]);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    startTransition(() => {
      router.push(`/day?date=${dateString}`);
    });
  }

  const handleOpenAddPulseDialog = (phaseId?: string) => {
    setActivePhaseIds(phaseId ? [phaseId] : []);
    setDefaultPulseValues(undefined);
    setEditingPulse(null);
    setPulseDialogOpen(true);
  };
  
  const handleOpenEditPulseDialog = (pulse: Pulse) => {
    setEditingPulse(pulse);
    setDefaultPulseValues(undefined);
    setActivePhaseIds(pulse.phase_ids);
    setPulseDialogOpen(true);
  };

  const handleSavePulse = (values: Partial<Pulse>) => {
    startTransition(async () => {
        try {
            if (editingPulse) {
                await updatePulse(editingPulse.id, values);
                toast({ title: '¡Pulso Actualizado!', description: `Se ha actualizado "${values.title}".` });
            } else {
                await addPulse(values);
                toast({ title: '¡Pulso Agregado!', description: `Se ha agregado "${values.title}".` });
            }
        } catch (error) {
            console.error("Error al guardar el Pulso:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el Pulso. Revisa los campos e inténtalo de nuevo.' });
        }
    });
  };

  const handleTogglePulse = (id: string, completed: boolean, date: Date, progressValue?: number) => {
    const allPulses = [...pulses, ...commitments];
    const pulse = allPulses.find(ht => ht.id === id);
    if (!pulse) return;

    const completionDate = date.toISOString().split('T')[0];

    startTransition(async () => {
      try {
        if (completed) {
          await logPulseCompletion(id, pulse.type, completionDate, progressValue);
        } else {
          await removePulseCompletion(id, pulse.type, completionDate);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
      }
    });
  };

  const handleUndoPulse = (id: string, date: Date) => {
     const allPulses = [...pulses, ...commitments];
    const pulse = allPulses.find(ht => ht.id === id);
    if (!pulse) return;

    const completionDate = date.toISOString().split('T')[0];
    startTransition(async () => {
        try {
            await removePulseCompletion(id, pulse.type, completionDate);
            toast({ title: "Registro deshecho" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo deshacer la acción.' });
        }
    });
  };

  const handleArchivePulse = (id: string) => {
    if (!selectedDate) return;
    startTransition(async () => {
        try {
          await archivePulse(id, selectedDate.toISOString());
          toast({ title: 'Pulso Archivado' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el Pulso.' });
        }
    });
  };
  
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: Pulse) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: Pulse) => {
    if (!draggedItem) return;

    const currentIndex = pulses.findIndex(item => item.id === draggedItem.id);
    const targetIndex = pulses.findIndex(item => item.id === targetItem.id);

    if (currentIndex !== -1 && targetIndex !== -1) {
      const newPulses = [...pulses];
      const [removed] = newPulses.splice(currentIndex, 1);
      newPulses.splice(targetIndex, 0, removed);
      
      // Update local state immediately for snappy UI
      setPulses(newPulses);

      // Persist the new order to the backend
      const orderedIds = newPulses.map(p => p.id);
      startTransition(async () => {
          try {
              await updatePulseOrder(orderedIds);
          } catch(error) {
              console.error("Failed to save new order", error);
              toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el nuevo orden.' });
              // Revert to original order on failure
              setPulses(pulses);
          }
      });
    }
    setDraggedItem(null);
  };

  const dailyProgress = useMemo(() => {
    if (!pulses || pulses.length === 0) return 0;

    let totalWeight = 0;
    let weightedCompleted = 0;

    pulses.forEach(task => {
        if (task.measurement_type === 'quantitative' && task.measurement_goal?.target_count) {
            const progressPercentage = (task.current_progress_value ?? 0) / task.measurement_goal.target_count;
            weightedCompleted += Math.min(progressPercentage, 1) * task.weight;
        } else if (task.completedToday) {
            weightedCompleted += 1 * task.weight;
        }
        totalWeight += task.weight;
    });

    return totalWeight > 0 ? (weightedCompleted / totalWeight) * 100 : 0;
  }, [pulses]);

  const phasesMap = useMemo(() => new Map(phases.map(p => [p.id, p])), [phases]);
  const orbitsMap = useMemo(() => new Map(orbits.map(o => [o.id, o])), [orbits]);

  if (!selectedDate) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-headline">Cargando...</div>
        </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-6">
        
        <WeekNav selectedDate={selectedDate} onDateChange={handleDateChange} dailyProgressData={dailyProgressDataForWeek} />
        
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline">Progreso</CardTitle>
                    <Button variant="link" asChild>
                        <Link href="/analytics">Ver progreso</Link>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-muted-foreground">Progreso del Día</span>
                            <span className="text-sm font-bold text-foreground">{Math.round(dailyProgress)}%</span>
                        </div>
                        <Progress value={dailyProgress} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-muted-foreground">Progreso Semanal</span>
                            <span className="text-sm font-bold text-foreground">{Math.round(weeklyProgress)}%</span>
                        </div>
                        <Progress value={weeklyProgress} />
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-muted-foreground">Progreso Mensual</span>
                            <span className="text-sm font-bold text-foreground">{Math.round(monthlyProgress)}%</span>
                        </div>
                        <Progress value={monthlyProgress} />
                    </div>
                </CardContent>
            </Card>
        </div>


        <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-headline font-bold">Pulsos del Día</h2>
            </div>
            <div className="mt-4 space-y-2">
                {pulses && pulses.length > 0 ? (
                    pulses.map((task) => {
                        const taskPhases = task.phase_ids.map(id => phasesMap.get(id)).filter(Boolean) as Phase[];
                        const taskOrbits = Array.from(new Set(taskPhases.map(p => orbitsMap.get(p.life_prk_id)))).filter(Boolean) as Orbit[];
                        
                        return (
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
                                    phases={taskPhases}
                                    orbits={taskOrbits}
                                    selectedDate={selectedDate}
                                    onEdit={handleOpenEditPulseDialog}
                                    onToggle={handleTogglePulse}
                                    onUndo={handleUndoPulse}
                                    onArchive={handleArchivePulse}
                                    isDraggable
                                />
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground font-semibold text-lg">¡Día despejado!</p>
                        <p className="text-muted-foreground mt-1">¿Qué te gustaría lograr hoy?</p>
                        <Button variant="link" size="sm" onClick={() => handleOpenAddPulseDialog()}>¡Agrega un nuevo Pulso!</Button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8">
            <h2 className="text-2xl font-headline font-bold">Compromisos del Período</h2>
            <div className="mt-4">
                <CommitmentsCard 
                    commitments={commitments}
                    phases={phases}
                    orbits={orbits}
                    selectedDate={selectedDate}
                    onToggle={handleTogglePulse}
                    onUndo={handleUndoPulse}
                    onEdit={handleOpenEditPulseDialog}
                    onArchive={handleArchivePulse}
                />
            </div>
        </div>
        
        <QuoteCard quote={quote} />

      </div>

      {/* Hidden button to be triggered by the global FAB */}
      <button id="day-view-fab-trigger" onClick={() => handleOpenAddPulseDialog()} className="hidden" aria-hidden="true"></button>

      <AddPulseDialog 
        isOpen={isPulseDialogOpen} 
        onOpenChange={setPulseDialogOpen} 
        onSave={handleSavePulse}
        pulse={editingPulse}
        defaultPhaseIds={activePhaseIds}
        defaultDate={selectedDate}
        phases={phases}
        defaultValues={defaultPulseValues}
       />
    </>
  );
}
