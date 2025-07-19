
'use client';

import { ListTodo, Plus, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { HabitTaskListItem } from './habit-task-list-item';
import type { HabitTask } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommitmentsPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  weekDate: Date | null;
  commitments: HabitTask[];
  onToggle: (id: string, completed: boolean, date: Date, progressValue?: number) => void;
  onEdit: (task: HabitTask) => void;
  onArchive: (id: string) => void;
  onAddTask: () => void;
}

export function CommitmentsPanel({ 
  isOpen, 
  onOpenChange, 
  weekDate, 
  commitments,
  onToggle,
  onEdit,
  onArchive,
  onAddTask
}: CommitmentsPanelProps) {

  if (!weekDate) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-headline">
            <ListTodo className="h-6 w-6 text-primary" />
            Compromisos Semanales
          </SheetTitle>
          <SheetDescription>
            Semana del {format(weekDate, "d 'de' LLLL", { locale: es })}. Estas son tus metas recurrentes para esta semana.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4 -mx-6 px-6">
          <div className="space-y-2">
            {commitments.length > 0 ? (
              commitments.map((commitment) => (
                <HabitTaskListItem
                  key={commitment.id}
                  item={commitment}
                  onToggle={(id, completed, date, progressValue) => onToggle(id, completed, weekDate, progressValue)}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  selectedDate={weekDate} // Use weekDate as the reference for toggling
                  variant="dashboard"
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay compromisos semanales para esta semana.
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="mt-auto -mx-6 p-4 border-t bg-background">
             <Button onClick={onAddTask} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Acción
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
