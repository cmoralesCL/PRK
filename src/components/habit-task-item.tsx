
'use client';

import { CheckSquare, Repeat } from 'lucide-react';
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
  const Icon = item.type === 'habit' ? Repeat : CheckSquare;
  const isCompleted = item.completedToday ?? false;

  const handleToggle = (checked: boolean) => {
    if (onToggle) {
        onToggle(item.id, !!checked, selectedDate);
    }
  }

  const content = (
     <div className="flex items-center gap-1.5 p-1 rounded-md bg-secondary/50 text-secondary-foreground group-hover:bg-accent-foreground/20 group-hover:text-secondary-foreground">
        <Checkbox
            id={`cal-${item.id}-${format(selectedDate, 'yyyy-MM-dd')}`}
            checked={isCompleted}
            onCheckedChange={handleToggle}
            className="h-3.5 w-3.5 border-secondary-foreground/50 group-hover:border-secondary-foreground data-[state=checked]:border-primary-foreground"
            disabled={!onToggle}
        />
        <Icon className="h-3.5 w-3.5 text-current/80 flex-shrink-0" />
        <Label 
            htmlFor={`cal-${item.id}-${format(selectedDate, 'yyyy-MM-dd')}`}
            className={cn("text-xs truncate flex-grow text-left font-normal cursor-pointer", isCompleted && "line-through")}
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
