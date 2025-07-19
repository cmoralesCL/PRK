
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, startOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/header';
import { ProgressCalendar } from '@/components/progress-calendar';
import { AddHabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';
import type { DailyProgressSnapshot, HabitTask, AreaPrk, WeeklyProgressSnapshot } from '@/lib/types';
import { addHabitTask, updateHabitTask, archiveHabitTask, logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { useState } from 'react';
import { CommitmentsPanel } from './commitments-panel';
import { DayDetailDialog } from './day-detail-dialog';


interface CalendarViewProps {
    initialMonthString: string;
    dailyProgressData: DailyProgressSnapshot[];
    habitTasksData: Record<string, HabitTask[]>;
    areaPrks: AreaPrk[];
    weeklyCommitmentsData: Record<string, HabitTask[]>;
    weeklyProgressData: WeeklyProgressSnapshot[];
}

export function CalendarView({ 
    initialMonthString, 
    dailyProgressData, 
    habitTasksData, 
    areaPrks,
    weeklyCommitmentsData,
    weeklyProgressData
}: CalendarViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
    const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
    const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | undefined>(undefined);
    
    const [isCommitmentPanelOpen, setCommitmentPanelOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);

    const [isDayDetailOpen, setDayDetailOpen] = useState(false);
    const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);

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

    const handleOpenDayDetail = (day: Date) => {
        setSelectedDayForDetail(day);
        setDayDetailOpen(true);
    };

    const handleDayClick = (day: Date) => {
        setSelectedWeek(startOfWeek(day, { weekStartsOn: 1 }));
        setCommitmentPanelOpen(true);
        handleOpenDayDetail(day);
    }
    
    const handleToggleCommitment = (habitTaskId: string, completed: boolean, date: Date, progressValue?: number) => {
        startTransition(async () => {
            const task = weeklyCommitmentsData[format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')]?.find(t => t.id === habitTaskId);
            if (!task) return;

            try {
                if(completed) {
                    await logHabitTaskCompletion(habitTaskId, task.type, date.toISOString().split('T')[0], progressValue);
                } else {
                    await removeHabitTaskCompletion(habitTaskId, task.type, date.toISOString().split('T')[0]);
                }
                toast({ title: completed ? "¡Compromiso registrado!" : "Registro deshecho."});
            } catch(error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el compromiso.' });
            }
        });
    }

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

    const handleArchiveHabitTask = (id: string, date: Date) => {
        startTransition(async () => {
            try {
                await archiveHabitTask(id, date.toISOString());
                toast({ title: 'Acción Archivada' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar la acción.' });
            }
        });
    }
    
    // Parse the date string into a Date object here.
    // This happens on the client, avoiding hydration issues.
    const currentMonth = parse(initialMonthString, 'yyyy-MM-dd', new Date());

    const selectedWeekKey = selectedWeek ? format(selectedWeek, 'yyyy-MM-dd') : '';
    const commitmentsForSelectedWeek = weeklyCommitmentsData[selectedWeekKey] || [];

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
                  weeklyProgressData={weeklyProgressData}
                  onDayClick={handleDayClick}
                />
            </main>
            <AddHabitTaskDialog 
                isOpen={isHabitTaskDialogOpen}
                onOpenChange={setHabitTaskDialogOpen}
                onSave={handleSaveHabitTask}
                habitTask={editingHabitTask}
                defaultDate={selectedDateForDialog}
                areaPrks={areaPrks}
            />
            <DayDetailDialog 
                isOpen={isDayDetailOpen}
                onOpenChange={setDayDetailOpen}
                day={selectedDayForDetail}
                tasks={selectedDayForDetail ? habitTasksData[format(selectedDayForDetail, 'yyyy-MM-dd')] || [] : []}
                onAddTask={(date) => {
                    setDayDetailOpen(false); // Cierra el modal de detalle para abrir el de creación
                    handleOpenAddTaskDialog(date);
                }}
                onEditTask={(task, date) => {
                    setDayDetailOpen(false);
                    handleOpenEditTaskDialog(task, date);
                }}
                onArchiveTask={handleArchiveHabitTask}
                onOpenCommitments={(date) => {
                    setDayDetailOpen(false);
                    setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 }));
                    setCommitmentPanelOpen(true);
                }}
            />
            <CommitmentsPanel
                isOpen={isCommitmentPanelOpen}
                onOpenChange={setCommitmentPanelOpen}
                weekDate={selectedWeek}
                commitments={commitmentsForSelectedWeek}
                onToggle={handleToggleCommitment}
                onEdit={(task) => handleOpenEditTaskDialog(task, selectedWeek!)}
                onArchive={(id) => handleArchiveHabitTask(id, selectedWeek!)}
                onAddTask={() => handleOpenAddTaskDialog(selectedWeek!)}
            />
        </>
    );
}
