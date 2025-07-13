'use client';

import { Gauge, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HabitTaskItem } from './habit-task-item';
import type { AreaPrk, HabitTask } from '@/lib/types';

interface AreaPrkCardProps {
  areaPrk: AreaPrk;
  habitTasks: HabitTask[];
  onUpdateProgress: (areaPrk: AreaPrk) => void;
  onAddHabitTask: (areaPrkId: string) => void;
  onToggleHabitTask: (id: string, completed: boolean) => void;
  onGetAiSuggestions: (areaPrk: AreaPrk) => void;
}

export function AreaPrkCard({
  areaPrk,
  habitTasks,
  onUpdateProgress,
  onAddHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
}: AreaPrkCardProps) {
  const progress = areaPrk.targetValue > 0 ? (areaPrk.currentValue / areaPrk.targetValue) * 100 : 0;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('es-US').format(value);
  };

  return (
    <Card className="bg-card/70 shadow-md transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-accent" />
                    {areaPrk.title}
                </CardTitle>
                <CardDescription>
                    Objetivo: {formatValue(areaPrk.targetValue)} {areaPrk.unit}
                </CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={() => onUpdateProgress(areaPrk)}>
                Registrar Progreso
             </Button>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progreso</span>
            <span>{formatValue(areaPrk.currentValue)} / {formatValue(areaPrk.targetValue)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Hábitos y Tareas</h4>
        {habitTasks.length > 0 ? (
          <div className="space-y-1">
            {habitTasks.map((item) => (
              <HabitTaskItem key={item.id} item={item} onToggle={onToggleHabitTask} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aún no hay hábitos o tareas. ¡Agrega uno para empezar!</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => onGetAiSuggestions(areaPrk)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Obtener Sugerencias
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAddHabitTask(areaPrk.id)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Hábito/Tarea
        </Button>
      </CardFooter>
    </Card>
  );
}
