
'use client';

import { CheckSquare, Repeat, Archive, Pencil, Calendar, MoreVertical, Layers } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HabitTask } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HabitTaskListItemProps {
  item: HabitTask;
  onToggle?: (id: string, completed: boolean, date: Date, progressValue?: number) => void;
  onArchive?: (id: string) => void;
  onEdit?: (habitTask: HabitTask) => void;
  selectedDate: Date;
  variant?: 'dashboard' | 'calendar' | 'dialog';
}

export function HabitTaskListItem({ 
    item, 
    onToggle, 
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
  const [progressValue, setProgressValue] = useState(item.current_progress_value ?? '');

  useEffect(() => {
    setIsCompleted(item.completedToday ?? false);
    setProgressValue(item.current_progress_value ?? '');
  }, [item.completedToday, item.current_progress_value]);

  const handleToggle = (checked: boolean) => {
    setIsCompleted(checked);
    if (onToggle) {
        onToggle(item.id, checked, selectedDate);
    }
  }
  
  const handleSaveQuantitative = () => {
    if (onToggle) {
      const numericValue = Number(progressValue);
      if (!isNaN(numericValue)) {
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

  if (variant === 'dialog') {
    // Simplified version for dialog, can be expanded if needed
    return (
        <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 group">
            <Checkbox
                id={`dialog-${item.id}`}
                checked={isCompleted}
                onCheckedChange={handleToggle}
                className="h-4 w-4"
                disabled={!onToggle || item.measurement_type === 'quantitative'}
            />
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label 
                htmlFor={`dialog-${item.id}`}
                className={cn("text-sm text-secondary-foreground flex-grow text-left font-normal cursor-pointer", isCompleted && "line-through", !onToggle && "cursor-default")}
            >
                {item.title}
            </Label>
            {(onEdit || (onArchive && variant !== 'dialog')) && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                        )}
                        {onArchive && (
                            <DropdownMenuItem onClick={() => onArchive(item.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archivar
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
  }

  // Dashboard variant
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200 group">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex flex-col flex-grow gap-2">
            <div className="flex items-center space-x-3">
                {item.measurement_type !== 'quantitative' ? (
                    <Checkbox
                        id={item.id}
                        checked={isCompleted}
                        onCheckedChange={handleToggle}
                        disabled={!onToggle}
                    />
                ) : <div className="w-4 h-4" /> }

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
                <div className="flex items-center transition-opacity">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEdit(item)}
                        >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                    {onArchive && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onArchive(item.id)}
                        >
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            {item.measurement_type === 'quantitative' && onToggle && (
                <div className="pl-8 flex items-center gap-2">
                    <Input
                        type="number"
                        value={progressValue}
                        onChange={(e) => setProgressValue(e.target.value)}
                        className="h-8 w-20"
                        placeholder="Valor"
                    />
                    <span className="text-sm text-muted-foreground">
                       / {item.measurement_goal?.target} {item.measurement_goal?.unit}
                    </span>
                    <Button size="sm" className="h-8" onClick={handleSaveQuantitative}>Guardar</Button>
                </div>
            )}
            
            {item.type !== 'habit' && item.due_date && (
                <div className="pl-8 pt-1 flex items-center gap-1.5">
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
