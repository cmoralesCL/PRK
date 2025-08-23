
'use client';

import { Gauge, Plus, Sparkles, Archive, ChevronDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HabitTaskListItem } from './habit-task-list-item';
import type { AreaPrk, HabitTask } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';


interface AreaPrkCardProps {
  areaPrk: AreaPrk;
  habitTasks: HabitTask[];
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onToggleHabitTask: (id: string, completed: boolean, selectedDate: Date, progressValue?: number) => void;
  onUndoHabitTask: (id: string, selectedDate: Date) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
  onArchive: (id: string) => void;
  onEdit: (areaPrk: AreaPrk) => void;
  onArchiveHabitTask: (id: string) => void;
  selectedDate: Date;
}

export function AreaPrkCard({
  areaPrk,
  habitTasks,
  onAddHabitTask,
  onEditHabitTask,
  onToggleHabitTask,
  onUndoHabitTask,
  onGetAiSuggestions,
  onArchive,
  onEdit,
  onArchiveHabitTask,
  selectedDate,
}: AreaPrkCardProps) {
  const progress = areaPrk.progress ?? 0;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card className="bg-card/70 shadow-sm transition-shadow hover:shadow-md flex flex-col">
        <CollapsibleTrigger asChild>
          <CardHeader className='cursor-pointer p-4'>
            <div className="flex justify-between items-start">
                <div className='flex-grow pr-2'>
                    <CardTitle className="font-headline text-base flex items-center gap-2">
                        <div className="flex-shrink-0 bg-accent/10 text-accent p-1.5 rounded-full">
                            <Gauge className="h-4 w-4" />
                        </div>
                        {areaPrk.title}
                    </CardTitle>
                    <CardDescription className="pt-1 text-xs">
                        {areaPrk.description}
                    </CardDescription>
                </div>
                <div className='flex items-center'>
                  <ChevronDown className={`h-4 w-4 mr-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(areaPrk)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar PRK de Área
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(areaPrk.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archivar PRK de Área
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progreso</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-1 p-4 pt-0 flex-grow">
            <h4 className="text-xs font-semibold text-muted-foreground pt-2">Hábitos y Tareas</h4>
            {habitTasks.length > 0 ? (
              <div className="space-y-1">
                {habitTasks.map((item) => (
                  <HabitTaskListItem 
                    key={item.id} 
                    item={item} 
                    onToggle={onToggleHabitTask}
                    onUndo={onUndoHabitTask}
                    onArchive={onArchiveHabitTask} 
                    onEdit={onEditHabitTask} 
                    selectedDate={selectedDate} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Aún no hay hábitos o tareas. ¡Agrega uno para empezar!</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-2 pt-0">
            <Button variant="ghost" size="sm" onClick={() => onGetAiSuggestions(areaPrk)} className="h-8">
              <Sparkles className="mr-2 h-4 w-4" />
              Sugerir
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onAddHabitTask(areaPrk.id)} className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </CardFooter>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
