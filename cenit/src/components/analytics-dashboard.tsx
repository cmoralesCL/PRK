
'use client';

import { useState } from 'react';
import { BarChart, Layers, Target, CheckCircle, Orbit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsData, Phase, Pulse, Orbit as OrbitType } from '@/lib/types';
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
  const { stats, chartData, allOrbits, allPhases } = data;

  const handleLevelChange = (value: Level) => {
    onFilterChange({ level: value, orbitId: null, phaseId: null });
  }

  const handleOrbitChange = (orbitId: string) => {
    const newOrbitId = orbitId === 'all' ? null : orbitId;
    onFilterChange({ level: filters.level, orbitId: newOrbitId, phaseId: null });
  }

  const handlePhaseChange = (phaseId: string) => {
    const newPhaseId = phaseId === 'all' ? null : phaseId;
    onFilterChange({ level: filters.level, orbitId: filters.orbitId, phaseId: newPhaseId });
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
      chartTitle = `Progreso por Fase en "${allOrbits.find(o => o.id === filters.orbitId)?.title}"`;
  } else if (filters.level === 'pulses' && filters.phaseId) {
       chartTitle = `Progreso por Pulso en "${allPhases.find(p => p.id === filters.phaseId)?.title}"`;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {allOrbits.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
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

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={BarChart} title="Promedio de progreso" value={`${stats.avgProgress}%`} footer={stats.stat1_label} />
            <StatCard icon={Layers} title={filters.level === 'orbits' ? 'Órbitas' : 'Fases'} value={stats.stat1_value.toString()} footer={stats.stat2_label} />
            <StatCard icon={Target} title={filters.level === 'pulses' ? 'Completados' : 'Pulsos'} value={stats.stat2_value.toString()} footer={filters.level === 'pulses' ? 'vs Pendientes' : 'en total'} />
            <StatCard icon={CheckCircle} title={filters.level === 'pulses' ? 'Pendientes' : 'Fases'} value={stats.stat3_value.toString()} footer={filters.level === 'pulses' ? '' : 'en total'} />
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
                    bottom: 60,
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
                />
                <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
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
