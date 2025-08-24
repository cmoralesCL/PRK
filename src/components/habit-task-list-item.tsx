

'use client';

import { CheckSquare, Repeat, Archive, Pencil, MoreVertical, Plus, Undo2, GripVertical, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HabitTask } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { isSameDay, parseISO } from 'date-fns';
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
  isFocus?: boolean;
  isDraggable?: boolean;
}

export function HabitTaskListItem({ 
    item, 
    onToggle, 
    onUndo,
    onArchive, 
    onEdit, 
    selectedDate, 
    variant = 'dashboard',
    isFocus = false,
    isDraggable = false,
}: HabitTaskListItemProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'habit':
        return Repeat;
      case 'task':
      default:
        return CheckSquare;
    }
  };
  const Icon = getIcon();
  const [isCompleted, setIsCompleted] = useState(item.completedToday ?? false);
  const [progressValue, setProgressValue] = useState('');
  const [currentTotal, setCurrentTotal] = useState(item.current_progress_value ?? 0);
  const [hasLogForSelectedDate, setHasLogForSelectedDate] = useState(false);


  useEffect(() => {
    setIsCompleted(item.completedToday ?? false);
    setCurrentTotal(item.current_progress_value ?? 0)
    setProgressValue('');
    
    if (item.measurement_type === 'binary' && item.frequency?.includes('ACUMULATIVO')) {
        const logExists = item.logs?.some(log => isSameDay(parseISO(log.completion_date), selectedDate));
        setHasLogForSelectedDate(!!logExists);
    }

  }, [item.completedToday, item.current_progress_value, item.logs, selectedDate, item.measurement_type, item.frequency]);

  const handleToggle = (checked: boolean) => {
    setIsCompleted(checked);
    if (onToggle) {
        onToggle(item.id, checked, selectedDate);
    }
  }

  const handleAddInstance = () => {
    if (onToggle) {
      onToggle(item.id, true, selectedDate, 1);
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

  const handleArchive = () => {
    if (onArchive) {
      onArchive(item.id, selectedDate);
    }
  }

  // --- Type B: Quantitative / Frequency Habit ---
  if (item.measurement_type === 'quantitative' || (item.measurement_type === 'binary' && item.frequency?.includes('ACUMULATIVO'))) {
      const target = item.measurement_goal?.target_count ?? 1;
      const isBinaryAccumulative = item.measurement_type === 'binary';
      const progressPercentage = target > 0 ? (currentTotal / target) * 100 : 0;

      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/30 border border-secondary transition-colors duration-200 group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary/10 text-primary p-1.5 rounded-full">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className='text-sm font-medium leading-none flex-grow'>
                          {item.title}
                      </Label>
                      {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                </div>
                <div className="flex items-center -mr-2 -mt-1">
                    {onEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit && onEdit(item)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                    {onArchive && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleArchive}>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="pl-10 space-y-2">
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-primary">
                        {isBinaryAccumulative 
                            ? `${Math.floor(currentTotal)} / ${target} veces`
                            : `${currentTotal} / ${target} ${item.measurement_goal?.unit || ''}`
                        }
                    </span>
                 </div>
                 <Progress value={progressPercentage} className="h-2" />
            </div>

            {onToggle && (
                <div className="pl-10 flex items-center gap-2 pt-1">
                    {isBinaryAccumulative ? (
                        <>
                            <Button size="sm" className="h-8" onClick={handleAddInstance} disabled={hasLogForSelectedDate}>
                              <Plus className="h-4 w-4 mr-2"/>
                              Registrar Avance
                            </Button>
                             {hasLogForSelectedDate && onUndo && (
                                 <Button size="sm" variant="outline" className="h-8" onClick={handleUndoInstance}>
                                    <Undo2 className="h-4 w-4 mr-2"/>
                                    Deshacer
                                </Button>
                            )}
                        </>
                    ) : (
                       !isCompleted && (
                         <>
                            <Input
                                type="number"
                                value={progressValue}
                                onChange={(e) => setProgressValue(e.target.value)}
                                className="h-8 w-24 bg-background"
                                placeholder="Añadir..."
                            />
                            <Button size="sm" className="h-8" onClick={handleSaveQuantitative}>
                              <Plus className="h-4 w-4 mr-2"/>
                              Registrar Avance
                            </Button>
                         </>
                       )
                    )}
                </div>
            )}
        </div>
      )
  }

  // --- Type A: Default binary/task item (Checklist) ---
  return (
    <div className={cn(
        "flex items-center space-x-3 p-2 border-b transition-colors duration-200 group",
        isFocus && "bg-secondary/70"
    )}>
        {isDraggable && (
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
        )}
        <Checkbox
            id={item.id}
            checked={isCompleted}
            onCheckedChange={handleToggle}
            disabled={!onToggle}
            className="h-5 w-5"
        />
        <div className="flex-grow">
            <Label
                htmlFor={item.id}
                className={cn(
                    'text-sm font-medium leading-none',
                    isCompleted && 'line-through text-muted-foreground',
                    !onToggle ? "cursor-default" : "cursor-pointer"
                )}
            >
                {isFocus && <Star className="h-4 w-4 inline-block mr-2 text-yellow-500 fill-yellow-400" />}
                {item.title}
            </Label>
        </div>
        <div className="flex items-center ml-auto">
            {onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onEdit && onEdit(item)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
            {onArchive && (
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={handleArchive}>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
        </div>
    </div>
  );
}
