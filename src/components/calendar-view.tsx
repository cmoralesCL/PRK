
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/header';
import { ProgressCalendar } from '@/components/progress-calendar';
import { HabitTaskDialog, type HabitTaskFormValues } from './habit-task-dialog';
import type { DailyProgressSnapshot, HabitTask, AreaPrk } from '@/lib/types';
import { addHabitTask, updateHabitTask, archiveHabitTask } from '@/app/actions';

interface CalendarViewProps {
    initialMonth: Date;
    dailyProgressData: DailyProgressSnapshot[];
    habitTasksData: Record<string, HabitTask[]>;
    areaPrks: AreaPrk[];
}

export function CalendarView({ initialMonth, dailyProgressData, habitTasksData, areaPrks }: CalendarViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [currentMonth, setCurrentMonth] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentMonth(initialMonth);
    }, [initialMonth]);

    const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
    const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
    const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | undefined>(undefined);

    const handleMonthChange = (newMonth: Date) => {
        setCurrentMonth(newMonth);
        router.push(`/calendar?month=${format(newMonth, 'yyyy-MM')}`);
    }

    const handleOpenAddTaskDialog = (date: Date) => {
        setEditingHabitTask(null);
        setSelectedDateForDialog(date);
        setHabitTaskDialogOpen(true);
    };

    const handleOpenEditTaskDialog = (habitTask: HabitTask, date: Date) => {
        setEditingHabitTask(habitTask);
        setSelectedDateForDialog(date);
        setHabitTaskDialogOpen(true);
    };

    const handleSaveHabitTask = (values: HabitTaskFormValues) => {
        startTransition(async () => {
            try {
                const habitTaskData = {
                    title: values.title,
                    type: values.type,
                    area_prk_id: values.area_prk_id,
                    start_date: values.start_date ? values.start_date.toISOString().split('T')[0] : undefined,
                    due_date: values.due_date ? values.due_date.toISOString().split('T')[0] : undefined,
                    frequency: values.frequency,
                    frequency_days: values.frequency_days,
                    weight: values.weight,
                    is_critical: values.is_critical,
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
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la acción.' });
            }
        });
    };

    const handleArchiveHabitTask = (id: string) => {
        startTransition(async () => {
            try {
                await archiveHabitTask(id);
                toast({ title: 'Acción Archivada' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar la acción.' });
            }
        });
    }
    
    if (!currentMonth) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-2xl font-headline">Cargando Calendario...</div>
            </div>
        );
    }

    return (
        <>
            <Header 
                onAddLifePrk={() => {}} 
                selectedDate={new Date()} 
                onDateChange={() => {}} 
                hideAddButton={true} 
                hideDatePicker={true} 
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProgressCalendar
                  initialMonth={currentMonth}
                  onMonthChange={handleMonthChange}
                  dailyProgressData={dailyProgressData}
                  habitTasksData={habitTasksData}
                  onAddTask={handleOpenAddTaskDialog}
                  onEditTask={handleOpenEditTaskDialog}
                  onArchiveTask={handleArchiveHabitTask}
                />
            </main>
            <HabitTaskDialog 
                isOpen={isHabitTaskDialogOpen}
                onOpenChange={setHabitTaskDialogOpen}
                onSave={handleSaveHabitTask}
                habitTask={editingHabitTask}
                defaultDate={selectedDateForDialog}
                areaPrks={areaPrks}
            />
        </>
    );
}
