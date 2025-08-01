
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  BarChartIcon,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import type { KpiData } from '@/lib/types';
import { ProgressChart } from './progress-chart';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface KpiDashboardProps {
  data: KpiData;
}

export function KpiDashboard({ data }: KpiDashboardProps) {
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily');

  const kpis = [
    {
      title: 'Progreso del Día',
      value: data.todayProgress,
      icon: ClockIcon,
    },
    {
      title: 'Progreso Semanal',
      value: data.weeklyProgress,
      icon: CalendarIcon,
    },
    {
      title: 'Progreso Mensual',
      value: data.monthlyProgress,
      icon: CalendarDaysIcon,
    },
    {
      title: 'Mes Anterior',
      value: data.prevMonthProgress,
      icon: ChevronLeftIcon,
    },
    {
      title: 'Progreso Semestral',
      value: data.semesterProgress,
      icon: BarChartIcon,
    },
    {
      title: 'Progreso Anual',
      value: data.annualProgress,
      icon: ChevronRightIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
          />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="font-headline flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
               Evolución de Progreso
            </CardTitle>
            <ToggleGroup 
              type="single" 
              defaultValue="daily"
              onValueChange={(value: 'daily' | 'monthly') => value && setChartView(value)}
              size="sm"
            >
              <ToggleGroupItem value="daily" aria-label="Vista diaria">
                Últimos 30 días
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" aria-label="Vista mensual">
                Últimos 12 meses
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
           <ProgressChart 
              data={chartView === 'daily' ? data.dailyProgressChartData : data.monthlyProgressChartData} 
              dataKey={chartView === 'daily' ? 'date' : 'month'}
            />
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

function KpiCard({ title, value, icon: Icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}%</div>
        <Progress value={value} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
}
