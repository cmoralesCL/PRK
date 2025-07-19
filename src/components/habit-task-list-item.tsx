'use client';

import { CheckSquare, Repeat, Archive, Pencil, Calendar, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HabitTask } from '@/lib/types';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface HabitTaskListItemProps {
  item: HabitTask;
  onToggle?: (id: string, completed: boolean, date: Date) => void;
  onArchive?: (id: string) => void;
  onEdit?: (habitTask: HabitTask) => void;
  selectedDate: Date;
  variant?: 'dashboard' | 'calendar';
}

export function HabitTaskListItem({ 
    item, 
    onToggle, 
    onArchive, 
    onEdit, 
    selectedDate, 
    variant = 'dashboard' 
}: HabitTaskListItemProps) {
  const Icon = item.type === 'habit' ? Repeat : CheckSquare;
  const isCompleted = item.completedToday ?? false;

  const handleToggle = (checked: boolean) => {
    if (onToggle) {
        onToggle(item.id, !!checked, selectedDate);
    }
  }

  if (variant === 'calendar') {
    return (
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-secondary/50">
            <Checkbox
                id={`cal-${item.id}`}
                checked={isCompleted}
                onCheckedChange={handleToggle}
                className="h-3.5 w-3.5"
            />
            <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Label 
                htmlFor={`cal-${item.id}`}
                className={cn("text-xs text-secondary-foreground truncate flex-grow text-left font-normal cursor-pointer", isCompleted && "line-through")}
            >
                {item.title}
            </Label>
        </div>
    )
  }

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200 group">
      <div className="flex flex-col flex-grow">
        <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Checkbox
                id={item.id}
                checked={isCompleted}
                onCheckedChange={handleToggle}
            />
            <Label
                htmlFor={item.id}
                className={cn(
                'text-sm font-medium leading-none cursor-pointer flex-grow',
                isCompleted && 'line-through text-muted-foreground'
                )}
            >
                {item.title}
            </Label>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
        {item.type === 'task' && item.dueDate && (
            <div className="pl-8 pt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                    Vence: {format(parseISO(item.dueDate), 'd MMM yyyy', { locale: es })}
                </span>
            </div>
        )}
        {item.type === 'habit' && item.progress !== undefined && (
            <div className='flex items-center gap-2 pl-8 pt-1'>
                <Progress value={item.progress} className='h-1.5 w-full' />
                <span className='text-xs text-muted-foreground font-mono w-12 text-right'>
                    {item.progress.toFixed(0)}%
                </span>
            </div>
        )}
      </div>
    </div>
  );
}
