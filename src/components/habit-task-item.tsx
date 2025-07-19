
'use client';

import { CheckSquare, Repeat, Layers } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HabitTask } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';


interface HabitTaskItemProps {
  item: HabitTask;
  onToggle?: (id: string, completed: boolean, date: Date) => void;
  selectedDate: Date;
}

export function HabitTaskItem({ item, onToggle, selectedDate }: HabitTaskItemProps) {
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
  const isCompleted = item.completedToday ?? false;

  const handleToggle = (checked: boolean) => {
    if (onToggle) {
        onToggle(item.id, !!checked, selectedDate);
    }
  }

  const content = (
     <div className="flex items-center gap-1.5 p-1 rounded-md bg-secondary/50 text-secondary-foreground">
        <Checkbox
            id={`cal-${item.id}-${format(selectedDate, 'yyyy-MM-dd')}`}
            checked={isCompleted}
            onCheckedChange={handleToggle}
            className={cn("h-3.5 w-3.5 border-secondary-foreground/50", !onToggle && "pointer-events-none")}
            aria-label={`Marcar ${item.title} como completada`}
        />
        <Icon className="h-3.5 w-3.5 text-current/80 flex-shrink-0" />
        <Label 
            htmlFor={`cal-${item.id}-${format(selectedDate, 'yyyy-MM-dd')}`}
            className={cn(
                "text-xs truncate flex-grow text-left font-normal", 
                isCompleted && "line-through",
                onToggle ? "cursor-pointer" : "cursor-default pointer-events-none"
            )}
        >
            {item.title}
        </Label>
    </div>
  );

  return (
    <TooltipProvider>
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <div className="group">
                    {content}
                </div>
            </TooltipTrigger>
            <TooltipContent>
            <p>{item.title}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
