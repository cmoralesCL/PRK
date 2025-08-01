

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import type { DailyProgressSnapshot, HabitTask, AreaPrk, WeeklyProgressSnapshot, HabitFrequency } from '@/lib/types';
import { addHabitTask, updateHabitTask, archiveHabitTask, logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';

import { CalendarView } from '@/components/calendar-view';
import { CommitmentsSidebar } from '@/components/commitments-sidebar';
import { DayDetailDialog } from './day-detail-dialog';
import { AddHabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';

interface CalendarPageClientProps {
    initialData: {
        dailyProgress: DailyProgressSnapshot[];
        habitTasks: Record<string, HabitTask[]>;
        areaPrks: AreaPrk[];
        weeklyProgress: WeeklyProgressSnapshot[];
        monthlyProgress: number;
        commitments: HabitTask[];
    };
    initialMonthString: string;
}

export function CalendarPageClient({ initialData, initialMonthString }: CalendarPageClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
    const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
    const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | undefined>(undefined);
    const [defaultHabitTaskValues, setDefaultHabitTaskValues] = useState<Partial<HabitTaskFormValues> | undefined>(undefined);

    const [isDayDetailOpen, setDayDetailOpen] = useState(false);
    const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);
    const [wasCommitmentPanelOpen, setWasCommitmentPanelOpen] = useState(false);
    
    // Reference date for actions is now always the current date.
    const [referenceDate, setReferenceDate] = useState(() => new Date());

    const handleOpenAddTaskDialog = (date: Date) => {
        setEditingHabitTask(null);
        setDefaultHabitTaskValues(undefined);
        setSelectedDateForDialog(date);
        setHabitTaskDialogOpen(true);
    };

    const handleOpenEditTaskDialog = (habitTask: HabitTask, date?: Date) => {
        setEditingHabitTask(habitTask);
        setDefaultHabitTaskValues(undefined);
        setSelectedDateForDialog(date || new Date());
        setHabitTaskDialogOpen(true);
    };

    const handleOpenAddCommitmentDialog = (frequency: HabitFrequency) => {
        setEditingHabitTask(null);
        setSelectedDateForDialog(new Date()); 
        setDefaultHabitTaskValues({
            type: 'habit',
            frequency: frequency,
        });
        setHabitTaskDialogOpen(true);
    };

    const handleOpenDayDetail = (day: Date) => {
        setSelectedDayForDetail(day);
        setDayDetailOpen(true);
    };
    
    const handleCloseDayDetail = () => {
        setDayDetailOpen(false);
        setWasCommitmentPanelOpen(false);
    }

    const handleDayClick = (day: Date) => {
        handleOpenDayDetail(day);
    }

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

    const handleToggleCommitment = (id: string, completed: boolean, date: Date, progressValue?: number) => {
        const task = initialData.commitments.find(ht => ht.id === id);
        if (!task) return;

        const completionDate = date.toISOString().split('T')[0];
        
        startTransition(async () => {
            try {
                await logHabitTaskCompletion(id, task.type, completionDate, progressValue);
                toast({ title: '¡Progreso registrado!' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la acción.' });
            }
        });
    };

    const handleUndoCommitment = (id: string, date: Date) => {
        const task = initialData.commitments.find(ht => ht.id === id);
        if (!task) return;

        const completionDate = date.toISOString().split('T')[0];
        startTransition(async () => {
            try {
                await removeHabitTaskCompletion(id, task.type, completionDate);
                toast({ title: 'Registro deshecho' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo deshacer la acción.' });
            }
        });
    };


    return (
        <div className="flex flex-1 h-screen overflow-hidden">
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
                <CalendarView
                    initialMonthString={initialMonthString}
                    dailyProgressData={initialData.dailyProgress}
                    habitTasksData={initialData.habitTasks}
                    areaPrks={initialData.areaPrks || []}
                    weeklyProgressData={initialData.weeklyProgress || []}
                    monthlyProgress={initialData.monthlyProgress}
                    commitments={initialData.commitments}
                    onDayClick={handleDayClick}
                    onToggleCommitment={handleToggleCommitment}
                    onUndoCommitment={handleUndoCommitment}
                    onEditCommitment={handleOpenEditTaskDialog}
                    onArchiveCommitment={(id) => handleArchiveHabitTask(id, new Date())}
                />
            </main>
            <aside className={cn(
                "hidden lg:flex bg-card/50 border-l transition-all duration-300 ease-in-out", 
                isSidebarOpen ? 'w-96 p-4' : 'w-16 p-2 items-center justify-center'
            )}>
                <CommitmentsSidebar
                    commitments={initialData.commitments || []}
                    selectedDate={referenceDate}
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                    onAddCommitment={handleOpenAddCommitmentDialog}
                    onEditCommitment={handleOpenEditTaskDialog}
                />
            </aside>
            <DayDetailDialog 
                isOpen={isDayDetailOpen}
                onOpenChange={handleCloseDayDetail}
                day={selectedDayForDetail}
                tasks={selectedDayForDetail ? initialData.habitTasks[format(selectedDayForDetail, 'yyyy-MM-dd')] || [] : []}
                onAddTask={(date) => {
                    handleCloseDayDetail(); 
                    handleOpenAddTaskDialog(date);
                }}
                onEditTask={(task, date) => {
                    handleCloseDayDetail();
                    handleOpenEditTaskDialog(task, date);
                }}
                onArchiveTask={handleArchiveHabitTask}
            />
             <AddHabitTaskDialog 
                isOpen={isHabitTaskDialogOpen}
                onOpenChange={setHabitTaskDialogOpen}
                onSave={handleSaveHabitTask}
                habitTask={editingHabitTask}
                defaultDate={selectedDateForDialog}
                areaPrks={initialData.areaPrks}
                defaultValues={defaultHabitTaskValues}
            />
        </div>
    );
}
