'use client';

import { CheckSquare, Repeat } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HabitTask } from '@/lib/types';

interface HabitTaskItemProps {
  item: HabitTask;
  onToggle: (id: string, completed: boolean) => void;
}

export function HabitTaskItem({ item, onToggle }: HabitTaskItemProps) {
  const Icon = item.type === 'habit' ? Repeat : CheckSquare;

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <Checkbox
        id={item.id}
        checked={item.completed}
        onCheckedChange={(checked) => onToggle(item.id, !!checked)}
      />
      <Label
        htmlFor={item.id}
        className={cn(
          'text-sm font-medium leading-none cursor-pointer',
          item.completed && 'line-through text-muted-foreground'
        )}
      >
        {item.title}
      </Label>
    </div>
  );
}
