
'use client';

import { BarChart, Layers, Target, CheckCircle, Orbit, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsData } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, BarChart as RechartsBarChart, Text, Legend } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProgressCircle } from './ui/progress-circle';

type Level = 'orbits' | 'phases' | 'pulses';

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onFilterChange: (filters: { level: Level; orbitId?: string | null; phaseId?: string | null; }) => void;
  filters: { level: Level, orbitId?: string | null; phaseId?: string | null; };
}

export function AnalyticsDashboard({ data, onFilterChange, filters }: AnalyticsDashboardProps) {
  const { stats, chartData, allOrbits, allPhases } = data;
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
  
  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const MAX_LENGTH = 15;
    const displayName = payload.value.length > MAX_LENGTH ? `${payload.value.substring(0, MAX_LENGTH)}...` : payload.value;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
            x={0}
            y={0}
            dy={16}
            textAnchor="end"
            fill="hsl(var(--muted-foreground))"
            transform="rotate(-35)"
            className="text-xs"
        >
            {displayName}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Analítica</h1>
          <p className="text-muted-foreground">Visualiza y compara progreso por Órbitas, Fases y Pulsos.</p>
        </div>
        <Tabs value={filters.level} onValueChange={handleLevelChange} className="w-full max-w-xs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orbits">Órbitas</TabsTrigger>
            <TabsTrigger value="phases">Fases</TabsTrigger>
            <TabsTrigger value="pulses">Pulsos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ProgressCircle} title="Promedio de progreso" value={`${stats.overallProgress}%`} footer={`${stats.stat1_value} órbitas`} progress={stats.overallProgress} />
          <StatCard icon={Orbit} title="Órbitas" value={stats.stat1_value.toString()} footer={stats.stat1_label} />
          <StatCard icon={Layers} title="Fases" value={stats.stat2_value.toString()} footer={stats.stat2_label} />
          <StatCard icon={CheckCircle} title="Pulsos" value={stats.stat3_value.toString()} footer={stats.stat3_label} />
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
                      top: 10, right: 20, bottom: 60, left: 0
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        height={50}
                        interval={0}
                        tick={<CustomTick />}
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
}

function StatCard({ title, value, footer, icon: Icon, progress }: StatCardProps) {
  return (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex items-center justify-center">
              {progress !== undefined ? (
                  <ProgressCircle progress={progress} className="h-10 w-10" />
              ) : (
                  <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                  </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground ml-14">{footer}</p>
        </CardContent>
    </Card>
  );
}
