
'use client';

import { useState } from 'react';
import { BookCheck, CalendarCheck, CalendarDays, Gauge, Target, TrendingUp, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaPrk, HabitTask, LifePrk } from '@/lib/types';
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

type ChartData = { date: string; Progreso: number }[];

interface AnalyticsDataForDashboard {
  stats: {
    overallProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    quarterlyProgress: number;
    lifePrksCount: number;
    areaPrksCount: number;
    tasksCompleted: number;
  };
  areaPrks: (AreaPrk & { progress: number; monthlyProgress: number })[];
  progressOverTime: {
    weekly: ChartData;
    monthly: ChartData;
    quarterly: ChartData;
    yearly: ChartData;
  };
  lifePrks: LifePrk[];
  allAreaPrks: AreaPrk[];
  allHabitTasks: HabitTask[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsDataForDashboard;
  onFilterChange: (filters: { lifePrkId?: string | null; areaPrkId?: string | null; habitTaskId?: string | null; }) => void;
  filters: { lifePrkId?: string | null; areaPrkId?: string | null; habitTaskId?: string | null; };
}

export function AnalyticsDashboard({ data, onFilterChange, filters }: AnalyticsDashboardProps) {
  const { stats, areaPrks, progressOverTime, lifePrks, allAreaPrks, allHabitTasks } = data;
  const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const [selectedLifePrk, setSelectedLifePrk] = useState<string | null>(filters.lifePrkId || null);
  const [selectedAreaPrk, setSelectedAreaPrk] = useState<string | null>(filters.areaPrkId || null);
  const [selectedHabitTask, setSelectedHabitTask] = useState<string | null>(filters.habitTaskId || null);

  const chartConfig = {
      Progreso: {
        label: "Progreso",
        color: "hsl(var(--primary))",
      },
  };

  const currentChartData = progressOverTime[chartView];

  const handleLifePrkChange = (value: string) => {
    const newLifePrkId = value === 'all' ? null : value;
    setSelectedLifePrk(newLifePrkId);
    setSelectedAreaPrk(null);
    setSelectedHabitTask(null);
    onFilterChange({ lifePrkId: newLifePrkId });
  }

  const handleAreaPrkChange = (value: string) => {
    const newAreaPrkId = value === 'all' ? null : value;
    setSelectedAreaPrk(newAreaPrkId);
    setSelectedHabitTask(null);
    onFilterChange({ lifePrkId: selectedLifePrk, areaPrkId: newAreaPrkId });
  }

  const handleResetFilters = () => {
    setSelectedLifePrk(null);
    setSelectedAreaPrk(null);
    setSelectedHabitTask(null);
    onFilterChange({});
  };
  
  const filteredAreaPrks = selectedLifePrk ? allAreaPrks.filter(ap => ap.life_prk_id === selectedLifePrk) : [];
  
  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resumen de Progreso</CardTitle>
          <CardDescription>
            Tu rendimiento en diferentes períodos de tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Progreso Semanal" value={`${stats.weeklyProgress}%`} icon={CalendarCheck} />
            <StatCard title="Progreso Mensual" value={`${stats.monthlyProgress}%`} icon={CalendarDays} />
            <StatCard title="Progreso Trimestral" value={`${stats.quarterlyProgress}%`} icon={TrendingUp} />
            <StatCard title="Progreso General" value={`${stats.overallProgress}%`} icon={Gauge} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Evolución del Progreso General</CardTitle>
              <CardDescription>
                Rendimiento histórico agrupado por período de tiempo.
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
                <Label htmlFor="life-prk-filter">PRK de Vida</Label>
                <Select value={selectedLifePrk ?? 'all'} onValueChange={handleLifePrkChange}>
                  <SelectTrigger id="life-prk-filter"><SelectValue placeholder="Seleccionar PRK de Vida" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos (General)</SelectItem>
                    {lifePrks.map(lp => <SelectItem key={lp.id} value={lp.id}>{lp.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1 w-full">
                 <Label htmlFor="area-prk-filter">PRK de Área</Label>
                 <Select value={selectedAreaPrk ?? 'all'} onValueChange={handleAreaPrkChange} disabled={!selectedLifePrk}>
                   <SelectTrigger id="area-prk-filter"><SelectValue placeholder="Seleccionar PRK de Área" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Todos en este PRK de Vida</SelectItem>
                      {filteredAreaPrks.map(ap => <SelectItem key={ap.id} value={ap.id}>{ap.title}</SelectItem>)}
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
            <CardTitle>Resumen de PRKs de Área</CardTitle>
            <CardDescription>
                Un desglose del progreso acumulado y del mes actual para cada área.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nombre del PRK de Área</TableHead>
                        <TableHead className="text-center">Progreso del Mes</TableHead>
                        <TableHead className="text-center">Progreso Acumulado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {areaPrks.map((item) => (
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

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function Label({ className, ...props }: LabelProps) {
    return (
        <label
            className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
            {...props}
        />
    )
}
