'use client';

import { Gauge, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HabitTaskItem } from './habit-task-item';
import type { KeyPrk, HabitTask } from '@/lib/types';

interface KeyPrkCardProps {
  keyPrk: KeyPrk;
  habitTasks: HabitTask[];
  onUpdateProgress: (keyPrk: KeyPrk) => void;
  onAddHabitTask: (keyPrkId: string) => void;
  onToggleHabitTask: (id: string, completed: boolean) => void;
  onGetAiSuggestions: (keyPrk: KeyPrk) => void;
  onAddSuggestedTask: (keyPrkId: string, title: string) => void;
}

export function KeyPrkCard({
  keyPrk,
  habitTasks,
  onUpdateProgress,
  onAddHabitTask,
  onToggleHabitTask,
  onGetAiSuggestions,
}: KeyPrkCardProps) {
  const progress = keyPrk.targetValue > 0 ? (keyPrk.currentValue / keyPrk.targetValue) * 100 : 0;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Card className="bg-card/70 shadow-md transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-accent" />
                    {keyPrk.title}
                </CardTitle>
                <CardDescription>
                    Target: {formatValue(keyPrk.targetValue)} {keyPrk.unit}
                </CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={() => onUpdateProgress(keyPrk)}>
                Log Progress
             </Button>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{formatValue(keyPrk.currentValue)} / {formatValue(keyPrk.targetValue)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Habits & Tasks</h4>
        {habitTasks.length > 0 ? (
          <div className="space-y-1">
            {habitTasks.map((item) => (
              <HabitTaskItem key={item.id} item={item} onToggle={onToggleHabitTask} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No habits or tasks yet. Add one to get started!</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => onGetAiSuggestions(keyPrk)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Get Suggestions
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAddHabitTask(keyPrk.id)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Habit/Task
        </Button>
      </CardFooter>
    </Card>
  );
}
