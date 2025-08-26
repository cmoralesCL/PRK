
'use client';

import { BarChart, Layers, Target, CheckCircle, Orbit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsData } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, BarChart as RechartsBarChart } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Level = 'orbits' | 'phases' | 'pulses';

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onFilterChange: (filters: { level: Level; orbitId?: string | null; phaseId?: string | null; }) => void;
  filters: { level: Level, orbitId?: string | null; phaseId?: string | null; };
}

export function AnalyticsDashboard({ data, onFilterChange, filters }: AnalyticsDashboardProps) {
  const { stats, chartData, orbits, allPhases } = data;

  const handleLevelChange = (value: Level) => {
    onFilterChange({ level: value, orbitId: null, phaseId: null });
  }

  const handleOrbitChange = (orbitId: string) => {
    const newOrbitId = orbitId === 'all' ? null : orbitId;
    onFilterChange({ level: 'phases', orbitId: newOrbitId, phaseId: null });
  }

  const handlePhaseChange = (phaseId: string) => {
    const newPhaseId = phaseId === 'all' ? null : phaseId;
    onFilterChange({ level: 'pulses', orbitId: filters.orbitId, phaseId: newPhaseId });
  }

  const chartConfig = {
      value: {
        label: "Progreso",
        color: "hsl(var(--primary))",
      },
  };
  
  const filteredPhases = filters.orbitId ? allPhases.filter(p => p.life_prk_id === filters.orbitId) : [];

  let chartTitle = 'Progreso por Órbita';
  if (filters.level === 'phases' && filters.orbitId) {
      const orbit = orbits.find(o => o.id === filters.orbitId);
      chartTitle = orbit ? `Progreso por Fase en "${orbit.title}"` : 'Progreso por Fase';
  } else if (filters.level === 'pulses' && filters.phaseId) {
       const phase = allPhases.find(p => p.id === filters.phaseId);
       chartTitle = phase ? `Progreso por Pulso en "${phase.title}"` : 'Progreso por Pulso';
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Analítica</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-2">
            <p className="text-muted-foreground flex-shrink-0">Explora el progreso por</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <Select value={filters.level} onValueChange={handleLevelChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar Nivel" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="orbits">Órbitas</SelectItem>
                        <SelectItem value="phases">Fases</SelectItem>
                        <SelectItem value="pulses">Pulsos</SelectItem>
                    </SelectContent>
                </Select>
                <Select 
                        value={filters.orbitId ?? 'all'} 
                        onValueChange={handleOrbitChange} 
                        disabled={filters.level === 'orbits'}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar Órbita" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las Órbitas</SelectItem>
                        {orbits.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select 
                        value={filters.phaseId ?? 'all'} 
                        onValueChange={handlePhaseChange} 
                        disabled={filters.level !== 'pulses' || !filters.orbitId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar Fase" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las Fases</SelectItem>
                        {filteredPhases.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>


       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={BarChart} title="Promedio de progreso" value={`${stats.overallProgress}%`} footer={`${data.orbits.length} órbitas`} />
            <StatCard icon={Orbit} title="Órbitas" value={stats.stat1_value.toString()} footer={stats.stat1_label} />
            <StatCard icon={Layers} title="Fases" value={stats.stat2_value.toString()} footer={stats.stat2_label} />
            <StatCard icon={CheckCircle} title="Pulsos" value={stats.stat3_value.toString()} footer={stats.stat3_label} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full h-96">
            <RechartsBarChart 
                accessibilityLayer
                data={chartData}
                margin={{
                    top: 10,
                    right: 10,
                    bottom: 80,
                    left: -10,
                }}
                barCategoryGap="20%"
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={100}
                />
                <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar 
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[4, 4, 0, 0]}
                />
            </RechartsBarChart>
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
}

function StatCard({ title, value, footer, icon: Icon }: StatCardProps) {
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{footer}</p>
        </CardContent>
    </Card>
  );
}
