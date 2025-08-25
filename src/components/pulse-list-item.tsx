
'use client';

import { CheckCircle, Circle, Zap } from 'lucide-react';
import type { Pulse, ColorTheme } from '@/lib/types';
import { THEMES } from '@/lib/themes';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Archive } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface PulseListItemProps {
  pulse: Pulse;
  colorTheme: ColorTheme;
  onEdit: () => void;
  onArchive: () => void;
}

export function PulseListItem({
  pulse,
  colorTheme,
  onEdit,
  onArchive,
}: PulseListItemProps) {
  const theme = THEMES[colorTheme];
  const progress = pulse.progress ?? 0;
  const isCompleted = progress >= 100;
  const CompletionIcon = isCompleted ? CheckCircle : Circle;

  return (
    <div className="flex items-center gap-3 py-2 text-sm">
        <CompletionIcon 
            className={cn("h-5 w-5 flex-shrink-0", isCompleted ? 'text-green-500' : 'text-muted-foreground')} 
            style={{ color: isCompleted ? theme.gradient.split(', ')[1].slice(0, -1) : undefined }}
        />
        <div className="flex-grow">
            <p className="font-medium text-foreground">{pulse.title}</p>
            <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">{pulse.type}</Badge>
                <Badge variant="outline">Impacto: {pulse.weight}/5</Badge>
                 {pulse.progress !== undefined && (
                     <Badge variant="outline" className="font-semibold">{Math.round(pulse.progress)}%</Badge>
                 )}
            </div>
        </div>
        <div className="flex items-center gap-1">
            {pulse.is_critical && <Zap className="h-4 w-4 text-yellow-500" />}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Pulso
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onArchive}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archivar Pulso
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
  );
}
