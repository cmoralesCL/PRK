
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/header';
import { ProgressCalendar } from '@/components/progress-calendar';
import { HabitTaskDialog, type HabitTaskFormValues } from './habit-task-dialog';
import type { DailyProgressSnapshot, HabitTask, AreaPrk } from '@/lib/types';
import { addHabitTask, updateHabitTask, archiveHabitTask } from '@/app/actions';
import { useState } from 'react';


interface CalendarViewProps {
    initialMonthString: string;
    dailyProgressData: DailyProgressSnapshot[];
    habitTasksData: Record<string, HabitTask[]>;
    areaPrks: AreaPrk[];
}

export function CalendarView({ initialMonthString, dailyProgressData, habitTasksData, areaPrks }: CalendarViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
    const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
    const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | undefined>(undefined);

    const handleMonthChange = (newMonth: Date) => {
        startTransition(() => {
            router.push(`/calendar?month=${format(newMonth, 'yyyy-MM-dd')}`);
        });
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
    
    // Parse the date string into a Date object here.
    // This happens on the client, avoiding hydration issues.
    const currentMonth = parse(initialMonthString, 'yyyy-MM-dd', new Date());

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
                  currentMonth={currentMonth}
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
