'use client';

import { Layers, CheckCircle, Orbit, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsData } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, BarChart as RechartsBarChart } from "recharts"
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { ProgressCircle } from './ui/progress-circle';

type Level = 'orbits' | 'phases' | 'pulses';

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onFilterChange: (filters: { level: Level; orbitId?: string | null; phaseId?: string | null; }) => void;
  filters: { level: Level, orbitId?: string | null; phaseId?: anystring | null; };
}

export function AnalyticsDashboard({ data, onFilterChange, filters }: AnalyticsDashboardProps) {
  const { stats, chartData } = data;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLevelChange = (value: Level) => {
    onFilterChange({ level: value, orbitId: null, phaseId: null });
  }
  
  const chartConfig = {
      progress: {
        label: "Progreso %",
        color: "hsl(var(--primary))",
      },
      remaining: {
        label: "Restante %",
        color: "hsl(var(--muted))",
      }
  };
  
  let chartTitle = 'Progreso por Órbita';
  if (filters.level === 'phases') {
      chartTitle = `Progreso por Fase`;
  } else if (filters.level === 'pulses') {
       chartTitle = `Progreso por Pulso`;
  }
  
  const tickFormatter = (value: string) => {
    if (value.length > 20) {
      return value.slice(0, 20) + '...';
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Analítica</h1>
          <p className="text-muted-foreground">Visualiza y compara progreso por Órbitas, Fases y Pulsos.</p>
        </div>
        <Tabs value={filters.level} onValueChange={(v) => handleLevelChange(v as Level)} className="w-full max-w-xs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orbits">Órbitas</TabsTrigger>
            <TabsTrigger value="phases">Fases</TabsTrigger>
            <TabsTrigger value="pulses">Pulsos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ProgressCircle} title="Promedio de progreso" value={`${stats.overallProgress}%`} footer={`${stats.stat1_value} órbitas`} progress={stats.overallProgress} />
          <StatCard icon={Orbit} title="Órbitas" value={stats.stat1_value.toString()} footer={stats.stat1_label} isCount />
          <StatCard icon={Layers} title="Fases" value={stats.stat2_value.toString()} footer={stats.stat2_label} isCount />
          <StatCard icon={CheckCircle} title="Pulsos" value={stats.stat3_value.toString()} footer={stats.stat3_label} isCount />
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              {chartTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Apilado: Progreso vs Restante</p>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full h-96">
            {isClient ? (
                <RechartsBarChart 
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      top: 10, right: 20, bottom: 20, left: 0
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        interval={0}
                        tickFormatter={tickFormatter}
                    />
                    <YAxis type="number" domain={[0,100]} />
                    <ChartTooltip
                        cursor={true}
                        content={<ChartTooltipContent indicator="line" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="progress" stackId="a" fill="var(--color-progress)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[0, 0, 0, 0]} />

                </RechartsBarChart>
            ) : (
                <Skeleton className="h-full w-full" />
            )}
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  footer: string;
  icon: React.ElementType;
  progress?: number;
  isCount?: boolean;
}

function StatCard({ title, value, footer, icon: Icon, progress, isCount = false }: StatCardProps) {
  if (isCount) {
    return (
       <Card>
        <CardHeader className="pb-4">
           <div className="p-2 bg-primary/10 rounded-lg w-fit">
              <Icon className="h-6 w-6 text-primary" />
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </CardContent>
    </Card>
    )
  }

  return (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            {progress !== undefined ? (
                <ProgressCircle progress={progress} className="h-14 w-14" />
            ) : (
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground ml-[68px]">{footer}</p>
        </CardContent>
    </Card>
  );
}
