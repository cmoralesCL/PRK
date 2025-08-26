
'use client';

import { useState } from 'react';
import { BookCheck, CalendarCheck, CalendarDays, Gauge, Target, TrendingUp, Filter, Orbit, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsData, Phase, Pulse, Orbit as OrbitType } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Line, CartesianGrid, XAxis, YAxis, LineChart as RechartsLineChart } from "recharts"
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from './ui/button';
import { Label } from './ui/label';


type ChartData = { date: string; Progreso: number }[];

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onFilterChange: (filters: { orbitId?: string | null; phaseId?: string | null; pulseId?: string | null; }) => void;
  filters: { orbitId?: string | null; phaseId?: string | null; pulseId?: string | null; };
}

export function AnalyticsDashboard({ data, onFilterChange, filters }: AnalyticsDashboardProps) {
  const { stats, phases, progressOverTime, orbits, allPhases, allPulses } = data;
  const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const [selectedOrbit, setSelectedOrbit] = useState<string | null>(filters.orbitId || null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(filters.phaseId || null);
  const [selectedPulse, setSelectedPulse] = useState<string | null>(filters.pulseId || null);

  const chartConfig = {
      Progreso: {
        label: "Progreso",
        color: "hsl(var(--primary))",
      },
  };

  const currentChartData = progressOverTime[chartView];

  const handleOrbitChange = (value: string) => {
    const newOrbitId = value === 'all' ? null : value;
    setSelectedOrbit(newOrbitId);
    setSelectedPhase(null);
    setSelectedPulse(null);
    onFilterChange({ orbitId: newOrbitId, phaseId: null, pulseId: null });
  }

  const handlePhaseChange = (value: string) => {
    const newPhaseId = value === 'all' ? null : value;
    setSelectedPhase(newPhaseId);
    setSelectedPulse(null);
    onFilterChange({ orbitId: selectedOrbit, phaseId: newPhaseId, pulseId: null });
  }

  const handlePulseChange = (value: string) => {
    const newPulseId = value === 'all' ? null : value;
    setSelectedPulse(newPulseId);
    onFilterChange({ orbitId: selectedOrbit, phaseId: selectedPhase, pulseId: newPulseId });
  }

  const handleResetFilters = () => {
    setSelectedOrbit(null);
    setSelectedPhase(null);
    setSelectedPulse(null);
    onFilterChange({ orbitId: null, phaseId: null, pulseId: null });
  };
  
  const filteredPhases = selectedOrbit ? allPhases.filter(ap => ap.life_prk_id === selectedOrbit) : [];
  const filteredPulses = selectedPhase ? allPulses.filter(ht => ht.phase_ids.includes(selectedPhase)) : [];
  
  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resumen de Progreso</CardTitle>
          <CardDescription>
            Tu rendimiento en diferentes períodos de tiempo y el estado general de tu sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Progreso Semanal" value={`${stats.weeklyProgress}%`} icon={CalendarCheck} />
            <StatCard title="Progreso Mensual" value={`${stats.monthlyProgress}%`} icon={CalendarDays} />
            <StatCard title="Órbitas Activas" value={`${stats.orbitsCount}`} icon={Orbit} />
            <StatCard title="Fases Activas" value={`${stats.phasesCount}`} icon={Target} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Evolución del Progreso</CardTitle>
              <CardDescription>
                Rendimiento histórico. Usa los filtros para analizar áreas específicas.
              </CardDescription>
            </div>
            <ToggleGroup
              type="single"
              value={chartView}
              onValueChange={(value: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
                if (value) setChartView(value);
              }}
              size="sm"
            >
              <ToggleGroupItem value="weekly">Semanal</ToggleGroupItem>
              <ToggleGroupItem value="monthly">Mensual</ToggleGroupItem>
              <ToggleGroupItem value="quarterly">Trimestral</ToggleGroupItem>
              <ToggleGroupItem value="yearly">Anual</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/50 items-end">
              <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="orbit-filter">Órbita</Label>
                <Select value={selectedOrbit ?? 'all'} onValueChange={handleOrbitChange}>
                  <SelectTrigger id="orbit-filter"><SelectValue placeholder="Seleccionar Órbita" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas (General)</SelectItem>
                    {orbits.map(lp => <SelectItem key={lp.id} value={lp.id}>{lp.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1 w-full">
                 <Label htmlFor="phase-filter">Fase</Label>
                 <Select value={selectedPhase ?? 'all'} onValueChange={handlePhaseChange} disabled={!selectedOrbit}>
                   <SelectTrigger id="phase-filter"><SelectValue placeholder="Seleccionar Fase" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Todas en esta Órbita</SelectItem>
                      {filteredPhases.map(ap => <SelectItem key={ap.id} value={ap.id}>{ap.title}</SelectItem>)}
                   </SelectContent>
                 </Select>
              </div>
              <div className="grid gap-2 flex-1 w-full">
                 <Label htmlFor="pulse-filter">Pulso</Label>
                 <Select value={selectedPulse ?? 'all'} onValueChange={handlePulseChange} disabled={!selectedPhase}>
                   <SelectTrigger id="pulse-filter"><SelectValue placeholder="Seleccionar Pulso" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Todos en esta Fase</SelectItem>
                      {filteredPulses.map(ht => <SelectItem key={ht.id} value={ht.id}>{ht.title}</SelectItem>)}
                   </SelectContent>
                 </Select>
              </div>
               <Button variant="ghost" onClick={handleResetFilters} className="w-full md:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Limpiar Filtros
              </Button>
          </div>

          <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
            <RechartsLineChart 
                accessibilityLayer
                data={currentChartData}
                margin={{
                    top: 10,
                    right: 30,
                    bottom: 20,
                    left: 0,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value}
                    angle={-45}
                    textAnchor="end"
                    minTickGap={-10}
                />
                <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Line 
                    dataKey="Progreso"
                    type="monotone"
                    stroke="var(--color-Progreso)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: "var(--color-Progreso)",
                      strokeWidth: 2,
                      stroke: 'hsl(var(--background))'
                    }}
                />
            </RechartsLineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Resumen de Fases</CardTitle>
            <CardDescription>
                Un desglose del progreso acumulado y del mes actual para cada Fase.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nombre de la Fase</TableHead>
                        <TableHead className="text-center">Progreso del Mes</TableHead>
                        <TableHead className="text-center">Progreso Acumulado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {phases.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-center">
                                <ProgressBadge progress={item.monthlyProgress} />
                            </TableCell>
                            <TableCell className="text-center">
                                <ProgressBadge progress={item.progress} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>

    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="p-4 border rounded-lg flex flex-row items-center justify-between">
       <div className="flex flex-col space-y-1">
         <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
         <p className="text-2xl font-bold">{value}</p>
       </div>
       <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
       </div>
    </div>
  );
}

function ProgressBadge({ progress }: { progress: number }) {
    const value = Math.round(progress);
    const getBadgeClass = () => {
        if (value >= 75) return 'bg-green-100 text-green-800 border-green-200';
        if (value >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    return (
        <Badge variant="outline" className={cn("text-base font-bold", getBadgeClass())}>
            {value}%
        </Badge>
    );
}
