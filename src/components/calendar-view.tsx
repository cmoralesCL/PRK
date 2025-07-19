
'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, startOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/header';
import { ProgressCalendar } from '@/components/progress-calendar';
import { AddHabitTaskDialog, type HabitTaskFormValues } from './add-habit-task-dialog';
import type { DailyProgressSnapshot, HabitTask, AreaPrk, WeeklyProgressSnapshot } from '@/lib/types';
import { addHabitTask, updateHabitTask, archiveHabitTask, logHabitTaskCompletion, removeHabitTaskCompletion } from '@/app/actions';
import { DayDetailDialog } from './day-detail-dialog';


interface CalendarViewProps {
    initialMonthString: string;
    dailyProgressData: DailyProgressSnapshot[];
    habitTasksData: Record<string, HabitTask[]>;
    areaPrks: AreaPrk[];
    weeklyProgressData: WeeklyProgressSnapshot[];
}

export function CalendarView({ 
    initialMonthString, 
    dailyProgressData, 
    habitTasksData, 
    areaPrks,
    weeklyProgressData
}: CalendarViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isHabitTaskDialogOpen, setHabitTaskDialogOpen] = useState(false);
    const [editingHabitTask, setEditingHabitTask] = useState<HabitTask | null>(null);
    const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | undefined>(undefined);
    
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
    
    const handleCloseDayDetail = () => {
        setDayDetailOpen(false);
    }

    const handleDayClick = (day: Date) => {
        handleOpenDayDetail(day);
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
                onOpenChange={handleCloseDayDetail}
                day={selectedDayForDetail}
                tasks={selectedDayForDetail ? habitTasksData[format(selectedDayForDetail, 'yyyy-MM-dd')] || [] : []}
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
        </>
    );
}
