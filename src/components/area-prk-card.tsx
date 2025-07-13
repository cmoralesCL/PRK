'use client';

import { Gauge, Plus, Sparkles, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HabitTaskItem } from './habit-task-item';
import type { AreaPrk, HabitTask } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"


interface AreaPrkCardProps {
  areaPrk: AreaPrk;
  habitTasks: HabitTask[];
  onAddHabitTask: (areaPrkId: string) => void;
  onEditHabitTask: (habitTask: HabitTask) => void;
  onToggleHabitTask: (id: string, completed: boolean) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
  onArchive: (id: string) => void;
  onArchiveHabitTask: (id: string) => void;
}

export function AreaPrkCard({
  areaPrk,
  habitTasks,
  onAddHabitTask,
  onEditHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
  onArchive,
  onArchiveHabitTask,
}: AreaPrkCardProps) {
  const progress = areaPrk.progress ?? 0;

  return (
    <Card className="bg-card/70 shadow-md transition-shadow hover:shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-accent" />
                    {areaPrk.title}
                </CardTitle>
                <CardDescription>
                    Progreso General
                </CardDescription>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onArchive(areaPrk.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar PRK de Área
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progreso</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <h4 className="text-sm font-semibold text-muted-foreground">Hábitos y Tareas</h4>
        {habitTasks.length > 0 ? (
          <div className="space-y-1">
            {habitTasks.map((item) => (
              <HabitTaskItem key={item.id} item={item} onToggle={onToggleHabitTask} onArchive={onArchiveHabitTask} onEdit={onEditHabitTask} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aún no hay hábitos o tareas. ¡Agrega uno para empezar!</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => onGetAiSuggestions(areaPrk)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Sugerir Tareas
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAddHabitTask(areaPrk.id)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Hábito/Tarea
        </Button>
      </CardFooter>
    </Card>
  );
}
