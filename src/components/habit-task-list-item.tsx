
'use client';

import { CheckSquare, Repeat, Archive, Pencil, Calendar, MoreVertical, Layers, Save, Plus, Undo2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HabitTask } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { format, parseISO, isToday, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { Progress } from './ui/progress';

interface HabitTaskListItemProps {
  item: HabitTask;
  onToggle?: (id: string, completed: boolean, date: Date, progressValue?: number) => void;
  onUndo?: (id: string, date: Date) => void;
  onArchive?: (id: string) => void;
  onEdit?: (habitTask: HabitTask) => void;
  selectedDate: Date;
  variant?: 'dashboard' | 'calendar' | 'dialog';
}

export function HabitTaskListItem({ 
    item, 
    onToggle, 
    onUndo,
    onArchive, 
    onEdit, 
    selectedDate, 
    variant = 'dashboard' 
}: HabitTaskListItemProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'habit':
        return Repeat;
      case 'project':
        return Layers;
      case 'task':
      default:
        return CheckSquare;
    }
  };
  const Icon = getIcon();
  const [isCompleted, setIsCompleted] = useState(item.completedToday ?? false);
  const [progressValue, setProgressValue] = useState('');
  const [currentTotal, setCurrentTotal] = useState(item.current_progress_value ?? 0);

  const [hasLoggedToday, setHasLoggedToday] = useState(false);


  useEffect(() => {
    setIsCompleted(item.completedToday ?? false);
    setCurrentTotal(item.current_progress_value ?? 0)
    setProgressValue(''); // Reset input after a save
    
    // Check if there's a log for the selected date for accumulative binary tasks
    if (item.measurement_type === 'binary' && item.frequency?.includes('ACUMULATIVO') && item.id) {
        // This is a proxy. The real check is in the parent component that fetches logs.
        // Here, we just rely on `item.hasLoggedToday` if provided, or manage a local state.
        // A more robust way would be to pass this state down from the parent.
        // For now, we assume a log exists if progress > previous progress
    }

  }, [item.completedToday, item.current_progress_value, item.id, item.measurement_type, item.frequency]);

  const handleToggle = (checked: boolean) => {
    setIsCompleted(checked);
    if (onToggle) {
        onToggle(item.id, checked, selectedDate);
    }
  }

  const handleAddInstance = () => {
    if (onToggle) {
      onToggle(item.id, true, selectedDate, 1); // progressValue of 1 for one instance
    }
  }

  const handleUndoInstance = () => {
    if (onUndo) {
        onUndo(item.id, selectedDate);
    }
  }
  
  const handleSaveQuantitative = () => {
    if (onToggle) {
      const numericValue = Number(progressValue);
      if (!isNaN(numericValue) && numericValue > 0) {
        onToggle(item.id, true, selectedDate, numericValue);
      }
    }
  };

  if (variant === 'calendar') {
    return (
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-secondary/50">
            <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <p
                className={cn("text-xs text-secondary-foreground truncate flex-grow text-left font-normal", item.completedToday && "line-through")}
            >
                {item.title}
            </p>
        </div>
    )
  }
  
  // --- NEW VARIANT FOR ACCUMULATIVE BINARY ---
  if (item.measurement_type === 'binary' && item.frequency?.includes('ACUMULATIVO')) {
      const target = item.measurement_goal?.target_count ?? 1;
      const progressPercentage = target > 0 ? (currentTotal / target) * 100 : 0;
      const hasLogForSelectedDate = item.logs?.some(log => format(parseISO(log.completion_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));

      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200 group bg-secondary/30 border border-secondary">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <Label
                        className={cn(
                            'text-sm font-medium leading-none flex-grow',
                            isCompleted && 'text-muted-foreground'
                        )}
                    >
                        {item.title}
                    </Label>
                </div>
                <div className="flex items-center transition-opacity">
                    {onEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                    {onArchive && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(item.id)}>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>
            {item.description && <p className="pl-8 text-xs text-muted-foreground">{item.description}</p>}
            
            <div className="pl-8 space-y-2">
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-primary">{Math.floor(currentTotal)} / {target} veces</span>
                 </div>
                 <Progress value={progressPercentage} className="h-2" />
            </div>

            {onToggle && (
                <div className="pl-8 flex items-center gap-2 pt-1">
                    <Button size="sm" className="h-8" onClick={handleAddInstance} disabled={!!hasLogForSelectedDate}>
                      <Plus className="h-4 w-4 mr-2"/>
                      Log
                    </Button>
                     {hasLogForSelectedDate && onUndo && (
                         <Button size="sm" variant="outline" className="h-8" onClick={handleUndoInstance}>
                            <Undo2 className="h-4 w-4 mr-2"/>
                            Deshacer
                        </Button>
                    )}
                </div>
            )}
        </div>
      )
  }


  // Dashboard & Dialog Variants
  if (item.measurement_type === 'quantitative') {
    const target = item.measurement_goal?.target_count ?? 1;
    const progressPercentage = target > 0 ? (currentTotal / target) * 100 : 0;

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200 group bg-secondary/30 border border-secondary">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <Label
                        className={cn(
                            'text-sm font-medium leading-none flex-grow',
                            isCompleted && 'line-through text-muted-foreground'
                        )}
                    >
                        {item.title}
                    </Label>
                </div>
                <div className="flex items-center transition-opacity">
                    {onEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                    {onArchive && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(item.id)}>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>
            {item.description && <p className="pl-8 text-xs text-muted-foreground">{item.description}</p>}
            
            <div className="pl-8 space-y-2">
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-primary">{currentTotal}</span>
                    <span className="text-xs text-muted-foreground">/ {item.measurement_goal?.target_count} {item.measurement_goal?.unit}</span>
                 </div>
                 <Progress value={progressPercentage} className="h-2" />
            </div>

            {onToggle && (
                <div className="pl-8 flex items-center gap-2 pt-1">
                    <Input
                        type="number"
                        value={progressValue}
                        onChange={(e) => setProgressValue(e.target.value)}
                        className="h-8 w-24 bg-background"
                        placeholder="Añadir..."
                    />
                    <Button size="sm" className="h-8" onClick={handleSaveQuantitative}>
                      <Save className="h-4 w-4 mr-2"/>
                      Guardar
                    </Button>
                </div>
            )}
        </div>
    );
  }

  // Default binary/task item
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200 group">
        <Checkbox
            id={item.id}
            checked={isCompleted}
            onCheckedChange={handleToggle}
            disabled={!onToggle}
            className="h-5 w-5"
        />
        <div className="flex flex-col flex-grow gap-1">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <Label
                        htmlFor={item.id}
                        className={cn(
                            'text-sm font-medium leading-none flex-grow',
                            isCompleted && 'line-through text-muted-foreground',
                            !onToggle ? "cursor-default" : "cursor-pointer"
                        )}
                    >
                        {item.title}
                    </Label>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <div className="flex items-center transition-opacity">
                    {onEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                    {onArchive && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(item.id)}>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>
            
            {item.type !== 'habit' && item.due_date && (
                <div className="pl-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                        Vence: {format(parseISO(item.due_date), 'd MMM yyyy', { locale: es })}
                    </span>
                </div>
            )}
        </div>
    </div>
  );
}
