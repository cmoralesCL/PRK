'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckSquare, Repeat } from 'lucide-react';
import type { JournalEntry } from '@/lib/types';

interface JournalViewProps {
  journalData: JournalEntry[];
}

const TypeIcon = ({ type }: { type: 'habit' | 'task' }) => {
  if (type === 'habit') {
    return <Repeat className="h-4 w-4 text-primary" />;
  }
  return <CheckSquare className="h-4 w-4 text-accent" />;
};

export function JournalView({ journalData }: JournalViewProps) {
  if (journalData.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-headline font-semibold">Tu diario está en blanco</h2>
        <p className="mt-2 text-muted-foreground">
          Completa hábitos y tareas en el dashboard para empezar a registrar tu progreso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {journalData.map(({ date, items }) => (
        <Card key={date} className="bg-card/70 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              {format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-md bg-secondary/30">
                  <div className="pt-1">
                    <TypeIcon type={item.type} />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{item.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Target className="h-3.5 w-3.5" />
                      <span>{item.lifePrkTitle}</span>
                      <span>/</span>
                      <span className="font-medium text-secondary-foreground">{item.areaPrkTitle}</span>
                    </div>
                  </div>
                  <Badge variant={item.type === 'habit' ? 'default' : 'secondary'} className="capitalize">
                    {item.type === 'habit' ? 'Hábito' : 'Tarea'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
